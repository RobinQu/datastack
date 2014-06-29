var util = require("util"),
    _ = require("lodash");

var defaults = {
  
  //primary key name
  idKey: "_id",
  
  //if we should use ObjectId to construct primary key
  objectIdAsKey: true,
  
  //use default write concern
  writeConcern: null,
  
  //use timestamp or not
  timestamp: true
};

module.exports = {
  
  setOptions: function(keys, overrides, target) {
    keys = util.isArray(keys) ? keys : [keys];
  
    _.each(keys, function(k) {
      target[k] = overrides[k] === undefined ? defaults[k] : overrides[k];
    });
  
  }
};