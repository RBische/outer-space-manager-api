var express = require('express');
var router = express.Router();
require('./response');

var auth = require('./api/authRest.js');
var user = require('./api/userRest.js');
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

/*
 * Routes that can be accessed only by authenticated & authorized users
 */
router.get('/api/v1/admin/users', user.getAll);
router.get('/api/v1/admin/user/:id', user.getOne);
router.post('/api/v1/admin/user/', user.create);
router.put('/api/v1/admin/user/:id', user.update);
router.delete('/api/v1/admin/user/:id', user.delete);

app.use('/', router);
if (module.parent === null) {
  app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
  });
}
