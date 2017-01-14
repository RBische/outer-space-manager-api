var admin = require('../db/db');
var db = admin.database();
var queueRef = db.ref("outer-space-manager/queue");
var ref = db.ref("outer-space-manager");

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
  },
  executeQueue: function(callback) {
      queueRef.orderByKey().once("value", function(snapshot) {
        var queueItems = snapshot.val();
        if (!queueItems) {
          callback();
        }
        if (queueItems) {
          executeItems(Object.keys(queueItems), queueItems, function(){
            callback();
          });
        }
      }, function (errorObject) {
        callback();
      });
  }
}

function executeItems(keys, items, callback){
  if (keys.length>0){
    var currentKey = keys.shift();
    var currentItem = items[currentKey];
    if (currentItem.executionTime <= Date.now()){
      console.log("Executing item : " + currentItem.executionTime);
      var refToUpdate = ref.child(currentItem.key).update(
        currentItem.object, function(error) {
          if (error) {
            console.log("Data in queue could not be executed." + error);
          } else {
            console.log("Data in queue executed successfully.");
          }
          queueRef.child("" + currentItem.executionTime).remove(
            function(error) {
              if (error) {
                console.log("Data in queue could not be remove." + error);
              } else {
                console.log("Data in queue removed successfully.");
              }
              executeItems(keys, items, callback);
            }
          );
        }
      );
    }else{
      callback();
    }
  }else {
    callback();
  }
}

module.exports = queue;
