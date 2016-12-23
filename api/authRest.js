var jwt = require('jwt-simple');
var admin = require('../db/db');
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
var ref = db.ref("outer-space-manager");

var auth = {
  create: function(req, res) {

    var username = req.body.username || '';
    var password = req.body.password || '';

    if (username == '' || password == '') {
      res.respond("Invalid request", "invalid_request", 401);
      return;
    }

    var usersRef = ref.child("users");
    var crypto = require('crypto');
    var hash = crypto.createHash('sha256').update(password).digest('base64');

    usersRef.orderByChild("email").equalTo(username).once("value", function(snapshot) {
      console.log("Successfully fetched user");
      var userFetched = snapshot.val();

      if (userFetched) {
        res.respond("Already registered email", "already_registered_email", 401);
        return;
      }
      if (!userFetched) {
        var refreshToken = jwt.encode({
          refresh: username + "refreshToken"
        }, process.env.APP_SECRET);
        usersRef.push(
          {
            points:0,
            refreshToken: refreshToken,
            email:username,
            password: hash
          }
        );
        res.json({code:"ok"});
      }
    }, function (errorObject) {
      console.log("Error fetching user : "+errorObject);
    });
  },

  deleteUser: function(username){
    var usersRef = ref.child("users");
    usersRef.orderByChild("email").equalTo(username).once("value", function(snapshot) {
      var userFetched = snapshot.val();
      if (!userFetched) {
        return;
      }

      if (userFetched) {
        var updates = {};
        snapshot.forEach(function(child){
             updates[child.key] = null;
        });
        usersRef.update(updates);
      }
    }, function (errorObject) {
      console.log("Error fetching user : "+errorObject);
    });
  },

  login: function(req, res) {

    var username = req.body.username || '';
    var password = req.body.password || '';

    if (username == '' || password == '') {
      res.respond("Invalid credentials", "invalid_credentials", 401);
      return;
    }

    // Fire a query to your DB and check if the credentials are valid
    auth.validate(username, password, res);
  },

  validate: function(username, password, res) {
    var usersRef = ref.child("users");
    var crypto = require('crypto');
    var hash = crypto.createHash('sha256').update(password).digest('base64');
    console.log("Loging in");
    usersRef.orderByChild("email").equalTo(username).once("value", function(snapshot) {
      console.log("Successfully fetched user for login");
      var userFetched = snapshot.val();
      if (!userFetched) { // If authentication fails, we send a 401 back
        console.log("Current user fetched for validation: "+userFetched);
        res.respond("Invalid credentials", "invalid_credentials", 401);
        return;
      }
      var hashFetched = userFetched[Object.keys(userFetched)[0]].password;
      if (hashFetched != hash) { // If authentication fails, we send a 401 back
        res.respond("Invalid credentials", "invalid_credentials", 401);
        return;
      }

      if (userFetched) {
        // If authentication is success, we will generate a token
        // and dispatch it to the client
        var token = genToken(userFetched);
        var tokensRef = ref.child("tokens");
        tokensRef.push(
          {
            username: username,
            token: token.token,
            expires: token.expires
          }
        );
        res.json(token);
      }
    }, function (errorObject) {
      console.log("Error fetching user : "+errorObject);
      res.respond("Invalid credentials", "invalid_credentials", 401);
    });
  },

  isAuthenticated: function (token, res) {
    var tokensRef = ref.child("tokens");
    console.log("Verifying token");
    tokensRef.orderByChild("token").equalTo(token).once("value", function(snapshot) {
      console.log("Successfully fetched tokens");
      var tokenFetched = snapshot.val();
      if (!tokenFetched && res) { // If authentication fails, we send a 401 back
        console.log("No token corresponding");
        res.respond("Invalid credentials", "invalid_credentials", 401);
        return false;
      }
      if (auth.isExpired(tokenFetched.expires) && res) { // If authentication fails, we send a 401 back
        res.respond("Expired token", "invalid_credentials", 401);
        return false;
      }else {
        return true;
      }
    }, function (errorObject) {
      console.log("Error fetching user : "+errorObject);
      res.respond("Invalid credentials", "invalid_credentials", 401);
    });
  },

  isExpired: function (expires) {
      return expires > expiresIn(0);
  },
}

// private method
function genToken(user) {
  var expires = expiresIn(7); // 7 days
  var token = jwt.encode({
    exp: expires
  }, process.env.APP_SECRET);
  var username = user[Object.keys(user)[0]].username
  return {
    token: token,
    expires: expires
  };
}

function expiresIn(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports = auth;
