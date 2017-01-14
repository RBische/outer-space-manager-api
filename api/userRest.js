var admin = require('../db/db');
// As an admin, the app has access to read and write all data, regardless of Security Rules
var db = admin.database();
var ref = db.ref("outer-space-manager");

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
  }
}

module.exports = user;
