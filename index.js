var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
require('./response');
require('./db/dbSeed').fillDb();

var auth = require('./api/authRest.js');
var buildings = require('./api/buildingRest.js');
var app = exports.app = express();

app.set('port', (process.env.PORT || 5000));
var bodyParser = require('body-parser')
app.use( bodyParser.json());

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

/*
* Routes that can be accessed by any one
*/
router.post('/api/v1/auth/login', auth.login);
router.post('/api/v1/auth/create', auth.create);

// route middleware to verify a token
router.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, process.env.APP_SECRET, function(err, decoded) {
      if (err) {
        res.respond("Failed to authenticate token.", "invalid_access_token", 403);
        return;
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    res.respond("No token provided", "invalid_access_token", 403);
    return;

  }
});
router.get('/api/v1/buildings', buildings.getBuildings);
router.get('/api/v1/buildings/list/:username', buildings.getBuildingsForUser);

app.use('/', router);
if (module.parent === null) {
  app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
  });
}
