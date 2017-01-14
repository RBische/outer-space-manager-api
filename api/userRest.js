var admin = require('../db/db');
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
var ref = db.ref("outer-space-manager");
var globalConfig = require("../config/globalConfig");

var user = {
  hasSufficientResources: function(userMineral, userGas, mineral, gas){
    return userMineral>=mineral&&userGas>=gas;
  },
  changeResources: function(username, minerals, gas){
    var userRef = ref.child("users/"+username);
    userRef.once("value", function(snapshot) {
      var userFetched = snapshot.val();
      userFetched.minerals = userFetched.minerals + minerals;
      userFetched.gas = userFetched.gas + gas;
      ref.child("users/"+username).update(userFetched);
    }, function (errorObject) {
      console.log("Error giving resources");
    });
  },
  refreshResources: function(user, callback){
    var dateAfter = Date.now();
    var mineralsAfter = user.minerals + globalConfig.mineralsGenerated * user.mineralsModifier * ((dateAfter - user.lastResourcesRefresh)/1000);
    var gasAfter = user.gas + globalConfig.gasGenerated * user.gasModifier * ((dateAfter - user.lastResourcesRefresh)/1000);
    user.minerals = mineralsAfter;
    user.gas = gasAfter;
    user.lastResourcesRefresh = dateAfter;
    var userRef = ref.child("users/"+user.username).update({minerals:mineralsAfter, gas:gasAfter, lastResourcesRefresh: dateAfter},
      function (error){
        callback(user);
      }
    );
  },
  loadUser: function(username, callback){
    var userRef = ref.child("users/"+username);
    userRef.once("value",
      function(snapshot) {
        var userFetched = snapshot.val();
        if (userFetched == null){
          callback(null);
          return;
        }
        userRest.refreshResources(userFetched, function(user){
          callback(user);
        });
      },
      function (errorObject) {
      res.respond("Oups, server is not that ok with your request", "server_bad_response", 500);
    });
  }
}

module.exports = user;
