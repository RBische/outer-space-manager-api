var admin = require('../db/db')
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database()
var ref = db.ref('outer-space-manager')

var auth = {
/**
 * @api {get} /api/vXXX/pushme Test push
 * @apiDescription Send to the current user a push notification
 * @apiName SendPush
 * @apiGroup Device
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} x-access-token The access token of the user
 *
 * @apiError invalid_request Missing limit or from param or not valid value in these params (401)
 * @apiError invalid_access_token The token supplied is not valid (403)
 */
  pushme: function (req, res, next) {
    const ref = 'outer-space-manager/users/' + req.user.username + '/tokens'
    console.log(ref)
    var tokensRef = db.ref(ref)
    tokensRef.once('value', function (snapshot) {
      console.log('Successfully fetched reports')
      var reportsFetched = snapshot.val()
      console.log('Reports: ' + JSON.stringify(reportsFetched))
      if (!reportsFetched) {
        res.json({code: 'ok'})
      } else {
        for (var key in reportsFetched) {
          var payload = {
            data: {
              score: '850',
              time: '2:45'
            }
          }
          require('../db/db').messaging().sendToDevice(reportsFetched[key].token, payload)
            .then(function (response) {
              // See the MessagingDevicesResponse reference documentation for
              // the contents of response.
              console.log(JSON.stringify(response))
              console.log('Successfully sent message:', response)
            })
            .catch(function (error) {
              console.log(JSON.stringify(error))
              console.log('Error sending message:', error)
            })
        }
        res.json({code: 'ok'})
      }
    }, function (errorObject) {
      console.log('Error fetching reports : ' + errorObject)
    })
  },
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
