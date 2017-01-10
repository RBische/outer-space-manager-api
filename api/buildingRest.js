var admin = require('../db/db');
var userRest = require('../api/userRest');
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
var ref = db.ref("outer-space-manager");

var building = {
  getBuildings: function(req, res) {
    var buildingsRef = ref.child("buildings");
    buildingsRef.once("value", function(snapshot) {
      console.log("Successfully fetched user");
      var buildingFetched = snapshot.val();

      if (!buildingFetched) {
        res.respond("No buildings found", "no_buildings_found", 404);
        return;
      }
      if (buildingFetched) {
        res.json({
          size:buildingFetched.length,
          buildings:buildingFetched
        });
      }
    }, function (errorObject) {
      console.log("Error fetching user : "+errorObject);
    });
  },
  getBuildingsForUser: function(req, res) {
    if (req.params.username!=undefined){
      console.log("Current username:"+req.params.username);
      var buildingsRef = ref.child("users/"+req.params.username+"/buildings");
      buildingsRef.once("value", function(snapshot) {
        console.log("Successfully fetched buildings for user");
        var buildingFetched = snapshot.val();

        if (!buildingFetched) {
          res.respond("No buildings found", "no_buildings_found", 404);
          return;
        }
        if (buildingFetched) {
          res.json({
            size:buildingFetched.length,
            buildings:buildingFetched
          });
        }
      }, function (errorObject) {
        console.log("Error fetching user : "+errorObject);
      });
    }else{
      res.respond("Invalid request, no username given", "invalid_request", 401);
      return;
    }
  },
  createBuildingForUser: function(req, res){
    if (req.user!=undefined || req.user.username!=undefined || req.params.buildingId!=undefined){
      var user = req.user;
      var buildingsRef = ref.child("users/"+user.username+"/buildings/"+req.params.buildingId);
      buildingsRef.once("value", function(snapshot) {
        var buildingFetched = snapshot.val();
        console.log("Successfully fetched buildings for user");
        if (!buildingFetched) {
          res.respond("No buildings found", "no_buildings_found", 404);
          return;
        }
        if (buildingFetched) {
          var userBuildingsFetched = snapshot.val();
          var futureLevel = buildingFetched.level + 1;
          var mineralCost = buildingFetched.mineralCostByLevel*buildingFetched.level+buildingFetched.mineralCostLevel0;
          var gasCost = buildingFetched.gasCostByLevel*buildingFetched.level+buildingFetched.gasCostLevel0;
          if (userRest.hasSufficientResources(user.minerals, user.gas, mineralCost, gasCost)){
            //TODO: remove resources used + add to queue
            res.json({code:"ok"});
          }else{
            res.respond("Not enough resources", "not_enough_resources", 401);
            return;
          }
        }
      }, function (errorObject) {
        console.log("Error fetching buildings for user : "+errorObject);
      });
    }else{
      res.respond("Invalid request, no username given", "invalid_request", 401);
      return;
    }
  },
  addBuilding: function(username, buildingId){
    console.log("Must update building "+buildingId+" for username "+ username);
    var buildingsRef = ref.child("buildings/"+buildingId);
    buildingsRef.once("value", function(snapshot) {
      var buildingFetched = snapshot.val();

      if (!buildingFetched) {
        return;
      }
      if (buildingFetched) {
        console.log("Updating building "+buildingId);
        var userRef = ref.child("users/"+username+"/buildings");
        buildingToSave = extend(buildingFetched, {level:1});
        var buildings = {};
        buildings[buildingId] = buildingToSave;
        userRef.update(buildings);
      }
    }, function (errorObject) {
      console.log("Error fetching building : "+errorObject);
    });
  }
}

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}

module.exports = building;
