import {query} from '../prisma/query'
import {Router, Request, Response} from 'express'
import { localMemCache } from '../prisma/localMemCache'

const aircraftRouter = Router()

const allAirMap = async () => {
  return (await query.readAircrafts()).reduce((prev,curr) => {
    prev[curr.aircraftId] = curr
    return prev
  }, {} as any)
}

// READ ()
aircraftRouter.get('/', async (req: Request, res: Response) => {
  try {
    res.status(200).json(await query.readAirsAtReqShallow(req, 0))
  } catch (e) {
    res.status(500).json()
  }
})

aircraftRouter.get('/lastUpdated', async (req: Request, res: Response) => {
  try {

    const [allowedShallow, deep] = await Promise.all([
      query.readAirsAtReqShallow(req, 0),
      localMemCache({
        fallback: allAirMap,
        key: 'allAircraftMap'
      })
    ])  
    
    // for each allowed shallow aircraft, return the cached deep one
    const data = allowedShallow.map(allowed => deep[allowed.aircraftId])

    res.status(200).json({
      serverEpoch: Date.now(),
      data
    })
  } catch (e) {
    console.error(e)
    res.status(500).json()
  }
})

// UPDATE || CREATE (Aircraft)
aircraftRouter.put('/', async (req: Request, res: Response) => {
  try {
    req.body.updatedBy = query.readName(req)
    req.body.updated = new Date()
    const roleGE = 3
    const reqAir = req.body
    const user = await query.readUserWithHighestRole(req)

    if (reqAir.aircraftId === 0 && user.role >= roleGE) {
      // they should be able to create users with role 3
      user.role = 4

      try {
        await query.upsertAircraftShallow(reqAir, user)
        res.status(200).json()
      } catch (e) {
        res.status(400).json()
      }
    }

    // UPDATE
    else if ((await query.readRoleAtAircraftId(req, reqAir.aircraftId)) >= 3) {
      try {
        await query.upsertAircraftShallow(reqAir, user)
        res.status(200).json()
      } catch (e) {
        res.status(400).json()
      }
    } else {
      res.status(403).json()
    }
  } catch (e) {
    res.status(500).json()
  }
})

// DELETE ({aircraftId})
aircraftRouter.delete('*', async (req: Request, res: Response) => {
  try {
    const roleGE = 3
    try {
      const aircraftId = Number(req.query['aircraftId'])
      const user = await query.readUserAtReqAndAircraftId(req, aircraftId)

      if (user.role >= roleGE) {
        await query.deleteAircraft(aircraftId) // recursive delete to all nested relationships
        res.status(200).json()
      } else {
        res.status(403).json()
      }
    } catch (e) {
      res.status(403).json()
    }
  } catch (e) {
    res.status(500).json()
  }
})

export default aircraftRouter
