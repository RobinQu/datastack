var Plugin = require("./plugin"),
    debug = require("debug")("plugin:storage"),
    assert = require("assert"),
    util = require("util");
    
var StoragePlugin = function(options) {
  Plugin.call();
  assert(options, "should provide options");
  try {
    this.storage = typeof options.connect === "function" ? options : (function() {
      var solution = require("../storage/" + options.type);
      return new solution.Storage(options);
    }());
  } catch(e) {
    throw new Error("Unsupported storage type " + options.type);
  }
  
};

util.inherits(StoragePlugin, Plugin);

StoragePlugin.prototype.init = function (app) {
  debug("init");
  
  this.storage.connect();
  
  //ref to the storage
  app.context.storage = this.storage;
  
  //write `ETag` and `x-datastack-ref` to response
  app.context.identify = function(record) {
    this.set("ETag", this.storage.etag(record));
    this.set("x-datastack-ref", this.storage.ref(record));
  };
  
  app.use(function*() {
    this.collection = this.storage.collection.bind(this.storage);
  });
  
};

StoragePlugin.prototype.dispose = function () {
  this.storage.disconnect();
};

module.exports = StoragePlugin;