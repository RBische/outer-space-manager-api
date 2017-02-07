require('dotenv').config({verbose: true})
const PORT = 3004
var assert = require('assert')
var app = require('../../index')
var token = require('../../api/authRest').pushToken('alansearch')
// Configure REST API host & URL
require('api-easy')
.describe('fleet-rest')
.use('localhost', PORT)
.root('/api/v1')
.setHeader('Content-Type', 'application/json')
.setHeader('Accept', 'application/json')

// Initially: start server
.expect('Start server', function () {
  app.listen(PORT)
}).next()
.setHeader('x-access-token', token.token)
// 1. Get list of ships
.get('/ships')
.expect(200)
.expect('Should have more than zero ships', function (err, res, body) {
  assert.ok(err === null)
  var result = JSON.parse(body)
  assert.ok(result.ships.length > 0, 'The list does not contains ships')
})
.next()
// 2. Get fleet for alan
.get('/fleet/list')
.expect(200)
.expect('Should have a body and something like an int as a result', function (err, res, body) {
  assert.ok(err === null)
  var result = JSON.parse(body)
  assert.ok(result.size >= 0, 'The fleet is corrupted')
})
.next()

// Export tests for Vows
.export(module)
