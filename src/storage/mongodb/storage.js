var mongo = require("co-mongo"),
    co = require("co"),
    Collection = require("./collection"),
    _ = require("lodash"),
    uuid = require("node-uuid"),
    util = require("util"),
    crypto = require("crypto"),
    debug = require("debug")("datastack:mongo"),
    defaults = require("./defaults");

var MongoStorage = function(options) {
  this.uri = options.uri;
  defaults.setOptions(["idKey", "refKey", "archiveKey", "timeKey", "objectIdAsKey", "writeConcern", "timestamp"], options, this);
};

var UpdateOperators = ["$set", "$inc", "$mul", "$rename", "$setOnInsert", "$unset", "$min", "$max", "$currentDate"];

MongoStorage.prototype.connect = co(function*() {
  this.db = yield mongo.connect(this.uri);
});

MongoStorage.prototype.disconnect = co(function*() {
  yield this.db.close();
});

MongoStorage.prototype.computeIndexKey = function (indexes) {
  var ret = [], str;
  _.forEach(indexes, function(v, k) {
    ret.push([k, "_", v].join(""));
  });
  str = ret.join("_");
  // debug("index key %s", str);
  return str;
};

MongoStorage.prototype.getPrimaryIndex = function () {
  var indexes = {};
  indexes[this.idKey] = 1;
  indexes[this.refKey] = -1;
  return indexes;
};

MongoStorage.prototype.getIdKeyIndex = function () {
  var indexes = {};
  indexes[this.idKey] = 1;
  return indexes;
};

MongoStorage.prototype.getCtimeIndex = function () {
  var indexes = {};
  indexes[this.timeKey.ctime] = -1;
  return indexes;
};

MongoStorage.prototype.collection = function(name) {
  var self = this;
  return function*() {
    var col, indexes,
        indexReady = false;
    col = yield self.db.collection(name);
    //ensure index
    indexes = self.getPrimaryIndex();
    indexReady = yield col.indexExists(self.computeIndexKey(indexes));
    if(!indexReady) {
      debug("ensure compound primary index %o", indexes);
      yield col.ensureIndex(indexes);
    }
    
    // idKey doesn't need to be unique?!
    // indexes = self.getIdKeyIndex();
    // indexReady = yield col.indexExists(self.computeIndexKey(indexes));
    // if(!indexReady) {
    //   debug("ensure id key index %o", indexes);
    //   yield col.ensureIndex(indexes, {
    //     unique: true,
    //     sparse: true
    //   });
    // }
    indexes = self.getCtimeIndex();
    indexReady = yield col.indexExists(self.computeIndexKey(indexes));
    if(!indexReady) {
      debug("ensure ctime key index", indexes);
      yield col.ensureIndex(indexes);
    }
    //we use a wrapper to adapt
    return new Collection(col);
  };
};

MongoStorage.prototype.buildSort = function (sort) {
  var ctimeSort = [this.timeKey.ctime, -1];
  
  if(!sort) {//return default sort if none is given
    return this.timestamp ? [ctimeSort] : [];
  }
  
  if(typeof sort === "string") {
    // String pattern: a:1,b:-1
    return this.buildSort(sort.split(",").reduce(function(prev, cur) {
      var pair = cur.split(":");
      prev[pair[0].trim()] = parseInt(pair[1].trim(), 10);
      return prev;
    }, {}));
  }
  //Object pattern, {a:1, b:-1}
  //always sort by ctime
  var result = Object.keys(sort).reduce(function(prev, cur) {
    prev.push([cur.trim(), parseInt(sort[cur].trim(), 10)]);
  }, []);
  if(!sort[this.timeKey.ctime]) {
    result.push(ctimeSort);
  }
  return result;
};

MongoStorage.prototype.buildCriteria = function(subject) {
  return subject ? JSON.parse(decodeURIComponent(subject)) : {};
};


MongoStorage.prototype.buildProjection = function(subject) {
  if(subject) {
    subject = JSON.parse(decodeURIComponent(subject));
    subject[this.idKey] = subject[this.refKey] = subject[this.timeKey.ctime] = subject[this.timeKey.mtime] = 1;
    return subject;
  }
  return {};
};

MongoStorage.prototype.buildSimpleQuery = function (id, ref, archived) {
  var query = {};
  
  query[this.idKey] = this.objectIdAsKey ? new mongo.ObjectId(id) : id;

  if(ref) {//if we are query against ref, we don't need to specify `archived`
    query[this.refKey] = parseInt(ref, 10);
  } else {
    query[this.archiveKey] = !!archived;
  }
  return query;
};

MongoStorage.prototype.handleUpdateValue = function (update) {
  var hasOperator = _.intersection(Object.keys(update), UpdateOperators).length;

  if(!hasOperator) {//we wrap the update hash with `$set`
    update =  {
      "$set": update
    };
  }
  if(this.timestamp) {
    update.$set = update.$set || {};
    update.$set[this.timeKey.mtime] = new Date();
  }
  //`id` and `ref` cannot be updated
  delete update.$set[this.refKey];
  delete update.$set[this.idKey];
  
  //increment the version
  update.$inc = {};
  update.$inc[this.refKey] = 1;
  
  return update;
};


MongoStorage.prototype.handleRecordValue = function (value, force, time) {
  var self = this,
      idKey = this.idKey,
      refKey = this.refKey;

  time = time || Date.now();

  var makeRecord = function(data) {
    var ret = data;

    if(force || !ret[idKey]) {
      ret[idKey] = uuid.v4();
    }
    
    //use `1` as initial ref value
    ret[refKey] = 1;
    
    if(self.timestamp) {//handle timestamps
      //we fake time increments
      ret[self.timeKey.mtime] = ret[self.timeKey.ctime] = new Date(time);
    }
    ret[self.archiveKey] = false;
    return ret;
  };
  
  if(util.isArray(value)) {//batch create
    value = value.map(function(v) {
      return self.handleRecordValue(v, true, time++);
    });
  } else {//create a single record
    value = makeRecord(value);
  }
  
  return value;
};

MongoStorage.prototype.etag = function (record) {
  var hash = crypto.createHash("sha1");
  hash.update(record[this.idKey]);
  hash.update(record[this.refKey] + "");
  return hash.digest("hex");
};

MongoStorage.prototype.ref = function (record) {
  return record[this.refKey];
};

module.exports = MongoStorage;