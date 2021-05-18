import query from '../prisma/query'
import {Router, Request, Response} from 'express'
import {Aircraft, User} from '@prisma/client'
import {resMsg} from './baseRouter'
const aircraftRouter = Router()

// READ ()
aircraftRouter.get('/', async (req: Request, res: Response) => {
  try {
    res.status(200).send(
      await query.readAirsAtReq(req, 0)
    )
  } catch (e) {
    res.status(500).send(resMsg.on500(req, e))
  }
})

aircraftRouter.get('/lastUpdated', async (req: Request, res: Response) => {
  try {
    res.status(200).send(
      {
        serverEpoch: Date.now(),
        data: await query.readAirsAtReq(req, 0)
      }
    )
  } catch (e) {
    res.status(500).send(resMsg.on500(req, e))
  }
})

// UPDATE || CREATE (Aircraft)
aircraftRouter.put('/', async (req: Request, res: Response) => {
  try {
    const reqAir: Aircraft = req.body
    const highestRole = await query.readHighestRole(req)

    if (reqAir.aircraftId == 0 && highestRole >= 3) {
      const reqName = query.readName(req)

      // we have asserted that this req has a role >= 3 on some aircraft,
      // so we can grab a copy of that to pass to the new aircraft
      const reqUser = await query.readFirstUserAtName(reqName)

      // they should be able to create users with role 3
      reqUser.role = 4

      try {
        await query.upsertAircraftShallow(reqAir, reqUser)
        res.status(200).send(resMsg.on200(req))
      } catch (e) {
        res.status(400).send(resMsg.on400(req))
      }
    }

    // UPDATE
    else if ((await query.readRoleAtAircraftId(req, reqAir.aircraftId)) >= 3) {
      try {
        const mockUser: User = {
          aircraftId: 0,
          role: 0,
          name: 'mock',
          userId: 0,
        }
        await query.upsertAircraftShallow(reqAir, mockUser)
        res.status(200).send(resMsg.on200(req))
      } catch (e) {
        res.status(400).send(resMsg.on400(req))
      }
    } else {
      const role = await query.readRoleAtAircraftId(req, reqAir.aircraftId)
      res.status(403).send(resMsg.on403(3, role, req))
    }
  } catch (e) {
    res.status(500).send(resMsg.on500(req, e))
  }
})

// DELETE ({aircraftId})
aircraftRouter.delete('*', async (req: Request, res: Response) => {
  try {
    const aircraftId = Number(`${req.query['aircraftId']}`)
    const roleAtAir = await query.readRoleAtAircraftId(req, aircraftId)

    if (roleAtAir > 2) {
      await query.deleteAircraft(aircraftId) // recursive delete to all nested relationships
      res.status(200).send(resMsg.on200(req))
    } else {
      res.status(403).send(resMsg.on403(2, roleAtAir, req))
    }
  } catch (e) {
    res.status(500).send(resMsg.on500(req, e))
  }
})

export default aircraftRouter
