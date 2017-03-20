var admin = require('../db/db')
var seed = {
  fillDb: function () {
    console.log('Filling db')

    // As an admin, the app has access to read and write all data, regardless of Security Rules
    var db = admin.database()
    var refBuildings = db.ref('outer-space-manager').child('buildings')
    refBuildings.remove()
    refBuildings.update(
      {
        0: {
          'buildingId': 0,
          'name': 'Usine de nanites',
          'imageUrl': 'http://www.raphaelbischof.fr/img/usine.jpg',
          'effect': 'speed_building',
          'amountOfEffectByLevel': 30,
          'amountOfEffectLevel0': 0,
          'timeToBuildByLevel': 200,
          'timeToBuildLevel0': 60,
          'mineralCostByLevel': 200,
          'mineralCostLevel0': 100,
          'gasCostByLevel': 200,
          'gasCostLevel0': 100
        },
        1: {
          'buildingId': 1,
          'name': 'Spatioport',
          'imageUrl': 'http://www.raphaelbischof.fr/img/spatioport.jpg',
          'effect': 'speed_fleet',
          'amountOfEffectByLevel': 100,
          'amountOfEffectLevel0': 100,
          'timeToBuildByLevel': 200,
          'timeToBuildLevel0': 60,
          'mineralCostByLevel': 200,
          'mineralCostLevel0': 100,
          'gasCostByLevel': 200,
          'gasCostLevel0': 100
        },
        2: {
          'buildingId': 2,
          'name': 'Mine automatisée',
          'imageUrl': 'http://www.raphaelbischof.fr/img/mine.jpg',
          'effectAdded': 'mineral_modifier',
          'amountOfEffectByLevel': 100,
          'amountOfEffectLevel0': 100,
          'timeToBuildByLevel': 200,
          'timeToBuildLevel0': 60,
          'mineralCostByLevel': 200,
          'mineralCostLevel0': 100,
          'gasCostByLevel': 200,
          'gasCostLevel0': 100
        }
      }
    )
    var refShips = db.ref('outer-space-manager').child('ships')
    refShips.remove()
    refShips.update(
      {
        0: {
          'shipId': 0,
          'name': 'Chasseur léger',
          'spatioportLevelNeeded': 0,
          'timeToBuild': 30,
          'mineralCost': 300,
          'gasCost': 100,
          'minAttack': 40,
          'maxAttack': 60,
          'life': 60,
          'shield': 15,
          'speed': 1000,
          'capacity': 30
        },
        1: {
          'shipId': 1,
          'name': 'Chasseur lourd',
          'spatioportLevelNeeded': 2,
          'timeToBuild': 60,
          'mineralCost': 600,
          'gasCost': 250,
          'minAttack': 90,
          'maxAttack': 110,
          'life': 120,
          'shield': 50,
          'speed': 850,
          'capacity': 100
        },
        2: {
          'shipId': 2,
          'name': 'Sonde d\'espionnage',
          'spatioportLevelNeeded': 0,
          'timeToBuild': 10,
          'mineralCost': 20,
          'gasCost': 10,
          'minAttack': 0,
          'maxAttack': 0,
          'life': 1,
          'shield': 0,
          'speed': 150000,
          'capacity': 0
        },
        3: {
          'shipId': 3,
          'name': 'Destroyer',
          'spatioportLevelNeeded': 2,
          'timeToBuild': 180,
          'mineralCost': 0,
          'gasCost': 1000,
          'minAttack': 100,
          'maxAttack': 150,
          'life': 5,
          'shield': 100,
          'speed': 800,
          'capacity': 250
        },
        4: {
          'shipId': 4,
          'name': 'Etoile de la mort',
          'spatioportLevelNeeded': 6,
          'timeToBuild': 500,
          'mineralCost': 5000,
          'gasCost': 5000,
          'minAttack': 1400,
          'maxAttack': 1600,
          'life': 100,
          'shield': 1200,
          'speed': 400,
          'capacity': 3000
        }
      }
    )
    var refSearches = db.ref('outer-space-manager').child('searches')
    refSearches.remove()
    refSearches.update(
      {
        0: {
          'searchId': 0,
          'name': 'Recherche robotique',
          'effect': 'speed_building',
          'amountOfEffectByLevel': 30,
          'amountOfEffectLevel0': 0,
          'timeToBuildByLevel': 200,
          'timeToBuildLevel0': 60,
          'mineralCostByLevel': 200,
          'mineralCostLevel0': 100,
          'gasCostByLevel': 200,
          'gasCostLevel0': 100
        },
        1: {
          'searchId': 1,
          'name': 'Recherche moteurs',
          'effect': 'speed_fleet',
          'amountOfEffectByLevel': 100,
          'amountOfEffectLevel0': 100,
          'timeToBuildByLevel': 200,
          'timeToBuildLevel0': 60,
          'mineralCostByLevel': 200,
          'mineralCostLevel0': 100,
          'gasCostByLevel': 200,
          'gasCostLevel0': 100
        }
      }
    )
  }
}

module.exports = seed
