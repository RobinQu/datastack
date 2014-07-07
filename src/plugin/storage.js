var Plugin = require("./plugin"),
    debug = require("debug")("plugin:storage"),
    util = require("util");
    
var StoragePlugin = function(options) {
  Plugin.call();
  options = options || {type: "memory"};
  this.name = "storage";
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
  
  app.use(function*(next) {
    this.collection = this.storage.collection.bind(this.storage);
    yield next;
  });
  
  return this;
};

StoragePlugin.prototype.dispose = function () {
  this.storage.disconnect();
};

module.exports = StoragePlugin;