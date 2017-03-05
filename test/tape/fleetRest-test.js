const request = require('supertest')
require('dotenv').config({verbose: true})
const admin = require('../../db/db')
const db = admin.database()
const app = require('../../index')
const token = require('../../api/authRest').pushToken('alan')
const test = require('tape')

// Useful to end the process when the tests are done
test.onFinish(() => process.exit(0))

test('GET /api/v1/ships', function (assert) {
  request(app)
  .get('/api/v1/ships')
  .set('x-access-token', token.token)
  .expect(200)
  .end(function (err, res) {
    console.log(JSON.stringify(err))
    assert.true(err === null)
    var result = res.body
    assert.true(result.ships.length > 0, 'The list does not contains ships')
    assert.end()
  })
})

test('POST /api/v1/ships/create/:shipId', function (assert) {
  require('../../api/userRest')
  .changeResources('alan', 300, 100)
  .then(function (res) {
    request(app)
    .post('/api/v1/ships/create/0')
    .set('x-access-token', token.token)
    .send({amount: 1})
    .expect(200)
    .end(function (err, res) {
      console.log(JSON.stringify(err))
      console.log(JSON.stringify(res))
      assert.true(err === null)
      var result = res.body
      assert.true(result.code === 'ok')
      assert.end()
    })
  })
  .catch(function (rejection) {
    assert.fail(rejection)
    assert.end()
  })
})

test('POST /api/v1/fleet/attack/alansearch', function (assert) {
  return new Promise(function (resolve, reject) {
    db.ref('outer-space-manager/users/alan').update({fleet: {0: {
      'shipId': 0,
      'name': 'Chasseur léger',
      'spatioportLevelNeeded': 0,
      'timeToBuild': 30,
      'mineralCost': 300,
      'gasCost': 100,
      'minAttack': 40,
      'maxAttack': 60,
      'life': 60,
      'shield': 15,
      'speed': 1000,
      'amount': 1
    }}}, function (err) {
      console.log(err)
      resolve()
    })
  })
  .then(function (res) {
    return new Promise(function (resolve, reject) {
      db.ref('outer-space-manager/users/alansearch').update({fleet: {0: {
        'shipId': 0,
        'name': 'Chasseur léger',
        'spatioportLevelNeeded': 0,
        'timeToBuild': 30,
        'mineralCost': 300,
        'gasCost': 100,
        'minAttack': 40,
        'maxAttack': 60,
        'life': 60,
        'shield': 15,
        'speed': 1000,
        'amount': 1
      }}}, function (err) {
        console.log(err)
        resolve()
      })
    })
  })
  .then(function (res) {
    console.log('Executing then')
    request(app)
    .post('/api/v1/fleet/attack/alansearch')
    .set('x-access-token', token.token)
    .send({ships: [{shipId: 0, amount: 1}]})
    .expect(200)
    .end(function (err, res) {
      console.log(JSON.stringify(err))
      console.log(JSON.stringify(res))
      assert.true(err === null)
      var result = res.body
      assert.true(result.code === 'ok')
      assert.end()
    })
  })
  .catch(function (rejection) {
    assert.fail(rejection)
    assert.end()
  })
})

test('GET /', function (assert) {
  request(app)
  .get('/')
  .expect(200)
  .end(function (err, res) {
    console.log(JSON.stringify(err))
    assert.true(err === null)
    assert.end()
  })
})
