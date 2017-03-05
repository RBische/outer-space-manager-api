var admin = require('../db/db')
var db = admin.database()
var queueRef = db.ref('outer-space-manager/queue')
var ref = db.ref('outer-space-manager')

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
    queueRef.orderByKey().once('value', function (snapshot) {
      var queueItems = snapshot.val()
      if (!queueItems) {
        callback()
      }
      if (queueItems) {
        executeItems(Object.keys(queueItems), queueItems, function () {
          callback()
        })
      }
    }, function (errorObject) {
      callback()
    })
  }
}

function executeItems (keys, items, callback) {
  if (keys.length > 0) {
    var currentKey = keys.shift()
    var currentItem = items[currentKey]
    if (currentItem.executionTime <= Date.now()) {
      console.log('Executing item : ' + currentItem.executionTime)
      ref.child(currentItem.key).update(
        currentItem.object, function (error) {
          if (error) {
            console.log('Data in queue could not be executed.' + error)
          } else {
            console.log('Data in queue executed successfully.')
          }
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
                    return ref.child(currentItem.key)
                      .once('value')
                      .then(function (res) {
                        if (res.val()) {
                          const ship = res.val()
                          console.log('Current ships amount :' + ship.amount)
                          console.log('Amount in queue :' + currentItem.amount)
                          ship.amount = ship.amount + currentItem.amount
                          return ship
                        } else {
                          return currentItem.object
                        }
                      })
                      .then(function (ship) {
                        return ref.child(currentItem.key).update(ship)
                      })
                      .then(function (res) {
                        return executeItems(keys, items, callback)
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
      )
    } else {
      callback()
    }
  } else {
    callback()
  }
}

module.exports = queue
