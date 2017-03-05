const admin = require('../db/db')
const queueHelper = require('../db/queueHelper')
// As an admin, the app has access to read and write all data, regardless of Security Rules
const db = admin.database()
const ref = db.ref('outer-space-manager')
const globalConfig = require('../config/globalConfig')
const userRest = require('../api/userRest')
var userMakingRequest = []
const fleet = {
  /**
   * @api {get} /api/vXXX/buildings Get ships
   * @apiDescription Get the list of available ships
   * @apiName GetShips
   * @apiGroup Fleet
   * @apiVersion 1.0.0
   *
   * @apiHeader {String} x-access-token The access token of the user
   *
   * @apiExample {curl} Example usage:
   *     curl -X GET -H "x-access-token: $token$" "https://outer-space-manager.herokuapp.com/api/v1/ships"
   * @apiSuccessExample {json} Success
   *HTTP/1.1 200 OK
   *{
  "size": 2,
  "ships": [
    {
      "gasCost": 100,
      "life": 60,
      "maxAttack": 60,
      "minAttack": 40,
      "mineralCost": 300,
      "name": "Chasseur léger",
      "shield": 15,
      "spatioportLevelNeeded": 0,
      "speed": 1000,
      "timeToBuild": 30
    },
    {
      "gasCost": 250,
      "life": 120,
      "maxAttack": 110,
      "minAttack": 90,
      "mineralCost": 600,
      "name": "Chasseur lourd",
      "shield": 50,
      "spatioportLevelNeeded": 2,
      "speed": 850,
      "timeToBuild": 60
    }
  ]
}
   * @apiError no_ships_found No ships were found (404)
   * @apiError invalid_access_token The token supplied is not valid (403)
   * @apiError server_bad_response The server did not handle the request correctly (500)
   */
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
  /**
   * @api {get} /api/vXXX/fleet/list Get fleet for user
   * @apiDescription Get the fleet for the current user
   * @apiName GetUserFleet
   * @apiGroup Fleet
   * @apiVersion 1.0.0
   *
   * @apiHeader {String} x-access-token The access token of the user
   *
   * @apiExample {curl} Example usage:
   *     curl -X GET -H "x-access-token: $token$" "https://outer-space-manager.herokuapp.com/api/v1/fleet/list"
   * @apiSuccessExample {json} Success
   *HTTP/1.1 200 OK
   *{
  "size": 1,
  "buildings": [
    {
      "amountOfEffectByLevel": 30,
      "amountOfEffectLevel0": 0,
      "building": false,
      "effect": "speed_building",
      "gasCostByLevel": 200,
      "gasCostLevel0": 100,
      "level": 2,
      "mineralCostByLevel": 200,
      "mineralCostLevel0": 100,
      "name": "Usine de nanites",
      "timeToBuildByLevel": 200,
      "timeToBuildLevel0": 60
    }
  ]
}
   * @apiError invalid_request Missing credentials (401)
   * @apiError invalid_access_token The token supplied is not valid (403)
   * @apiError server_bad_response The server did not handle the request correctly (500)
   */
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
            ships: shipsFetched
          })
        } else {
          res.json({
            size: 0,
            ships: []
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
    // TODO: Add control on spatioport level
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
  },

  /**
   * @api {post} /api/v1/fleet/attack/:userName Attack an user
   * @apiDescription Attack an user with the current user fleet
   * @apiName Attack
   * @apiGroup Fleet
   * @apiVersion 1.0.0
   *
   * @apiParam {Integer} userName The user to attack
   * @apiParam {Object[]} ships The ships used for the attack
   * @apiParam {Integer} ships.shipId ShipId used for the attack
   * @apiParam {Integer} ships.amout Amount of this ship used for the attack
   *
   * @apiSuccessExample {json} Success
   *     HTTP/1.1 200 OK
   *     {
   *       internalCode: "ok"
   *     }
   * @apiError invalid_request Missing ships or username (401)
   * @apiError not_enough_ships Not enough resources to build these ships (401)
   * @apiError no_ships_found This ship does not exist (404)
   * @apiError internal_error Something went wrong, try again later (500)
   */
  attack: function (req, res, next) {
    if (req.params.userName !== undefined && req.body.ships !== undefined && req.body.ships.length > 0 && !userMakingRequest.includes(req.user.username)) {
      userMakingRequest.push(req.user.username)
      const attackFleet = []
      var minSpeed = 150000
      console.log('Current fleet:' + JSON.stringify(req.user.fleet))
      for (var i = 0; i < req.body.ships.length; i++) {
        if (req.body.ships[i].hasOwnProperty('shipId') && req.body.ships[i].hasOwnProperty('amount')) {
          if (req.user.fleet &&
            req.user.fleet[req.body.ships[i].shipId] &&
            req.user.fleet[req.body.ships[i].shipId].amount &&
            req.user.fleet[req.body.ships[i].shipId].amount >= req.body.ships[i].amount) {
            if (req.user.fleet[req.body.ships[i].shipId].speed < minSpeed) {
              minSpeed = req.user.fleet[req.body.ships[i].shipId].speed
            }
            attackFleet.push({shipId: req.body.ships[i].shipId, amount: req.body.ships[i].amount})
          }
        }
      }
      if (attackFleet.length > 0) {
        const attackedUserRef = ref.child('users/' + req.params.userName)
        return new Promise(function (resolve, reject) {
          attackedUserRef.once('value', function (snapshot) {
            var userFetched = snapshot.val()
            if (userFetched == null) {
              res.respond('No user corresponding found', 'invalid_request', 401)
              reject()
            } else {
              resolve(userFetched)
            }
          }, function (errorObject) {
            res.respond('Oups, server is not that ok with your request', 'server_bad_response', 500)
            reject()
          })
        })
        .then(function (attackedUser) {
          return new Promise(function (resolve, reject) {
            const distance = globalConfig.getDistanceFromUsers(attackedUser, req.user)
            var modifier = 0
            if (req.user.speed_fleet) {
              modifier += req.user.speed_fleet
            }
            const executionTime = Math.round((2 * distance) / minSpeed - modifier) + Date.now()
            console.log('Queued in : ' + executionTime + ' with distance: ' + (2 * distance) + ' and min speed :' + minSpeed + ', it is now :' + Date.now())
            queueHelper.addToQueue('attack', {fromUser: req.user.username, toUser: req.params.userName, fleet: attackFleet}, 'attack', executionTime, 0, req.user.username,
              function () {
                const userFleet = req.user.fleet
                for (var i = 0; i < attackFleet.length; i++) {
                  userFleet[attackFleet[i].shipId].amount = userFleet[attackFleet[i].shipId].amount - attackFleet[i].amount
                }
                return ref.child('users/' + req.user.username + '/fleet/').set(userFleet)
                .then(function (result) {
                  res.json({code: 'ok'})
                  userMakingRequest.splice(userMakingRequest.indexOf(req.user.username), 1)
                  resolve()
                })
                .catch(function (rejection) {
                  userMakingRequest.splice(userMakingRequest.indexOf(req.user.username), 1)
                  res.respond('Error in server side', 'internal_error', 500)
                  resolve()
                })
              }
            )
          })
        })
        .catch(function (rejection) {
          userMakingRequest.splice(userMakingRequest.indexOf(req.user.username), 1)
        })
      } else {
        userMakingRequest.splice(userMakingRequest.indexOf(req.user.username), 1)
        res.respond('Invalid request, not enough ships of a kind or something like that', 'invalid_request', 401)
      }
    } else {
      res.respond('Invalid request, no ships given or no username given', 'invalid_request', 401)
    }
  }
}

module.exports = fleet
