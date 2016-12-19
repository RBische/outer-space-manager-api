require('dotenv').config({verbose: true});
const PORT = 3000;
var assert = require('assert')
  , app = require('../index')
  , expected_id = 1
require('../api/authRest').deleteUser("alanee@osm.com");
// Configure REST API host & URL
require('api-easy')
.describe('auth-rest')
.use('localhost', PORT)
.root('/api/v1')
.setHeader('Content-Type', 'application/json')
.setHeader('Accept', 'application/json')

// Initially: start server
.expect('Start server', function () {
  app.app.listen(PORT);
}).next()

// 1. Test with dummy user
.post('/auth/create', {"username":"alan@osm.com","password":"testpassword"})
.post('/auth/login', {"username":"alan@osm.com","password":"testpassword"}).expect(200)
.next()
.post('/auth/login', {"username":"alan@osm.com","password":"testpasswor"}).expect(401)
.next()
.post('/auth/create', {"username":"alanee@osm.com","password":"testpassword"}).expect(200)
.next()
.post('/auth/create', {"username":"alanee@osm.com","password":"testpassword"}).expect(401)

// Export tests for Vows
.export(module)
