const request = require('supertest')
// require('dotenv').config({verbose: true})
const app = require('../../index')
const token = require('../../api/authRest').pushToken('alan')
const test = require('tape')

// Useful to end the process when the tests are done
test.onFinish(() => process.exit(0))

test('GET /api/vXXX/users/0/1', function (assert) {
  request(app)
  .get('/api/v1/users/0/1')
  .set('x-access-token', token.token)
  .expect(200)
  .end(function (err, res) {
    console.log(JSON.stringify(err))
    assert.true(err === null)
    var result = res.body
    console.log(JSON.stringify(result))
    assert.true(result.users !== undefined, 'The list does not contains users')
    assert.end()
  })
})
