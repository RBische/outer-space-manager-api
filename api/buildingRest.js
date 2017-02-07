var admin = require('../db/db')
var globalConfig = require('../config/globalConfig')
var userRest = require('../api/userRest')
var queueHelper = require('../db/queueHelper')
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database()
var ref = db.ref('outer-space-manager')

var building = {
  getBuildings: function (req, res) {
    var buildingsRef = ref.child('buildings')
    buildingsRef.once('value', function (snapshot) {
      console.log('Successfully fetched user')
      var buildingFetched = snapshot.val()

      if (!buildingFetched) {
        res.respond('No buildings found', 'no_buildings_found', 404)
        return
      }
      if (buildingFetched) {
        res.json({
          size: buildingFetched.length,
          buildings: buildingFetched
        })
      }
    }, function (errorObject) {
      console.log('Error fetching user : ' + errorObject)
    })
  },
  getBuildingsForUser: function (req, res) {
    if (req.user.username !== undefined) {
      console.log('Current username:' + req.user.username)
      var buildingsRef = ref.child('users/' + req.user.username + '/buildings')
      buildingsRef.once('value', function (snapshot) {
        console.log('Successfully fetched buildings for user')
        var buildingFetched = snapshot.val()

        if (!buildingFetched) {
          res.respond('No buildings found', 'no_buildings_found', 404)
          return
        }
        if (buildingFetched) {
          res.json({
            size: buildingFetched.length,
            buildings: buildingFetched
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
  createBuildingForUser: function (req, res) {
    if (req.user !== undefined || req.user.username !== undefined || req.params.buildingId !== undefined) {
      var user = req.user
      var buildingsRef = ref.child('users/' + user.username + '/buildings/' + req.params.buildingId)
      buildingsRef.once('value', function (snapshot) {
        var buildingFetched = snapshot.val()
        console.log('Successfully fetched buildings for user')
        if (!buildingFetched) {
          var buildingsRef = ref.child('/buildings/' + req.params.buildingId)
          buildingsRef.once('value', function (snapshot) {
            var buildingFetched = snapshot.val()
            if (buildingFetched) {
              console.log('Successfully fetched building')
              constructBuilding(req, res, user, buildingFetched)
            } else {
              res.respond('No buildings found', 'no_buildings_found', 404)
            }
          }, function (errorObject) {
            res.respond('Error in server side', 'internal_error', 500)
            console.log('Error fetching building : ' + errorObject)
          })
        } else {
          constructBuilding(req, res, user, buildingFetched)
        }
      }, function (errorObject) {
        res.respond('Error in server side', 'internal_error', 500)
        console.log('Error fetching buildings for user : ' + errorObject)
      })
    } else {
      res.respond('Invalid request, no username given', 'invalid_request', 401)
      return
    }
  },
  addBuilding: function (username, buildingId) {
    console.log('Must update building ' + buildingId + ' for username ' + username)
    var buildingsRef = ref.child('buildings/' + buildingId)
    buildingsRef.once('value', function (snapshot) {
      var buildingFetched = snapshot.val()

      if (!buildingFetched) {
        return
      }
      if (buildingFetched) {
        console.log('Updating building ' + buildingId)
        var userRef = ref.child('users/' + username + '/buildings')
        var buildingToSave = {}
        buildingToSave = extend(buildingFetched, {level: 1})
        var buildings = {}
        buildings[buildingId] = buildingToSave
        userRef.update(buildings)
      }
    }, function (errorObject) {
      console.log('Error fetching building : ' + errorObject)
    })
  }
}

function constructBuilding (req, res, user, buildingFetched) {
  var futureLevel = 1
  if (buildingFetched.level) {
    futureLevel = futureLevel + buildingFetched.level
  }
  console.log('Building future level: ' + futureLevel)
  var mineralCost = buildingFetched.mineralCostByLevel * (futureLevel - 1) + buildingFetched.mineralCostLevel0
  console.log('Mineral cost ' + mineralCost)
  var gasCost = buildingFetched.gasCostByLevel * (futureLevel - 1) + buildingFetched.gasCostLevel0
  if (userRest.hasSufficientResources(user.minerals, user.gas, mineralCost, gasCost)) {
    console.log('Is building : ' + buildingFetched.building)
    if (!buildingFetched.building) {
      console.log('Using minerals ' + user.minerals)
      console.log('Current minerals : ' + user.minerals + ' And after : ' + (user.minerals - mineralCost))
      userRest.changeResources(user.username, -mineralCost, -gasCost)
      const points = globalConfig.calculatePointsForUser(mineralCost, gasCost)
      console.log('Minerals transaction done')
      const speedFromBuildings = user['speed_building'] ? user['speed_building'] : 0
      const speedFromSearch = user['speed_building_from_search'] ? user['speed_building_from_search'] : 0
      var executionTime = globalConfig.calculateExecutionTimeForBuilding(speedFromBuildings + speedFromSearch, futureLevel - 1, buildingFetched.timeToBuildLevel0, buildingFetched.timeToBuildByLevel, req.params.buildingId)
      console.log('Building will be ok at : ' + executionTime + ' It is now : ' + Date.now())
      buildingFetched.level = futureLevel
      ref.child('users/' + user.username + '/buildings/' + req.params.buildingId).update({building: true},
        function () {
          buildingFetched.building = false
          queueHelper.addToQueue('buildings', buildingFetched, 'users/' + user.username + '/buildings/' + req.params.buildingId, executionTime, points, user.username,
            function () {
              res.json({code: 'ok'})
            }
          )
        }
      )
    } else {
      res.respond('Building already in queue', 'already_in_queue', 401)
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

module.exports = building
