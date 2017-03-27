var admin = require('../db/db')
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database()
var ref = db.ref('outer-space-manager')

var auth = {
  /**
   * @api {post} /api/vXXX/devices/add Add a device token
   * @apiDescription Add a device token for a specific user
   * @apiName addDeviceToken
   * @apiGroup Device
   * @apiVersion 1.0.0
   *
   * @apiHeader {String} x-access-token The access token of the user
   * @apiParam {String} deviceToken The deviceToken of the player
   *
   * @apiSuccessExample {json} Success
   *HTTP/1.1 200 OK
   *{
  "code": "ok"
}
   * @apiError invalid_request Missing credentials (401)
   * @apiError invalid_request Missing deviceToken (403)
   * @apiError server_bad_response The server did not handle the request correctly (500)
   */
  addDeviceToken: function (req, res) {
    var deviceToken = req.body.deviceToken || ''

    if (deviceToken === '') {
      res.respond('Invalid request', 'invalid_request', 401)
      return
    }
    ref.child('users/' + req.user.username + '/tokens').push({token: deviceToken})
    .then(function (response) {
      res.json({code: 'ok'})
    })
    .catch(function (rejection) {
      console.log(JSON.stringify(rejection))
      res.respond('Error during saving', 'error', 401)
    })
  }
}
module.exports = auth
