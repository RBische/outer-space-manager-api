var admin = require('../db/db')
var db = admin.database()
var queueRef = db.ref('outer-space-manager/queue')
var ref = db.ref('outer-space-manager')
var running = false
var queue = {
  addToQueue: function (objectType, object, key, executionTime, points, username, callback, amount) {
    queueRef.child((executionTime)).update(
      {
        objectType: objectType,
        object: object,
        key: key,
        executionTime: executionTime,
        username: username,
        points: points,
        amount: amount || 0
      }, function (error) {
      if (error) {
        console.log('Data in queue could not be saved.' + error)
      } else {
        console.log('Data in queue saved successfully.')
      }
      callback()
    }
    )
  },
  clearQueue: function () {
    queueRef.remove()
  },
  deleteQueueForUser: function (username) {
    queueRef.orderByChild('username').equalTo(username).once('value', function (snapshot) {
      snapshot.forEach(function (child) {
        child.remove()
      })
    })
  },
  executeQueue: function (callback) {
    if (!running) {
      running = true
      queueRef.orderByKey().once('value', function (snapshot) {
        var queueItems = snapshot.val()
        if (!queueItems) {
          running = false
          callback()
        }
        if (queueItems) {
          executeItems(Object.keys(queueItems), queueItems, function () {
            running = false
            callback()
          })
        }
      }, function (errorObject) {
        running = false
        callback()
      })
    } else {
      callback()
    }
  }
}

function executeItems (keys, items, callback) {
  if (keys.length > 0) {
    var currentKey = keys.shift()
    var currentItem = items[currentKey]
    if (currentItem.executionTime <= Date.now()) {
      console.log('Executing item : ' + currentItem.executionTime)
      var afterModifying = function () {
        queueRef.child('' + currentItem.executionTime).remove(
          function (error) {
            if (error) {
              console.log('Data in queue could not be remove.' + error)
            } else {
              console.log('Data in queue removed successfully.')
            }
            var userRef = ref.child('users/' + currentItem.username)
            userRef.once('value', function (snapshot) {
              var userFetched = snapshot.val()
              userFetched.points = userFetched.points + currentItem.points
              userFetched.pointsInv = 10000000000 - (userFetched.points + currentItem.points)
              ref.child('users/' + currentItem.username).update(userFetched, function (error) {
                if (error) {
                  console.log('Points not added to user : ' + error)
                } else {
                  console.log('Points successfully added')
                }
                if (currentItem.object.hasOwnProperty('effect') && currentItem.object.hasOwnProperty('level')) {
                  var effect = {}
                  effect[currentItem.object.effect] = currentItem.object.level * currentItem.object.amountOfEffectByLevel + currentItem.object.amountOfEffectLevel0
                  console.log(JSON.stringify(effect))
                  ref.child('users/' + currentItem.username).update(effect, function (error) {
                    if (error) {
                      console.log('Effect not added to user : ' + error)
                    } else {
                      console.log('Effect successfully added')
                    }
                    executeItems(keys, items, callback)
                  })
                } else if (currentItem.objectType === 'ships') {
                  console.log('Retrieving value')
                  return require('../db/db').database().ref('outer-space-manager/' + currentItem.key)
                    .once('value')
                    .then(function (snapshot) {
                      const ship = snapshot.val()
                      if (ship) {
                        console.log(currentItem.key)
                        console.log('Current ships amount :' + ship.amount)
                        console.log('Amount in queue :' + currentItem.amount)
                        var amount = 0
                        if (ship.amount) {
                          amount = ship.amount + currentItem.amount
                        } else {
                          amount = currentItem.amount
                        }
                        console.log('Amount after :' + amount)
                        ship.amount = amount
                        return ship
                      } else {
                        const ret = Object.assign(currentItem.object, {amount: currentItem.amount})
                        return ret
                      }
                    })
                    .then(function (ship) {
                      console.log('Updating ships :' + ship)
                      return require('../db/db').database().ref('outer-space-manager/' + currentItem.key).update(ship)
                    })
                    .then(function (res) {
                      console.log('Update done')
                      executeItems(keys, items, callback)
                    })
                } else if (currentItem.object.hasOwnProperty('effect_added') && currentItem.object.hasOwnProperty('level')) {
                  ref.child('users/' + currentItem.username).once('value', function (snapshot) {
                    const userToModify = snapshot.val()
                    if (userToModify) {
                      var effect = {}
                      effect[currentItem.object.effect_added] = userToModify[currentItem.object.effect_added] + currentItem.object.amountOfEffectByLevel
                      console.log(JSON.stringify(effect))
                      ref.child('users/' + currentItem.username).update(effect, function (error) {
                        if (error) {
                          console.log('Effect not added to user : ' + error)
                        } else {
                          console.log('Effect successfully added')
                        }
                        executeItems(keys, items, callback)
                      })
                    } else {
                      executeItems(keys, items, callback())
                    }
                  })
                } else {
                  executeItems(keys, items, callback)
                }
              })
            }, function (errorObject) {
              console.log('Error giving resources')
            })
          }
        )
      }
      if (currentItem.objectType === 'ships') {
        afterModifying()
      } else {
        ref.child(currentItem.key).update(
          currentItem.object, function (error) {
            if (error) {
              console.log('Data in queue could not be executed.' + error)
            } else {
              console.log('Data in queue executed successfully.')
            }
            afterModifying()
          }
        )
      }
    } else {
      callback()
    }
  } else {
    callback()
  }
}

module.exports = queue
