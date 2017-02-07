require('dotenv').config({verbose: true})
const PORT = 3001
var assert = require('assert')
var app = require('../../index')
var token = require('../../api/authRest').pushToken('alan')
// Configure REST API host & URL
require('api-easy')
.describe('building-rest')
.use('localhost', PORT)
.root('/api/v1')
.setHeader('Content-Type', 'application/json')
.setHeader('Accept', 'application/json')

// Initially: start server
.expect('Start server', function () {
  app.listen(PORT)
}).next()
.expect('Creating building', function () {
  require('../../api/buildingRest').addBuilding('alan', 0)
}).next()
.setHeader('x-access-token', token.token)
// 1. Get list of buildings
.get('/buildings')
.expect(200)
.expect('Should have more than zero buildings', function (err, res, body) {
  assert.ok(err === null)
  var result = JSON.parse(body)
  assert.ok(result.buildings.length > 0, 'The list does not contains buildings')
})
.next()
// 2. Get list for the alan
.get('/buildings/list')
.expect(200)
.expect('Should have more than zero buildings', function (err, res, body) {
  assert.ok(err === null)
  var result = JSON.parse(body)
  assert.ok(result.buildings.length > 0, 'The list does not contains buildings')
})
.next()
// 3. Builds a build for a specific user
.post('/buildings/create/0', {})
.expect(401)
.next()
.expect('Giving resources', function () {
  require('../../api/userRest').changeResources('alan', 300, 300)
}).next()
.post('/buildings/create/0', {})
.expect(200)
.next()
.post('/buildings/create/0', {})
.expect(401)
.expect('Should have not_enough_resources code', function (err, res, body) {
  assert.ok(err === null)
  var result = JSON.parse(body)
  console.log(body)
  assert.ok(result.internalCode === 'not_enough_resources')
})
.next()
.expect('Giving resources', function () {
  require('../../api/userRest').changeResources('alan', 300, 300)
}).next()
.post('/buildings/create/0', {})
.expect(401)
.expect('Should have already_in_queue code', function (err, res, body) {
  assert.ok(err === null)
  var result = JSON.parse(body)
  console.log(body)
  assert.ok(result.internalCode === 'already_in_queue')
})
.next()

// Export tests for Vows
.export(module)
