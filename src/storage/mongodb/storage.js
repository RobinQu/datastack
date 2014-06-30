var mongo = require("co-mongo"),
    co = require("co"),
    Collection = require("./collection"),
    _ = require("lodash"),
    debug = require("debug")("datastack:mongo"),
    defaults = require("./defaults");

var MongoStorage = function(options) {
  this.uri = options.uri;
  defaults.setOptions(["idKey", "objectIdAsKey", "writeConcern", "timestamp"], options, this);
};

var UpdateOperators = ["$set", "$inc", "$mul", "$rename", "$setOnInsert", "$unset", "$min", "$max", "$currentDate"];

MongoStorage.prototype.connect = co(function*() {
  this.db = yield mongo.connect(this.uri);
});

MongoStorage.prototype.disconnect = co(function*() {
  yield this.db.close();
});

MongoStorage.prototype.middleware = function() {
  var self = this;
  return function* datastackStorage(next) {
    // `this` refers to the koa context
    if(this.query.sort) {
      this.sort = self.buildSort(this.query.sort);
    }
    if(this.query.criteria) {
      this.condtions = self.buildQuery(this.query.criteria);
    }
    this.collection = self.collection.bind(self);
    yield next;
  };
};

MongoStorage.prototype.collection = function(name) {
  var self = this;
  return function*() {
    var col = yield self.db.collection(name);
    //ensure index
    var indexes = yield col.indexInformation();
    if(!indexes[self.idKey + "_1"]) {
      debug("ensure index");
      indexes = {};
      indexes[self.idKey] = 1;
      yield col.ensureIndex(indexes, {
        unique: true,
        sparse: true
      });
    }
    
    //we use a wrapper to adapat
    return new Collection(col, {
      idKey: self.idKey,
      objectIdAsId: self.objectIdAsId,
      writeConcern: self.writeConcern,
      timestamp: self.timestamp
    });
  };
};

MongoStorage.prototype.buildSort = function (sort) {
  if(!sort) {//return default sort if none is given
    return this.timestamp ? [["ctime", -1]] : [];
  }
  
  if(typeof sort === "string") {
    // String pattern: a:1,b:-1
    return sort.split(",").reduce(function(prev, cur) {
      var pair = cur.split(":");
      prev.push([pair[0].trim(), parseInt(pair[1].trim(), 10)]);
      return prev;
    }, []);
  }
  //Object pattern, {a:1, b:-1}
  return Object.keys(sort).reduce(function(prev, cur) {
    prev.push([cur.trim(), parseInt(sort[cur].trim(), 10)]);
  }, []);
};

MongoStorage.prototype.buildQuery = function(query) {
  //TODO: escapse, etc
  return query;
};

MongoStorage.prototype.buildUpdate = function (update) {
  var hasOperator = _.intersection(Object.keys(update), UpdateOperators).length;
  if(!hasOperator) {//we wrap the update hash with `$set`
    return {
      "$set": update
    };
  }
  return update;
};

module.exports = MongoStorage;