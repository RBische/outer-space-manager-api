const request = require('supertest')
require('dotenv').config({verbose: true})
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
