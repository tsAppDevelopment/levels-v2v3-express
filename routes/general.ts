import {Router, Request, Response} from 'express'
import query from '../prisma/query'
const router = Router()

// the general route is used to authenticate users agains the
// auth table in postgress, once the role is found from the table,
// the api will send a general object to the ui.

// for example, the home screen will diplay diffrent buttons that allow
// admin users to perform crud ops on a users auth object
router.get('/', async (req: Request, res: Response) => {
  try {
    const role = await query.readHighestRole(req)

    const general = await query.readGeneral(role)

    res.status(200).send(general)

    console.log('/general called and sent 200')
  } catch (error) {
    res.status(500).send('oops')
  }
})

export default router
