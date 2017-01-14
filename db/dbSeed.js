var seed = {
  fillDb: function() {
    console.log("Filling db");
    var admin = require('../db/db');
    // As an admin, the app has access to read and write all data, regardless of Security Rules
    var db = admin.database();
    var refBuildings = db.ref("outer-space-manager").child("buildings");
    refBuildings.remove();
    refBuildings.update(
    {
      0:{
        "name": "Centrale électrique",
        "effect":"speed_building",
        "amountOfEffectByLevel":30,
        "amountOfEffectLevel0":0,
        "timeToBuildByLevel":200,
        "timeToBuildLevel0":60,
        "mineralCostByLevel":200,
        "mineralCostLevel0":100,
        "gasCostByLevel":200,
        "gasCostLevel0":100
      },
      1:{
        "name": "Spatioport",
        "effect":"speed_fleet",
        "amountOfEffectByLevel":100,
        "amountOfEffectLevel0":100,
        "timeToBuildByLevel":200,
        "timeToBuildLevel0":60,
        "mineralCostByLevel":200,
        "mineralCostLevel0":100,
        "gasCostByLevel":200,
        "gasCostLevel0":100
      }
    }
    );
    var refVessels = db.ref("outer-space-manager").child("vessels");
    refVessels.remove();
    refVessels.update(
    {
      0:{
        "name": "Centrale électrique",
        "effect":"speed_building",
        "amountOfEffectByLevel":100,
        "amountOfEffectLevel0":100,
        "timeToBuildByLevel":200,
        "timeToBuildLevel0":60,
        "costByLevel":200,
        "costLevel0":100
      },
      1:{
        "name": "Spatioport",
        "effect":"speed_fleet",
        "amountOfEffectByLevel":100,
        "amountOfEffectLevel0":100,
        "timeToBuildByLevel":200,
        "timeToBuildLevel0":60,
        "costByLevel":200,
        "costLevel0":100
      }
    }
    );
  }
}

module.exports = seed;
