require('dotenv').config({verbose: true});
const PORT = 3000;
var assert = require('assert')
  , app = require('../index')
  , expected_id = 1
// Configure REST API host & URL
require('api-easy')
.describe('auth-rest')
.use('localhost', PORT)
.root('/api/v1')
.setHeader('Content-Type', 'application/json')
.setHeader('Accept', 'application/json')

// Initially: start server
.expect('Start server', function () {
  require('../api/authRest').deleteUser("alan");
  require('../api/authRest').deleteUser("alanee");
  require('../db/queueHelper').clearQueue();
  app.app.listen(PORT);
}).next()
// No special chars accepted
.post('/auth/create', {"username":"alan¨è","password":"testpassword"})
.expect(401)
.next()

// 1. Test with dummy user
.post('/auth/create', {"username":"alan","password":"testpassword"})
.expect('Should correctly create the user', function (err, res, body) {
  var result = JSON.parse(body);
  console.log(result);
})
.expect(200)
.next()
.post('/auth/login', {"username":"alan","password":"testpassword"})
.expect(200)
.expect('Token retrieved should not be expired', function (err, res, body) {
  var result = JSON.parse(body);
  assert.ok(!require("../api/authRest").isAuthenticated(result.token, null), 'The token is expired');
})
.next()
.post('/auth/login', {"username":"alan","password":"testpasswor"}).expect(401)
.next()
.post('/auth/create', {"username":"alanee","password":"testpassword"}).expect(200)
.next()
.post('/auth/create', {"username":"alanee","password":"testpassword"}).expect(401)

// Export tests for Vows
.export(module)
