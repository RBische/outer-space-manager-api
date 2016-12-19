var seed = {
  fillDb: function() {
    console.log("Filling db");
    var admin = require('../db/db');
    // As an admin, the app has access to read and write all data, regardless of Security Rules
    var db = admin.database();
    var ref = db.ref("outer-space-manager").child("buildings");
    ref.remove();
    ref.update(
    {
      0:{
        "name": "Centrale électrique"
      },
      1:{
        "name": "Centrale électrique"
      }
    }
    );
  }
}

module.exports = seed;
