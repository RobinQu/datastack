var _ = require("lodash"),
    debug = require("debug")("storage:memory"),
    uuid = require("node-uuid"),
    util = require("util");

// Collection class
// In fact, `Collection` class is optional to impmement, if you feel comfortable to provide all methods for a `collection` in `Storage.prototype.collection`
var Collection = function(name) {
  this.name = name;
  this.data = [];
};

// find record by record id
Collection.prototype.findOne = function (id, ref) {
  var self = this;
  return function*() {
    var query = {id: id};
    if(ref) {
      query._ref = parseInt(ref, 10);
    } else {
      query._archived = false;
    }
    debug("find one by %o", query);
    return _.find(self.data, query);
  };
};


// find by query, and projection
// should return a `Cursor` object
Collection.prototype.find = function (condition, projection) {
  var self = this;
  var cursor = {
    op: []
  };
  debug("condition %o, projection %o", condition, projection);
  cursor.limit = function(limit) {
    this.op.push(function() {
      debug("limit %s", limit);
      return this.slice(0, Math.min(limit, this.length));
    });
    return this;
  };
  cursor.skip = function(skip) {
    this.op.push(function() {
      debug("skip %s", skip);
      return skip ? this.slice(Math.min(skip, this.length)) : this;
    });
    return this;
  };
  cursor.sort = function(sort) {
    this.op.push(function() {
      debug("sort %o", sort);
      return sort.length ? _.sortBy(this, sort) : this;
    });
    return this;
  };
  cursor.toArray = function() {
    return function*() {
      return cursor.op.reduce(function(prev, cur) {
        return cur.call(prev);
      }, self.data);
    };
  };
  
  cursor.op.push(function() {
    debug("filter archive");
    return _.where(this, {_archived: false});
  });
  
  
  if(Object.keys(condition).length) {
    cursor.op.push(function() {
      return _.where(this, condition) || [];
    });
  }
  if(projection.length) {
    cursor.op.push(function() {
      return _.map(this, function(d) {
        return projection.reduce(function(prev, cur) {
          prev[cur] = d[cur];
          return prev;
        }, {});
      });
    });
  }
  

  return function*() {
    return cursor;
  };
};

Collection.prototype.insert = function (record) {
  debug("insert %o", record);
  var self = this;
  return function*() {
    if(util.isArray(record)) {
      var start = self.data.length,
          end;
      record.forEach(function(r) {
        r._archived = false;
        r._ref = 1;
        if(!r.id) {
          r.id = uuid.v4();
        }
      });
      self.data = self.data.concat(record);
      end = self.data.length;
      // console.log(self.data);
      return self.data.slice(start, end);
    } else {
      record._archived = false;
      record._ref = 1;
      if(!record.id) {
        record.id = uuid.v4();
      }
      self.data.push(record);
      return [record];
    }
  };
};

Collection.prototype.removeOne = function (id) {
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
      var newOne = _.extend(_.clone(self.data[idx]), updates);
      newOne._ref ++;
      self.data.push(newOne);
      self.data[idx]._archived = true;
    }
  };
};

Collection.prototype.versions = function(id) {
  var self = this;
  
  return function*() {
    debug("versions %s", id);
    var versions = _.where(self.data, {id: id});
    return _.map(versions, "_ref").sort().reverse();
  };
};

module.exports = Collection;