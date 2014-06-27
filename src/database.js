/*jshint esnext: true */

var co = require("co");

var Database = function(options) {};

Database.prototype.connect = function () {
  
};

Database.prototype.disconnect = co(function*() {
  yield this.db.close();
});


Database.prototype.save = co(function*(record, options) {
  var collection = yield db.collection(record.type);
  yield collection.insert(record.toJSON(), options);
});