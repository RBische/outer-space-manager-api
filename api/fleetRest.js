var admin = require('../db/db')
// var globalConfig = require('../config/globalConfig')
// var userRest = require('../api/userRest')
// var queueHelper = require('../db/queueHelper')
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database()
var ref = db.ref('outer-space-manager')

var fleet = {
  getShips: function (req, res) {
    var shipsRef = ref.child('ships')
    shipsRef.once('value', function (snapshot) {
      console.log('Successfully fetched ships')
      var shipsFetched = snapshot.val()

      if (!shipsFetched) {
        res.respond('No ships found', 'no_ships_found', 404)
        return
      }
      if (shipsFetched) {
        res.json({
          size: shipsFetched.length,
          ships: shipsFetched
        })
      }
    }, function (errorObject) {
      console.log('Error fetching ships : ' + errorObject)
    })
  },
  getShipsForUser: function (req, res) {
    if (req.user.username !== undefined) {
      console.log('Current username:' + req.user.username)
      var shipsRef = ref.child('users/' + req.user.username + '/fleet')
      shipsRef.once('value', function (snapshot) {
        console.log('Successfully fetched fleet for user')
        var shipsFetched = snapshot.val()
        if (shipsFetched) {
          res.json({
            size: shipsFetched.length,
            searches: shipsFetched
          })
        } else {
          res.json({
            size: 0,
            searches: []
          })
        }
      }, function (errorObject) {
        console.log('Error fetching user : ' + errorObject)
      })
    } else {
      res.respond('Invalid request, no username given', 'invalid_request', 401)
      return
    }
  },
  addShip: function (username, shipId, amount) {
    console.log('Must add ship ' + shipId + ' for username ' + username)
    var shipsRef = ref.child('ships/' + shipId)
    return new Promise(function (resolve, reject) {
      shipsRef.once('value', function (snapshot) {
        var shipfetched = snapshot.val()
        if (!shipfetched) {
          reject()
        } else {
          resolve(shipfetched)
        }
      }, function (errorObject) {
        console.log('Error fetching building : ' + errorObject)
      })
    })
    .then(function (shipfetched) {
      console.log('Creating ships ' + shipId)
      return new Promise(function (resolve, reject) {
        var shipsRef = ref.child('users/' + username + '/fleet/' + shipId)
        shipsRef.once('value', function (snapshot) {
          var userShipsFetched = snapshot.val()
          if (userShipsFetched) {
            userShipsFetched.amount = userShipsFetched.amount + amount
            resolve(userShipsFetched)
          } else {
            const firstShip = shipfetched
            firstShip.amount = amount
            resolve(firstShip)
          }
        })
      })
    })
    .then(function (ships) {
      var userRef = ref.child('users/' + username + '/fleet/' + shipId)
      return userRef.update(ships)
    })
    .catch(function (rejection) {
      console.log('Oups :' + rejection)
    })
  }
}

module.exports = fleet
