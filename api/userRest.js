var admin = require('../db/db')
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database()
var ref = db.ref('outer-space-manager')
var globalConfig = require('../config/globalConfig')

var user = {
  hasSufficientResources: function (userMineral, userGas, mineral, gas) {
    return userMineral >= mineral && userGas >= gas
  },
  changeResources: function (username, minerals, gas) {
    var userRef = ref.child('users/' + username)
    return userRef.once('value')
    .then(function (snapshot) {
      var userFetched = snapshot.val()
      userFetched.minerals = userFetched.minerals + minerals
      userFetched.gas = userFetched.gas + gas
      return userFetched
    }, function (errorObject) {
      console.log('Error giving resources')
      return Promise.reject({code: 'DbError', errorObject})
    })
    .then(function (userFetched) {
      return ref.child('users/' + username).update(userFetched)
    })
  },
  refreshResources: function (user, callback) {
    var dateAfter = Date.now()
    var mineralsAfter = user.minerals + globalConfig.generateMinerals(((dateAfter - user.lastResourcesRefresh) / 1000), user.mineralsModifier)
    var gasAfter = user.gas + globalConfig.generateGas(((dateAfter - user.lastResourcesRefresh) / 1000), user.gasModifier)
    user.minerals = mineralsAfter
    user.gas = gasAfter
    user.lastResourcesRefresh = dateAfter
    ref.child('users/' + user.username).update({minerals: mineralsAfter, gas: gasAfter, lastResourcesRefresh: dateAfter},
      function (error) {
        console.log(error)
        callback(user)
      }
    )
  },
  loadUser: function (username, callback) {
    var userRef = ref.child('users/' + username)
    userRef.once('value',
      function (snapshot) {
        var userFetched = snapshot.val()
        if (userFetched == null) {
          callback(null)
          return
        }
        user.refreshResources(userFetched, function (user) {
          callback(user)
        })
      },
      function (errorObject) {
        console.log(errorObject)
      })
  },
  /**
   * @api {get} /api/vXXX/users/:from/:limit Get users
   * @apiDescription Get users ordered by score desc
   * @apiName GetUsers
   * @apiGroup User
   * @apiVersion 1.0.0
   *
   * @apiHeader {String} x-access-token The access token of the user
   *
   * @apiExample {curl} Example usage:
   *     curl -X GET -H "x-access-token: $token$" "https://outer-space-manager.herokuapp.com/api/v1/users/0/3"
   * @apiSuccessExample {json} Success
   *HTTP/1.1 200 OK
   *{
  "users": {
    "alan": {
      "points": 3910,
      "username": "alan"
    },
    "alanee": {
      "points": 0,
      "username": "alanee"
    },
    "alansearch": {
      "points": 630,
      "username": "alansearch"
    }
  }
}
   * @apiError invalid_request Missing limit or from param or not valid value in these params (401)
   * @apiError invalid_access_token The token supplied is not valid (403)
   */
  getUsers: function (req, res, next) {
    if (req.params.from !== undefined && req.params.limit !== undefined && req.params.limit > 0 && req.params.from >= 0 && req.params.limit <= 20) {
      const limit = req.params.limit
      console.log('Fetching users from ' + req.params.from + ' with limit ' + limit)
      var usersRef = ref.child('users')
        .orderByChild('pointsInv')
        .startAt(parseInt(req.params.from))
        .limitToFirst(parseInt(limit))
      usersRef.once('value', function (snapshot) {
        console.log('Successfully fetched users')
        var usersFetched = snapshot.val()
        var usersReturned = []
        if (!usersFetched) {
          res.json({
            size: 0,
            users: []
          })
        } else {
          const allowedKeys = ['username', 'points']
          for (var key in usersFetched) {
            if (usersFetched.hasOwnProperty(key)) {
              for (var subkey in usersFetched[key]) {
                if (!allowedKeys.includes(subkey)) {
                  delete usersFetched[key][subkey]
                }
              }
              usersReturned.push(usersFetched[key])
            }
          }
          usersReturned.sort(function compare (a, b) {
            if (a.points > b.points) {
              return -1
            }
            if (a.points < b.points) {
              return 1
            }
            return 0
          })
          res.json({
            size: usersFetched.length,
            users: usersReturned
          })
        }
      }, function (errorObject) {
        console.log('Error fetching user : ' + errorObject)
      })
    } else {
      res.respond('Invalid request, no from or limit given, or limit <= 0', 'invalid_request', 401)
    }
  },
  /**
   * @api {get} /api/vXXX/reports/:from/:limit Get reports
   * @apiDescription Get attack reports order by timestamp desc
   * @apiName GetReports
   * @apiGroup User
   * @apiVersion 1.0.0
   *
   * @apiHeader {String} x-access-token The access token of the user
   *
   * @apiExample {curl} Example usage:
   *     curl -X GET -H "x-access-token: $token$" "https://outer-space-manager.herokuapp.com/api/v1/reports/0/3"
   * @apiSuccessExample {json} Success
   *HTTP/1.1 200 OK
   *{
  "reports": [
    {
      "attackerFleet": [
        {
          "amount": 1,
          "shipId": 0
        }
      ],
      "attackerFleetAfterBattle": {
        "capacity": 30,
        "fleet": [
          {
            "amount": 1
          }
        ],
        "survivingShips": 1
      },
      "date": 1489431003060,
      "dateInv": 658052644940,
      "defenderFleet": [
        {
          "amount": 1,
          "gasCost": 100,
          "life": 60,
          "maxAttack": 60,
          "minAttack": 40,
          "mineralCost": 300,
          "name": "Chasseur léger",
          "shield": 15,
          "shipId": 0,
          "spatioportLevelNeeded": 0,
          "speed": 1000,
          "timeToBuild": 30
        }
      ],
      "defenderFleetAfterBattle": {
        "capacity": 0,
        "fleet": [
          {
            "amount": 0
          }
        ],
        "survivingShips": 0
      },
      "from": "alan",
      "gasWon": 10,
      "mineralsWon": 20,
      "to": "alansearch",
      "type": "attacked"
    }
  ]
}
   * @apiError invalid_request Missing limit or from param or not valid value in these params (401)
   * @apiError invalid_access_token The token supplied is not valid (403)
   */
  getReports: function (req, res, next) {
    if (req.params.from !== undefined && req.params.limit !== undefined && req.params.limit > 0 && req.params.from >= 0 && req.params.limit <= 20) {
      const limit = req.params.limit
      console.log('Fetching reports from ' + req.params.from + ' with limit ' + limit)
      const ref = 'outer-space-manager/users/' + req.user.username + '/reports'
      console.log(ref)
      var reportsRef = db.ref(ref)
        .orderByChild('dateInv')
        .startAt(parseInt(req.params.from))
        .limitToFirst(parseInt(limit))
      reportsRef.once('value', function (snapshot) {
        console.log('Successfully fetched reports')
        var reportsFetched = snapshot.val()
        console.log('Reports: ' + JSON.stringify(reportsFetched))
        var reportsReturned = []
        if (!reportsFetched) {
          res.json({
            size: 0,
            reports: []
          })
        } else {
          for (var key in reportsFetched) {
            reportsReturned.push(reportsFetched[key])
          }
          reportsReturned.sort(function compare (a, b) {
            if (a.dateInv < b.dateInv) {
              return -1
            }
            if (a.dateInv > b.dateInv) {
              return 1
            }
            return 0
          })
          res.json({
            size: reportsFetched.length,
            reports: reportsReturned
          })
        }
      }, function (errorObject) {
        console.log('Error fetching reports : ' + errorObject)
      })
    } else {
      res.respond('Invalid request, no from or limit given, or limit <= 0', 'invalid_request', 401)
    }
  },
  /**
   * @api {get} /api/vXXX/users/get Get current user
   * @apiDescription Get the current user and his informations
   * @apiName GetUser
   * @apiGroup User
   * @apiVersion 1.0.0
   *
   * @apiHeader {String} x-access-token The access token of the user
   *
   * @apiExample {curl} Example usage:
   *     curl -X GET -H "x-access-token: $token$" "https://outer-space-manager.herokuapp.com/api/v1/users/get"
   * @apiSuccessExample {json} Success
   *HTTP/1.1 200 OK
   *{
  "gas": 1341.3615000000002,
  "gasModifier": 1,
  "minerals": 1966.1784000000002,
  "mineralsModifier": 1,
  "points": 630,
  "username": "alansearch"
}
   * @apiError invalid_request Missing limit or from param or not valid value in these params (401)
   * @apiError invalid_access_token The token supplied is not valid (403)
   */
  getCurrentUser: function (req, res, next) {
    const user = req.user
    const allowedKeys = ['username', 'points', 'gas', 'gasModifier', 'minerals', 'mineralsModifier', 'reports', 'username']
    for (var key in user) {
      if (user.hasOwnProperty(key)) {
        if (!allowedKeys.includes(key)) {
          delete user[key]
        }
      }
    }
    res.json(user)
  }
}

module.exports = user
