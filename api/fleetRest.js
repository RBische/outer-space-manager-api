const admin = require('../db/db')
const queueHelper = require('../db/queueHelper')
// As an admin, the app has access to read and write all data, regardless of Security Rules
const db = admin.database()
const ref = db.ref('outer-space-manager')
const globalConfig = require('../config/globalConfig')
const userRest = require('../api/userRest')

const fleet = {
  getShips: function (req, res) {
    var shipsRef = ref.child('ships')
    shipsRef.once('value', function (snapshot) {
      console.log('Successfully fetched ships')
      var shipsFetched = snapshot.val()

      if (!shipsFetched) {
        res.respond('No ships found', 'no_ships_found', 404)
        return
      }
      if (shipsFetched) {
        res.json({
          size: shipsFetched.length,
          ships: shipsFetched
        })
      }
    }, function (errorObject) {
      console.log('Error fetching ships : ' + errorObject)
    })
  },
  getShipsForUser: function (req, res) {
    if (req.user.username !== undefined) {
      console.log('Current username:' + req.user.username)
      var shipsRef = ref.child('users/' + req.user.username + '/fleet')
      shipsRef.once('value', function (snapshot) {
        console.log('Successfully fetched fleet for user')
        var shipsFetched = snapshot.val()
        if (shipsFetched) {
          res.json({
            size: shipsFetched.length,
            searches: shipsFetched
          })
        } else {
          res.json({
            size: 0,
            searches: []
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
  addShip: function (username, shipId, amount) {
    console.log('Must add ship ' + shipId + ' for username ' + username)
    var shipsRef = ref.child('ships/' + shipId)
    return new Promise(function (resolve, reject) {
      shipsRef.once('value', function (snapshot) {
        var shipfetched = snapshot.val()
        if (!shipfetched) {
          reject()
        } else {
          resolve(shipfetched)
        }
      }, function (errorObject) {
        console.log('Error fetching building : ' + errorObject)
      })
    })
    .then(function (shipfetched) {
      console.log('Creating ships ' + shipId)
      return new Promise(function (resolve, reject) {
        var shipsRef = ref.child('users/' + username + '/fleet/' + shipId)
        shipsRef.once('value', function (snapshot) {
          var userShipsFetched = snapshot.val()
          if (userShipsFetched) {
            userShipsFetched.amount = userShipsFetched.amount + amount
            resolve(userShipsFetched)
          } else {
            const firstShip = shipfetched
            firstShip.amount = amount
            resolve(firstShip)
          }
        })
      })
    })
    .then(function (ships) {
      // var userRef = ref.child('users/' + username + '/fleet/' + shipId)
      // return userRef.update(ships)
    })
    .catch(function (rejection) {
      console.log('Oups :' + rejection)
    })
  },

  /**
   * @api {post} /api/vXXX/ships/create/:shipId Creates ships
   * @apiDescription Creates the specified amount of ships
   * @apiName CreateShip
   * @apiGroup Fleet
   * @apiVersion 1.0.0
   *
   * @apiParam {Integer} shipId The ship id that the player wants to create
   * @apiParam {Integer} amount The amount of this ship that will be created
   *
   * @apiSuccessExample {json} Success
   *     HTTP/1.1 200 OK
   *     {
   *       internalCode: "ok"
   *     }
   * @apiError invalid_request Missing shipId or amount (401)
   * @apiError not_enough_resources Not enough resources to build these ships (401)
   * @apiError no_ships_found This ship does not exist (404)
   * @apiError internal_error Something went wrong, try again later (500)
   */
  createShip: function (req, res, next) {
    console.log('Creating ship' + JSON.stringify(req.params))
    if (req.params.shipId !== undefined && req.body.amount !== undefined) {
      var user = req.user
      fleet.constructShips(res, user, req.params.shipId, req.body.amount)
      .catch(function (rejection) {
        console.log(rejection)
      })
    } else {
      res.respond('Invalid request, no shipId or no amount given', 'invalid_request', 401)
      return
    }
  },
  constructShips: function (response, user, shipId, amount) {
    return ref.child('users/' + user.username + '/fleet/' + shipId)
      .once('value')
      .then(function (res) {
        if (!res.val()) {
          return ref.child('ships/' + shipId)
            .once('value')
            .then(function (res) {
              if (!res.val()) {
                response.respond('No ships found', 'no_ships_found', 404)
                return Promise.reject({code: 'no_ships_found', info: shipId})
              } else {
                return res.val()
              }
            }, function (error) {
              console.error(error)
              response.respond('Error in server side', 'internal_error', 500)
              return Promise.reject({code: 'InternalError', info: error})
            })
        } else {
          return res.val()
        }
      }, function (error) {
        console.error(error)
        response.respond('Error in server side', 'internal_error', 500)
        return Promise.reject({code: 'InternalError', info: error})
      })
      .then(function (ship) {
        var futureSupposedAmount = amount
        if (ship.amount) {
          futureSupposedAmount = amount + futureSupposedAmount
        }
        console.log('Future supposed amount: ' + futureSupposedAmount)
        var mineralCost = ship.mineralCost * amount
        var gasCost = ship.gasCost * amount
        console.log('Mineral cost ' + mineralCost)
        console.log('Current minerals : ' + user.minerals + ' And after : ' + (user.minerals - mineralCost))
        console.log('Current gas : ' + user.gas + ' And after : ' + (user.gas - gasCost))
        if (userRest.hasSufficientResources(user.minerals, user.gas, mineralCost, gasCost)) {
          userRest.changeResources(user.username, -mineralCost, -gasCost)
          const points = globalConfig.calculatePointsWithFleetForUser(mineralCost, gasCost)
          console.log('Minerals transaction done')
          const speedFromBuildings = user['speed_fleet'] ? user['speed_fleet'] : 0
          const speedFromSearch = user['speed_fleet_from_search'] ? user['speed_fleet_from_search'] : 0
          const executionTime = globalConfig.calculateExecutionTimeForShip(speedFromBuildings + speedFromSearch, amount, ship.timeToBuild, shipId)
          console.log('Building will be ok at : ' + executionTime + ' It is now : ' + Date.now() + ' with ttb: ' + (executionTime - Date.now()))
          return {points: points, executionTime: executionTime, ship: ship, amount: amount}
        } else {
          response.respond('Not enough resources', 'not_enough_resources', 401)
          return Promise.reject({code: 'not_enough_resources'})
        }
      })
      .then(function (info) {
        return new Promise(function (resolve, reject) {
          queueHelper.addToQueue('ships', info.ship, 'users/' + user.username + '/fleet/' + shipId, info.executionTime, info.points, user.username,
            function () {
              response.json({code: 'ok'})
              resolve()
            }, amount
          )
        })
      })
  }
}

module.exports = fleet
