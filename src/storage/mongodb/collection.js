var debug = require("debug")("mongo:collection"),
    _ = require("lodash"),
    co = require("co");

var CollectionAdapter = function(col) {
  this._col = col;
};

CollectionAdapter.prototype.find = function(query, projections) {
  var self = this;
  return function*() {
    query[this.storage.archiveKey] = false;
    return self._col.find(query, projections);
  };
};

CollectionAdapter.prototype.findById = function(id, ref) {
  var self = this;
  return function*() {
    var query = this.storage.buildSimpleQuery(id, ref);
    debug("find one by %o", query);
    return yield self._col.findById(query);
  };
};

CollectionAdapter.prototype.findOne = function(query, projections) {
  query[this.storage.archivedKey] = false;
  return this._col.findOne(query, projections);
};


CollectionAdapter.prototype.updateById = function (id, update) {
  var self = this;
  
  return co(function*() {
    var query = this.storage.buildSimpleQuery(id);
    update = this.storage.handleUpdateValue(update);
    debug("update by id %s, %o", id, update);
    
    //update the record
    var original = yield self._col.findAndModify(query, [[this.storage.timeKey.ctime, -1]], update, {
      upsert: false
    });
    if(original.length) {
      original = original[0];
      delete original._id;
      //archived the original
      original[this.storage.archiveKey] = true;
      // console.log(original);
      yield self._col.insert(original);
    }
  });
};

CollectionAdapter.prototype.removeOne = function (id, ref) {
  var self = this;
  
  return function*() {
    var query = this.storage.buildSimpleQuery(id, ref);
    debug("remove by query %o", query);
    //delete all archived as well
    delete query[this.storage.archiveKey];
    yield self._col.remove(query, {
      single: false
    });
  };
};

CollectionAdapter.prototype.insert = function (data) {
  var self = this;
  return function*() {
    debug("insert");
    return yield self._col.insert(this.storage.handleRecordValue(data));
  };
};

CollectionAdapter.prototype.versions = function (id) {
  var self = this;
  
  return function*() {
    debug("versions");
    var query = {}, projection = {}, sort = [[this.storage.timeKey.mtime, -1]];
    query[this.storage.idKey] = id;
    projection[this.storage.refKey] = 1;
    var records = yield self._col.find(query, projection).sort(sort).toArray();
    return _.map(records, this.storage.refKey);
  };
};

module.exports = CollectionAdapter;