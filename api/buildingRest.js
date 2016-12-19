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
}

module.exports = building;
