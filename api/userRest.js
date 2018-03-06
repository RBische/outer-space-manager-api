var admin = require('../db/db')
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database()
var ref = db.ref('outer-space-manager')
var globalConfig = require('../config/globalConfig')
const svg2png = require('svg2png')

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
        .limitToFirst(parseInt(limit) + parseInt(req.params.from) + 1)
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
            if (usersFetched.hasOwnProperty(key) && usersFetched[key].hasOwnProperty('username')) {
              for (var subkey in usersFetched[key]) {
                if (!allowedKeys.includes(subkey)) {
                  delete usersFetched[key][subkey]
                }
              }
              if (usersFetched[key]) {
                console.log(usersFetched[key])
                usersReturned.push(usersFetched[key])
              }
            }
          }
          console.log(JSON.stringify(usersReturned))
          const result = usersReturned.sort(function compare (a, b) {
            if (a.points > b.points) {
              return -1
            }
            if (a.points < b.points) {
              return 1
            }
            return 0
          })
          console.log(JSON.stringify(result))
          const usersPaginated = result.slice(req.params.from, result.length)
            .map((user) => {
              return Object.assign(user, {imageUrl: `https://outer-space-manager-staging.herokuapp.com/img/${user.username}.png`})
            })
          res.json({
            size: usersPaginated.length,
            users: usersPaginated
          })
        }
      }, function (errorObject) {
        console.log('Error fetching user : ' + errorObject)
      })
    } else {
      res.respond('Invalid request, no from or limit given, or limit <= 0', 'invalid_request', 401)
    }
  },
  async getImage (req, res, next) {
    const rand = Buffer.from(req.params.user, 'utf8').toString('hex').substring(0, 6)
    const planet = `<?xml version="1.0" encoding="iso-8859-1"?>
    <!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
    <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
       viewBox="0 0 511.999 511.999" style="enable-background:new 0 0 511.999 511.999;" xml:space="preserve">
    <path style="fill:#fff;" d="M416.189,354.158c0-4.557,2.068-9.057,5.99-12.004c6.625-4.977,16.027-3.641,21.004,2.982
      c7.338,9.772,14.248,19.369,20.539,28.529c4.689,6.83,2.953,16.166-3.877,20.857c-6.828,4.688-16.166,2.953-20.855-3.877
      c-6.049-8.811-12.709-18.059-19.793-27.49C417.167,360.457,416.189,357.295,416.189,354.158z"/>
    <path style="fill:#FFFFFF;" d="M107.231,55.461c0-2.859,0.816-5.748,2.521-8.306c4.594-6.894,13.906-8.757,20.801-4.162
      c11.475,7.648,23.67,16.316,36.25,25.766c6.623,4.976,7.959,14.378,2.984,21.002c-4.977,6.624-14.379,7.96-21.002,2.984
      c-12.131-9.112-23.863-17.452-34.871-24.789C109.579,65.067,107.231,60.309,107.231,55.461z"/>
    <path style="fill:#${rand};" d="M408.566,408.617c40.766-40.766,63.216-94.968,63.216-152.618s-22.449-111.853-63.216-152.618
      C367.8,62.615,313.598,40.163,255.948,40.163c-57.652,0-111.853,22.451-152.618,63.217c-40.766,40.765-63.217,94.967-63.217,152.618
      s22.451,111.853,63.217,152.618c40.766,40.766,94.966,63.215,152.618,63.215C313.598,471.833,367.8,449.384,408.566,408.617z"/>
    <path style="fill:#${rand};" d="M408.566,408.617c40.766-40.766,63.216-94.968,63.216-152.618s-22.449-111.853-63.216-152.618l0,0
      L103.329,408.617c40.766,40.766,94.966,63.215,152.618,63.215C313.598,471.833,367.8,449.384,408.566,408.617z"/>
    <path style="fill:#000000;" d="M0,33.554C0,23.33,3.023,15.157,9.064,9.117c10.835-10.834,28.534-11.96,52.602-3.35
      c18.668,6.678,41.844,19.202,68.888,37.226c6.893,4.595,8.758,13.907,4.162,20.801c-4.594,6.894-13.908,8.757-20.801,4.162
      C58.68,31.142,34.832,28.38,30.316,30.371c-2.1,4.74,1.067,30.002,41.086,88.789c35.199,51.703,87.724,113.315,147.896,173.489
      c60.17,60.17,121.784,112.694,173.485,147.892c58.793,40.025,84.058,43.186,88.792,41.086c2.145-4.836-1.189-30.689-42.586-90.981
      c-4.688-6.828-2.953-16.168,3.875-20.855c6.83-4.689,16.168-2.955,20.855,3.875c19.865,28.93,33.793,53.74,41.396,73.739
      c3.625,9.533,14.652,38.535-2.289,55.477c-10.838,10.836-28.541,11.959-52.623,3.342c-18.678-6.686-41.865-19.221-68.923-37.258
      c-54.35-36.232-119.411-91.315-183.196-155.103c-63.79-63.789-118.874-128.851-155.106-183.2
      C24.941,103.608,12.406,80.418,5.723,61.741C1.908,51.082,0.002,41.671,0,33.554z"/>
    <path style="fill:#000000;" d="M502.828,502.882c16.941-16.941,5.914-45.943,2.289-55.477
      c-7.603-19.998-21.531-44.809-41.396-73.739c-4.688-6.83-14.025-8.564-20.855-3.875c-6.828,4.688-8.563,14.027-3.875,20.855
      c41.396,60.291,44.73,86.146,42.586,90.981c-4.734,2.1-29.998-1.061-88.792-41.086c-51.701-35.197-113.316-87.722-173.485-147.892
      l-0.002-0.002l-21.213,21.213l0.002,0.002c63.786,63.788,128.847,118.87,183.196,155.103c27.057,18.037,50.244,30.572,68.923,37.258
      C474.287,514.841,491.99,513.718,502.828,502.882z"/>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    <g>
    </g>
    </svg>
    `
    const result = await svg2png(Buffer.from(planet), { width: 300, height: 300 })
    res.writeHead(200, {
      'Content-Type': 'image/png'
    })
    res.end(result, 'binary')
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
        .limitToFirst(parseInt(limit) + parseInt(req.params.from) + 1)
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
          const result = reportsReturned.sort(function compare (a, b) {
            if (a.dateInv < b.dateInv) {
              return -1
            }
            if (a.dateInv > b.dateInv) {
              return 1
            }
            return 0
          })
          const reportsPaginated = result.slice(req.params.from, result.length)
          res.json({
            size: reportsPaginated.length,
            reports: reportsPaginated
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
    const allowedKeys = ['username', 'points', 'gas', 'gasModifier', 'minerals', 'mineralsModifier', 'username']
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
