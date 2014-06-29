var mongo = require("co-mongo"),
    co = require("co"),
    Collection = require("./collection"),
    _ = require("lodash");

var MongoStorage = function(options) {
  this.uri = options.uri;
};

var UpdateOperators = ["$set", "$inc", "$mul", "$rename", "$setOnInsert", "$unset", "$min", "$max", "$currentDate"];

MongoStorage.prototype.connect = co(function*() {
  this.db = yield mongo.connect(this.uri);
});

MongoStorage.prototype.disconnect = co(function*() {
  yield this.db.close();
});

MongoStorage.prototype.middleware = function () {
  var self = this;
  return function*(next) {
    // `this` refers to the koa context
    if(this.query.sort) {
      this.sort = self.storage.buildSort(this.query.sort);
    }
    if(this.query.conditions) {
      this.condtions = self.storage.buildQuery(this);
    }
    this.collection = self.storage.collection.bind(self.storage);
    yield next;
  };
};

MongoStorage.prototype.collection = function(name) {
  return co(function*() {
    var col = yield this.db.collection(name);
    //we use a wrapper to adapat
    yield new Collection(col);
  });
};

MongoStorage.prototype.buildSort = function (sort) {
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

MongoStorage.prototype.buildQuery = function (query) {
  var hasOperator = _.intersection(Object.keys(query), UpdateOperators).length;
  if(!hasOperator) {//we wrap the query hash with `$set`
    return {
      "$set": query
    };
  }
  return query;
};

module.exports = MongoStorage;