var debug = require("debug")("storage:memory"),
    Collection = require("./collection");

var Storage = function(options) {
  debug("construct");
  options = options || {};
  this.store = options.store || {};
};

// `idKey` should tell the database the primary key of records
Storage.prototype.idKey = "id";

// Should provide means to connect
// Accept a function `callback` as the only arguments
Storage.prototype.connect = function (callback) {
  if(callback) {
    callback();
  }
};


// Should privde means to disconnect
Storage.prototype.disconnect = function (callback) {
  if(callback) {
    callback();
  }
};


// Should create a collection instance
// `Collection` is the abstraction of a group of records with some associations; say it the `table` in mysql, `collection` in mongo
//
// * `name`: collection name
//
// returns a yieldable for `co` context
Storage.prototype.collection = function (name) {
  debug("build collection %s", name);
  var self = this;
  return function*() {
    if(!self.store[name]) {
      self.store[name] =  new Collection(name);
    }
    return self.store[name];
  };
};


// `buildUpdate` handles the update input for underlying database
//  This is vendor specific
// * `update`: the update object from request body (`this.request.body`)
//
// returns the processed update object
Storage.prototype.buildUpdate = function(update) {
  return update;
};

// `buildQuery` handles the query input for underlying database
// This is vendor specific
// * `query`: the query object from request query (`this.query.criteria`)
Storage.prototype.buildQuery = function(query) {
  return query;
};


// `buildSort` create the sort descriptor for underlying database
// `sort`: the sort object for request query (`this.query.sort`)
// This is vendor specific
// returns the sort descriptor that's acceptable by database vendors
// we are building `lodash` sort descrptor here
Storage.prototype.buildSort = function (sort) {
  if(typeof sort === "string") {
    return sort.split(",");
  }
  //assuming it's in array represention
  return sort;
};


module.exports = Storage;