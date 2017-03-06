var jwt = require('jsonwebtoken')
var admin = require('../db/db')
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database()
var ref = db.ref('outer-space-manager')

var auth = {
  /**
   * @api {post} /api/vXXX/auth/create Creates an user
   * @apiDescription Used to create a new instance of an user
   * @apiName CreateUser
   * @apiGroup User
   * @apiVersion 1.0.0
   *
   * @apiParam {String} username The username of the player
   * @apiParam {String} password The password of the player
   *
   * @apiSuccessExample {json} Success
   *     HTTP/1.1 200 OK
   *     {
   *       token: "atoken",
   *       expires: "expirationInMilliseconds"
   *     }
   * @apiError invalid_request Missing username or password (401)
   * @apiError invalid_credentials Must not happen but the create uses the login flow (401)
   * @apiError already_registered_username Already registered username (400)
   */
  create: function (req, res) {
    var username = req.body.username || ''
    var password = req.body.password || ''

    if (username === '' || password === '') {
      res.respond('Invalid request', 'invalid_request', 401)
      return
    }

    var re = new RegExp('^s*([0-9a-zA-Z]+)s*$')
    if (!re.test(username)) {
      console.log('Special chars')
      res.respond('Invalid request, username must not contains special chars', 'invalid_request', 401)
      return
    }

    var usersRef = ref.child('users')
    var crypto = require('crypto')
    var hash = crypto.createHash('sha256').update(password).digest('base64')

    usersRef.orderByChild('username').equalTo(username).once('value', function (snapshot) {
      console.log('Successfully fetched user')
      var userFetched = snapshot.val()

      if (userFetched) {
        res.respond('Already registered username', 'already_registered_username', 401)
        return
      }
      if (!userFetched) {
        var refreshToken = jwt.sign({
          refresh: username + 'refreshToken'
        }, process.env.APP_SECRET)
        usersRef.child(username).update(
          {
            points: 0,
            pointsInv: 10000000000,
            minerals: 0,
            gas: 0,
            refreshToken: refreshToken,
            username: username,
            password: hash,
            mineralsModifier: 1,
            gasModifier: 1,
            lastResourcesRefresh: Date.now()
          }
        )
        auth.login(req, res)
      }
    }, function (errorObject) {
      console.log('Error fetching user : ' + errorObject)
    })
  },

  deleteUser: function (username) {
    var usersRef = ref.child('users/' + username)
    usersRef.remove()
  },

  /**
   * @api {post} /api/vXXX/auth/login Sign an user in
   * @apiDescription Used to sign in
   * @apiName LoginUser
   * @apiGroup User
   * @apiVersion 1.0.0
   *
   * @apiParam {String} username The username of the player
   * @apiParam {String} password The password of the player
   *
   * @apiSuccessExample {json} Success
   *     HTTP/1.1 200 OK
   *     {
   *       token: "atoken",
   *       expires: "expirationInMilliseconds"
   *     }
   * @apiError invalid_request Missing username or password (401)
   * @apiError invalid_credentials The password or the username are wrong (401)
   */
  login: function (req, res) {
    var username = req.body.username || ''
    var password = req.body.password || ''

    if (username === '' || password === '') {
      res.respond('Invalid credentials', 'invalid_credentials', 401)
      return
    }

    // Fire a query to your DB and check if the credentials are valid
    auth.validate(username, password, res)
  },

  validate: function (username, password, res) {
    var usersRef = ref.child('users')
    var crypto = require('crypto')
    var hash = crypto.createHash('sha256').update(password).digest('base64')
    console.log('Loging in')
    usersRef.orderByChild('username').equalTo(username).once('value', function (snapshot) {
      console.log('Successfully fetched user for login')
      var userFetched = snapshot.val()
      if (!userFetched) { // If authentication fails, we send a 401 back
        console.log('Current user fetched for validation: ' + userFetched)
        res.respond('Invalid credentials', 'invalid_credentials', 401)
        return
      }
      var hashFetched = userFetched[Object.keys(userFetched)[0]].password
      if (hashFetched !== hash) { // If authentication fails, we send a 401 back
        res.respond('Invalid credentials', 'invalid_credentials', 401)
        return
      }

      if (userFetched) {
        // If authentication is success, we will generate a token
        // and dispatch it to the client
        var token = auth.pushToken(username)
        res.json(token)
      }
    }, function (errorObject) {
      console.log('Error fetching user : ' + errorObject)
      res.respond('Invalid credentials', 'invalid_credentials', 401)
    })
  },

  pushToken: function (username) {
    var token = genToken()
    var tokensRef = ref.child('tokens')
    tokensRef.push(
      {
        username: username,
        token: token.token,
        expires: token.expires
      }
    )
    return token
  },

  isAuthenticated: function (token, res) {
    var tokensRef = ref.child('tokens')
    console.log('Verifying token')
    tokensRef.orderByChild('token').equalTo(token).once('value', function (snapshot) {
      console.log('Successfully fetched tokens')
      var tokenFetched = snapshot.val()
      if (!tokenFetched && res) { // If authentication fails, we send a 401 back
        console.log('No token corresponding')
        res.respond('Invalid credentials', 'invalid_credentials', 401)
        return false
      }
      if (auth.isExpired(tokenFetched.expires) && res) { // If authentication fails, we send a 401 back
        res.respond('Expired token', 'invalid_credentials', 401)
        return false
      } else {
        return true
      }
    }, function (errorObject) {
      console.log('Error fetching user : ' + errorObject)
      res.respond('Invalid credentials', 'invalid_credentials', 401)
    })
  },

  isExpired: function (expires) {
    return expires > expiresIn(0)
  }
}

// private method
function genToken () {
  var expires = expiresIn(7) // 7 days
  var token = jwt.sign({
    exp: expires
  }, process.env.APP_SECRET)
  return {
    token: token,
    expires: expires
  }
}

function expiresIn (numDays) {
  var dateObj = new Date()
  return dateObj.setDate(dateObj.getDate() + numDays)
}

module.exports = auth
