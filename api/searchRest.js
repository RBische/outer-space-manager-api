var admin = require('../db/db')
var globalConfig = require('../config/globalConfig')
var userRest = require('../api/userRest')
var queueHelper = require('../db/queueHelper')
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database()
var ref = db.ref('outer-space-manager')

var search = {
  getSearches: function (req, res) {
    var searchesRef = ref.child('searches')
    searchesRef.once('value', function (snapshot) {
      console.log('Successfully fetched user')
      var searchFetched = snapshot.val()

      if (!searchFetched) {
        res.respond('No searches found', 'no_searches_found', 404)
        return
      }
      if (searchFetched) {
        res.json({
          size: searchFetched.length,
          searches: searchFetched
        })
      }
    }, function (errorObject) {
      console.log('Error fetching user : ' + errorObject)
    })
  },
  getSearchesForUser: function (req, res) {
    if (req.user.username !== undefined) {
      console.log('Current username:' + req.user.username)
      var searchesRef = ref.child('users/' + req.user.username + '/searches')
      searchesRef.once('value', function (snapshot) {
        console.log('Successfully fetched searches for user')
        var searchFetched = snapshot.val()

        if (!searchFetched) {
          res.respond('No searches found', 'no_searches_found', 404)
          return
        }
        if (searchFetched) {
          res.json({
            size: searchFetched.length,
            searches: searchFetched
          })
        }
      }, function (errorObject) {
        console.log('Error fetching user : ' + errorObject)
      })
    } else {
      res.respond('Invalid request, no username given', 'invalid_request', 401)
      return
    }
  },
  createSearchForUser: function (req, res) {
    console.log('Creating search')
    if (req.user !== undefined || req.user.username !== undefined || req.params.searchId !== undefined) {
      var user = req.user
      var searchesRef = ref.child('users/' + user.username + '/searches/' + req.params.searchId)
      searchesRef.once('value', function (snapshot) {
        var searchFetched = snapshot.val()
        console.log('Successfully fetched searches for user')
        if (searchFetched) {
          addSearchToQueue(req, res, user, searchFetched)
        } else {
          console.log('Searching search :' + '/searches/' + req.params.searchId)
          var searchesRef = ref.child('/searches/' + req.params.searchId)
          searchesRef.once('value', function (snapshot) {
            var searchFetched = snapshot.val()
            if (searchFetched) {
              console.log('Successfully fetched search')
              addSearchToQueue(req, res, user, searchFetched)
            } else {
              res.respond('Not searches found', 'no_searches_found', 404)
            }
          }, function (errorObject) {
            res.respond('Error in server side', 'internal_error', 500)
            console.log('Error fetching building : ' + errorObject)
          })
        }
      }, function (errorObject) {
        console.log('Error fetching searches for user : ' + errorObject)
      })
    } else {
      res.respond('Invalid request, no username given', 'invalid_request', 401)
      return
    }
  },
  addSearch: function (username, searchId) {
    console.log('Must update search ' + searchId + ' for username ' + username)
    var searchesRef = ref.child('searches/' + searchId)
    searchesRef.once('value', function (snapshot) {
      var searchFetched = snapshot.val()

      if (!searchFetched) {
        return
      }
      if (searchFetched) {
        console.log('Updating search ' + searchId)
        var userRef = ref.child('users/' + username + '/searches')
        var searchToSave = {}
        searchToSave = extend(searchFetched, {level: 1})
        var searches = {}
        searches[searchId] = searchToSave
        userRef.update(searches)
      }
    }, function (errorObject) {
      console.log('Error fetching search : ' + errorObject)
    })
  }
}

function addSearchToQueue (req, res, user, searchFetched) {
  var futureLevel = 1
  if (searchFetched.level) {
    futureLevel = futureLevel + searchFetched.level
  }
  console.log('Search future level: ' + futureLevel)
  var mineralCost = searchFetched.mineralCostByLevel * (futureLevel - 1) + searchFetched.mineralCostLevel0
  console.log('Mineral cost ' + searchFetched.mineralCostByLevel * (futureLevel - 1) + ' - current resources ' + user.minerals)
  var gasCost = searchFetched.gasCostByLevel * (futureLevel - 1) + searchFetched.gasCostLevel0
  if (userRest.hasSufficientResources(user.minerals, user.gas, mineralCost, gasCost)) {
    console.log('Is building : ' + searchFetched.building)
    if (!searchFetched.building) {
      console.log('Using minerals ' + user.minerals)
      console.log('Current minerals : ' + user.minerals + ' And after : ' + (user.minerals - mineralCost))
      userRest.changeResources(user.username, -mineralCost, -gasCost, true)
      const points = globalConfig.calculatePointsForUser(mineralCost, gasCost)
      console.log('Minerals transaction done')
      const speedFromBuildings = user['speed_search'] ? user['speed_search'] : 0
      const speedFromSearch = user['speed_search_from_search'] ? user['speed_search_from_search'] : 0
      var executionTime = globalConfig.calculateExecutionTimeForSearch(speedFromBuildings + speedFromSearch, (futureLevel - 1), searchFetched.timeToBuildLevel0, searchFetched.timeToBuildByLevel, req.params.searchId)
      console.log('Search will be ok at : ' + executionTime + ' It is now : ' + Date.now())
      searchFetched.level = futureLevel
      ref.child('users/' + user.username + '/searches/' + req.params.searchId).update({building: true},
        function () {
          searchFetched.building = false
          queueHelper.addToQueue('searches', searchFetched, 'users/' + user.username + '/searches/' + req.params.searchId, executionTime, points, user.username,
            function () {
              res.json({code: 'ok'})
            }
          )
        }
      )
    } else {
      res.respond('Search already in queue', 'already_in_queue', 401)
      return
    }
  } else {
    res.respond('Not enough resources', 'not_enough_resources', 401)
    return
  }
}

function extend (target) {
  var sources = [].slice.call(arguments, 1)
  sources.forEach(function (source) {
    for (var prop in source) {
      target[prop] = source[prop]
    }
  })
  return target
}

module.exports = search
