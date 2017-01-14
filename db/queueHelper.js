var admin = require('../db/db');
var db = admin.database();
var queueRef = db.ref("outer-space-manager/queue");

var queue = {
  addToQueue: function(objectType, object, key, executionTime, callback) {
    queueRef.child((executionTime)).update(
      {
        objectType:objectType,
        object:object,
        key:key,
        executionTime: executionTime
      }, function(error) {
        if (error) {
          console.log("Data in queue could not be saved." + error);
        } else {
          console.log("Data in queue saved successfully.");
        }
        callback();
      }
    );
  }
}

module.exports = queue;
