var mongo = require("co-mongo"),
    _ = require("lodash"),
    debug = require("debug")("mongo:collection"),
    co = require("co");

var CollectionAdapter = function(col, options) {
  this._col = col;
  _.extend(this, options);
};

CollectionAdapter.prototype.find = function(query, projections) {
  return this._col.find(query, projections);
};

CollectionAdapter.prototype.findById = function(id) {
  var query = this._buildIdQuery(id),
      self = this;
  debug("find by id %o", query);
  return self._col.findOne(query);
};

CollectionAdapter.prototype._buildIdQuery = function (id) {
  var query = {};
  query[this.idKey] = this.objectIdAsKey ? new mongo.ObjectId(id) : id;
  return query;
};


//TODO: conditional PUT, which supports `If-Match` and `If-None-Match`
CollectionAdapter.prototype.updateById = function (id, updates) {
  var self = this, query = this._buildIdQuery(id);
  return co(function*() {
    yield self._col.update(query, updates, {
      upsert: false,
      multi: false,
      writeConcern: self.writeConcerns
    });
  });
};

CollectionAdapter.prototype.removeById = function (id) {
  var self = this, query = this._buildIdQuery(id);
  return co(function*() {
    yield self._col.remove(query, {
      justOne: true,
      writeConcern: self.writeConcern
    });
  });
};

CollectionAdapter.prototype.insert = function (record) {
  return this._col.insert(record);
};

module.exports = CollectionAdapter;