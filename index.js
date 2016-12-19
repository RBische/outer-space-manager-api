var express = require('express');
var router = express.Router();
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
router.get('/api/v1/buildings', buildings.getBuildings);

app.use('/', router);
if (module.parent === null) {
  app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
  });
}
