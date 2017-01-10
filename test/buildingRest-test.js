require('dotenv').config({verbose: true});
const PORT = 3001;
var assert = require('assert')
  , app = require('../index')
  , expected_id = 1;
var token = require('../api/authRest').pushToken("alane@osm.com");
require('../api/buildingRest').addBuilding("alan", 0);
// Configure REST API host & URL
require('api-easy')
.describe('building-rest')
.use('localhost', PORT)
.root('/api/v1')
.setHeader('Content-Type', 'application/json')
.setHeader('Accept', 'application/json')

// Initially: start server
.expect('Start server', function () {
  app.app.listen(PORT);
}).next()
.setHeader('x-access-token', token.token)
// 1. Get list of buildings
.get('/buildings')
.expect(200)
.expect('Should have more than zero buildings', function (err, res, body) {
  var result = JSON.parse(body);
  assert.ok(result.buildings.length > 0, 'The list does not contains buildings');
})
.next()
// 2. Get list for the alan
.get('/buildings/list/alan')
.expect(200)
.expect('Should have more than zero buildings', function (err, res, body) {
  var result = JSON.parse(body);
  assert.ok(result.buildings.length > 0, 'The list does not contains buildings');
})
.next()

// Export tests for Vows
.export(module)
