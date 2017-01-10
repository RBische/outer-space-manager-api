var admin = require('../db/db');
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
    var buildingsRef = ref.child("users/"+req.params.username+"/buildings");
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
  addBuilding: function(username, buildingId){
    var buildingRef = ref.child("buildings/"+buildingId);
    buildingRef.once("value", function(snapshot) {
      var buildingFetched = snapshot.val();

      if (!buildingFetched) {
        return;
      }
      if (buildingFetched) {
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
