const PORT = 3000;
var assert = require('assert')
  , app = require('../index')
  , bookmark = {
      "title": "Google",
      "url":   "http://www.google.com",
      "tags":  [ "google", "search" ]
    }
  , expected_id = 1

// Configure REST API host & URL
require('api-easy')
.describe('bookmarks-rest')
.use('localhost', PORT)
.root('/bookmarks')
.setHeader('Content-Type', 'application/json')
.setHeader('Accept', 'application/json')

// Initially: start server
.expect('Start server', function () {
  app.app.listen(PORT);
}).next()

// Finally: clean, and stop server
.expect('Clean & exit', function () {
  app.db.deleteAll(function () { app.close() });
})

// Export tests for Vows
.export(module)
