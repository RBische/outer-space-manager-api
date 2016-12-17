var jwt = require('jwt-simple');
var admin = require('../db/db');
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
var ref = db.ref("outer-space-manager");

var auth = {

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
    usersRef.orderByChild("email").equalTo(username).on("value", function(snapshot) {
      console.log("Successfully fetched user");
      var userFetched = snapshot.val();
      var hashFetched = userFetched[Object.keys(userFetched)[0]].password;
      if (!userFetched || hashFetched != hash) { // If authentication fails, we send a 401 back
        res.respond("Invalid credentials", "invalid_credentials", 401);
        return;
      }

      if (userFetched) {
        // If authentication is success, we will generate a token
        // and dispatch it to the client
        res.json(genToken(userFetched));
      }
    }, function (errorObject) {
      console.log("Error fetching user : "+errorObject);
      res.respond("Invalid credentials", "invalid_credentials", 401);
    });
  },
}

// private method
function genToken(user) {
  var expires = expiresIn(7); // 7 days
  var token = jwt.encode({
    exp: expires
  }, process.env.APP_SECRET);

  return {
    token: token,
    expires: expires,
    user: user
  };
}

function expiresIn(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports = auth;
