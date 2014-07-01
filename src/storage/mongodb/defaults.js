var util = require("util"),
    _ = require("lodash");

var defaults = {
  
  //primary key name
  idKey: "_storeKey",
  
  //if we should use ObjectId to construct primary key
  objectIdAsKey: false,
  
  //use default write concern
  writeConcern: null,
  
  //use timestamp or not
  timestamp: true,
  
  //ref key
  refKey: "_ref",
  
  //archived key
  archiveKey: "_archived",
  
  
  //timestmap keys
  timeKey: {
    ctime: "_ctime",
    mtime: "_mtime"
  }
  
  
};

module.exports = {
  
  setOptions: function(keys, overrides, target) {
    keys = util.isArray(keys) ? keys : [keys];
  
    _.each(keys, function(k) {
      target[k] = overrides[k] === undefined ? defaults[k] : overrides[k];
    });
  
  }
};