var _ = require("lodash"),
    debug = require("debug")("storage:memory");

// Collection class
// In fact, `Collection` class is optional to impmement, if you feel comfortable to provide all methods for a `collection` in `Storage.prototype.collection`
var Collection = function(name) {
  this.name = name;
  this.data = [];
};

// find record by record id
Collection.prototype.findById = function (id) {
  var self = this;
  return function*() {
    return _.find(self.data, {id: id});
  };
};


// find by query, and projection
// should return a `Cursor` object
Collection.prototype.find = function (condition, projection) {
  var self = this;
  var cursor = {
    op: []
  };
  cursor.limit = function(limit) {
    this.op.push(function() {
      return this.slice(0, limit);
    });
    return this;
  };
  cursor.skip = function(skip) {
    this.op.push(function() {
      return this.slice(skip, 0);
    });
  };
  cursor.sort = function(sort) {
    this.op.push(function() {
      return _.sort(this, sort);
    });
  };
  cursor.toArray = function() {
    return function*() {
      return cursor.op.reduce(function(prev, cur) {
        return cur.call(prev);
      }, self.data);
    };
  };
  if(condition) {
    cursor.op.push(function() {
      return _.find(this, condition);
    });
  }
  if(projection) {
    cursor.op.push(function() {
      return _.select(this, projection);
    });
  }
  
  return cursor;
};

Collection.prototype.insert = function (record) {
  debug("insert %o", record);
  var self = this;
  return function*() {
    self.data.push(record);
  };
};

Collection.prototype.removeById = function (id) {
  var self = this;
  return function*() {
    debug("delete by id %s", id);
    _.remove(self.data, {id: id});
  };
};

Collection.prototype.updateById = function (id, updates) {
  var self = this;
  return function*() {
    debug("update by id %s, %o", id, updates);
    var idx = _.findIndex(self.data, {id:id});
    if(idx > -1) {
      self.data[idx] = _.extend(self.data[idx], updates);
    }
  };
};

module.exports = Collection;