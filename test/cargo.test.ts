import {seedTest} from '../prisma/seed_test'
import {role0e, role1e, role2e, role3e} from './utils'
import {Done} from 'mocha'
import req from 'supertest'
import assert from 'assert'
import app from '../server'
import {Cargo, PrismaClient} from '@prisma/client'
//import query from '../prisma/query'

const prisma = new PrismaClient()

// READ
describe('GET /cargo', () => {
  before(async () => {
    await seedTest.deleteAll()
    await seedTest.C_17_A_ER()
  })

  it('Should return cargos[] of an aircraft given req.role on that aircraft >= 1', (done: Done) => {
    req(app)
      .get('/cargo')
      .set('authorization', role1e)
      .send({aircraftid: 1}) // query all cargo on air
      .expect(200)
      .expect((res) => {
        assert(res.body.length != 0)
      })
      .end(done)
  })

  it('Should 403 where req.role <1 on aircraft', (done: Done) => {
    req(app)
      .get('/cargo')
      .set('authorization', role0e)
      .send({aircraftid: 1}) // query all cargo on air
      .expect(403)
      .end(done)
  })
})

// UPDATE || CREATE
describe('PUT /cargo', () => {
  const updateCargo: Cargo = {
    aircraftid: 1,
    cargoid: 1,
    name: 'update cargo name',
    fs: 221,
    weight: 200
  }

  const updateCargoNonUnique: Cargo = {
    aircraftid: 1,
    cargoid: 1,
    name: 'Pax info card',
    fs: 221,
    weight: 200
  }

  const newCargo: Cargo = {
    aircraftid: 1,
    cargoid: 0,
    name: 'new cargo',
    fs: 221,
    weight: 200
  }

  before(async () => {
    await seedTest.deleteAll()
    await seedTest.C_17_A_ER()
  })

  it('Should return 200 and update where cargo is unquique && req.role >= 3', (done: Done) => {
    req(app)
      .put('/cargo')
      .set('authorization', role3e)
      .send(updateCargo)
      .expect(200)
      .end(done)
  })

  it('Should return 200 and create where cargo is unquique && req.role >= 3', (done: Done) => {
    req(app)
      .put('/cargo')
      .set('authorization', role3e)
      .send(newCargo)
      .expect(200)
      .expect(async () => {
        const name_aircraftid = {
          aircraftid: newCargo.aircraftid,
          name: newCargo.name,
        }
        const found = await prisma.cargo.findUnique({
          where: {name_aircraftid},
        })
        assert.deepStrictEqual(found.name, newCargo.name)
        assert.deepStrictEqual(found.weight, newCargo.weight)
        assert.deepStrictEqual(found.aircraftid, newCargo.aircraftid)
      })
      .end(done)
  })

  it('Should return 403 where req.role <= 2 on aircraft', (done: Done) => {
    req(app)
      .put('/cargo')
      .set('authorization', role2e)
      .send(updateCargo)
      .expect(403)
      .end(done)
  })

  it('Should return 400 where cargo name and aircraft id is not unique UPDATE', (done: Done) => {
    req(app)
      .put('/cargo')
      .set('authorization', role3e)
      .send(updateCargoNonUnique)
      .expect(400)
      .end(done)
  })
})

// DELETE
describe('DELETE /cargo', () => {
  before(async () => {
    await seedTest.deleteAll()
    await seedTest.C_17_A_ER()
  })

  it('Should 403 where req.role <= 2 on aircraft', (done: Done) => {
    req(app)
      .delete('/cargo')
      .set('authorization', role2e)
      .send({cargoid: 1})
      .expect(403)
      .end(done)
  })

  it('Should 200 and delete where req.role <= 2 on aircraft', (done: Done) => {
    req(app)
      .delete('/cargo')
      .set('authorization', role3e)
      .send({cargoid: 1})
      .expect(200)
      .expect(async () => {
        let didFind: boolean
        await prisma.cargo
          .findUnique({where: {cargoid: 1}})
          .then(() => {
            didFind = true
          })
          .catch(() => {
            didFind = false
          })
        assert.deepStrictEqual(didFind, false)
      })
      .end(done)
  })
})
