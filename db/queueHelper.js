var admin = require('../db/db')
var db = admin.database()
var queueRef = db.ref('outer-space-manager/queue')
var ref = db.ref('outer-space-manager')
var running = false
var queue = {
  addToQueue: function (objectType, object, key, executionTime, points, username, callback, amount) {
    const objectToSave = {
      objectType: objectType,
      object: object,
      key: key,
      executionTime: executionTime,
      username: username,
      points: points,
      amount: amount || 0
    }
    queueRef.child((executionTime)).update(
      objectToSave, function (error) {
        if (error) {
          console.log('Data in queue could not be saved.' + error)
        } else {
          console.log('Data in queue saved successfully.')
          console.log(objectToSave)
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
      } else if (currentItem.objectType === 'attack') {
        handleAttack(currentItem, keys, items, callback)
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
function handleAttack (currentItem, keys, items, callback) {
  queueRef.child('' + currentItem.executionTime).remove(
    function (error) {
      if (error) {
        console.log('Data in queue could not be remove.' + error)
      } else {
        console.log('Data in queue removed successfully.')
      }
      // TODO: Update the user before the battle begins
      const messageObject = currentItem.object
      ref.child('users/' + messageObject.toUser)
        .once('value')
        .then(function (attackedUser) {
          return ref.child('users/' + messageObject.fromUser)
            .once('value')
            .then(function (attacker) {
              return ref.child('ships')
                .once('value')
                .then(function (ships) {
                  return {attacker: attacker.val(), attackedUser: attackedUser.val(), ships: ships.val()}
                })
            })
        })
        .then(function (res) {
          const defenderFleet = []
          for (var key in res.attackedUser.fleet) {
            if (res.attackedUser.fleet.hasOwnProperty(key)) {
              defenderFleet.push(res.attackedUser.fleet[key])
            }
          }
          const attackPointsAttacker = calculateAttackPoints(messageObject.fleet, res.ships)
          const attackPointsDefender = calculateAttackPoints(defenderFleet, res.ships)
          const shieldPointsAttacker = calculateShieldPoints(messageObject.fleet, res.ships)
          const shieldPointsDefender = calculateShieldPoints(defenderFleet, res.ships)
          const damageThroughAttacker = Math.max(attackPointsDefender - shieldPointsAttacker, 0)
          const damageThroughDefender = Math.max(attackPointsAttacker - shieldPointsDefender, 0)
          const attackerFleetAfterBattle = getFleetAfterFight(damageThroughAttacker, messageObject.fleet, res.ships)
          const defenderFleetAfterBattle = getFleetAfterFight(damageThroughDefender, defenderFleet, res.ships)
          var mineralsWon = 0
          var gasWon = 0
          console.log('Updating fleet toUser' + JSON.stringify(defenderFleetAfterBattle.fleet))
          return ref.child('users/' + messageObject.toUser + '/fleet').update(defenderFleetAfterBattle.fleet)
            .then(function (fbRes) {
              const promises = []
              for (var key in attackerFleetAfterBattle.fleet) {
                if (attackerFleetAfterBattle.fleet.hasOwnProperty(key)) {
                  var attackerTotalShipsAfterBattle = attackerFleetAfterBattle.fleet[key].amount
                  console.log('Amount of this ship in flight ' + attackerFleetAfterBattle.fleet[key].amount)
                  if (res.attacker.fleet !== undefined && res.attacker.fleet.hasOwnProperty(key)) {
                    attackerTotalShipsAfterBattle += res.attacker.fleet[key].amount
                    console.log('Amount of this ship in user ' + res.attacker.fleet[key].amount)
                  }
                  console.log('Updating ship fromUser ' + JSON.stringify({amount: attackerTotalShipsAfterBattle}) + ' with node : ' + 'users/' + messageObject.fromUser + '/fleet/' + key)
                  const promise = ref.child('users/' + messageObject.fromUser + '/fleet/' + key).update({amount: attackerTotalShipsAfterBattle})
                  promises.push(promise)
                }
              }
              return Promise.all(promises)
            })
            .then(function (fbRes) {
              if (defenderFleetAfterBattle.survivingShips === 0) {
                const totalCapacity = attackerFleetAfterBattle.capacity
                const defenderMinerals = res.attackedUser.minerals
                const defenderGas = res.attackedUser.gas
                var mineralsAfter = 0
                var gasAfter = 0
                if ((defenderGas * 1) / 3 + (defenderMinerals * 1) / 3 > totalCapacity) {
                  mineralsWon = (totalCapacity * 2) / 3
                  gasWon = (totalCapacity * 1) / 3
                } else {
                  mineralsWon = (defenderMinerals * 1) / 3
                  gasWon = (defenderGas * 1) / 3
                }
                mineralsAfter = defenderMinerals - mineralsWon
                gasAfter = defenderGas - gasWon
                console.log('Minerals won : ' + mineralsWon + ' Gas won : ' + gasWon)
                return ref.child('users/' + messageObject.toUser).update({minerals: mineralsAfter, gas: gasAfter})
                  .then(function (fbRes) {
                    return ref.child('users/' + messageObject.fromUser).update({minerals: mineralsWon + res.attacker.minerals, gas: gasAfter + res.attacker.gas})
                  })
              }
            })
            .then(function (fbRes) {
              console.log('Creating reports')
              return ref.child('users/' + messageObject.toUser + '/reports').push({type: 'attacked',
                date: currentItem.executionTime,
                defenderFleet: defenderFleet,
                attackerFleet: messageObject.fleet,
                defenderFleetAfterBattle: defenderFleetAfterBattle,
                attackerFleetAfterBattle: attackerFleetAfterBattle,
                mineralsWon: mineralsWon,
                gasWon: gasWon
              })
              .then(function (res) {
                return ref.child('users/' + messageObject.fromUser + '/reports').push({type: 'attacker',
                  date: currentItem.executionTime,
                  defenderFleet: defenderFleet,
                  attackerFleet: messageObject.fleet,
                  defenderFleetAfterBattle: defenderFleetAfterBattle,
                  attackerFleetAfterBattle: attackerFleetAfterBattle,
                  mineralsWon: mineralsWon,
                  gasWon: gasWon
                })
              })
            })
        })
        .then(function (res) {
          executeItems(keys, items, callback)
        })
    })
}

function getFleetAfterFight (damageTaken, fleet, ships) {
  const shipTypes = Object.keys(fleet).length
  const damagePerShips = damageTaken / shipTypes
  const fleetSurviving = {}
  var totalCapacity = 0
  var survivingShips = 0
  for (var i = 0; i < fleet.length; i++) {
    console.log('Calculating fleet after fight for ship:' + JSON.stringify(fleet[i]))
    const lifeForShip = ships[fleet[i].shipId].life
    console.log('Damage per ship:' + damagePerShips)
    console.log('Life for ship:' + lifeForShip)
    console.log('Must stay ' + ((fleet[i].amount * lifeForShip) - damagePerShips) / lifeForShip + ' ships after battle')
    const shipsSurviving = Math.round(((fleet[i].amount * lifeForShip) - damagePerShips) / lifeForShip)
    console.log('Was :' + fleet[i].amount + ' and now: ' + shipsSurviving)
    fleetSurviving[fleet[i].shipId] = {amount: shipsSurviving}
    totalCapacity += ships[fleet[i].shipId].capacity * shipsSurviving
    survivingShips += shipsSurviving
  }
  return {fleet: fleetSurviving, capacity: totalCapacity, survivingShips: survivingShips}
}

function calculateAttackPoints (fleet, ships) {
  var attackPoints = 0
  for (var i = 0; i < fleet.length; i++) {
    if (ships.hasOwnProperty(fleet[i].shipId)) {
      attackPoints += getRandomArbitrary(ships[fleet[i].shipId].minAttack, ships[fleet[i].shipId].maxAttack) * fleet[i].amount
    }
  }
  return attackPoints
}

function calculateShieldPoints (fleet, ships) {
  var attackPoints = 0
  for (var i = 0; i < fleet.length; i++) {
    if (ships.hasOwnProperty(fleet[i].shipId)) {
      attackPoints += ships[fleet[i].shipId].shield * fleet[i].amount
    }
  }
  return attackPoints
}

function getRandomArbitrary (min, max) {
  return Math.random() * (max - min) + min
}

module.exports = queue
