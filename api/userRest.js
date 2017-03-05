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
   * @apiGroup Users
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

        if (!usersFetched) {
          res.json({
            size: 0,
            users: {}
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
            }
          }
          res.json({
            size: usersFetched.length,
            users: usersFetched
          })
        }
      }, function (errorObject) {
        console.log('Error fetching user : ' + errorObject)
      })
    } else {
      res.respond('Invalid request, no from or limit given, or limit <= 0', 'invalid_request', 401)
    }
  }
}

module.exports = user
