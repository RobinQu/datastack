var Plugin = require("./plugin"),
    debug = require("debug")("plugin:master"),
    util = require("util"),
    mount = require("koa-mount"),
    // datastack = require("../datastack"),
    handler = require("node-proxy-defaults"),
    compose = require("koa-compose");


var ResourcePlugin = function() {
  Plugin.call(this);
  this.name = "resource";
  this._before = [];
  this._after = [];
};

util.inherits(ResourcePlugin, Plugin);


ResourcePlugin.prototype.expose = function() {
  var self = this, ResGen;
  ResGen = function(options) {
    var resource = require("../resource")(options);
    if(options.prefix) {
      this.use(mount(options.prefix, resource.middleware()));
    } else {
      this.use(resource.middleware());
    }
    //tell everyone we created a resource
    self.emit("create", resource);
    return resource;
  };
  var proxy = Proxy.createFunction(handler(this), ResGen, ResGen);
  return proxy;
};

ResourcePlugin.prototype.before = function(middleware) {
  this._before.push(middleware);
};

ResourcePlugin.prototype.after = function(middleware) {
  this._after.push(middleware);
};

ResourcePlugin.prototype.middleware = function(type, collection, action) {
  debug("export %s advice", type);
  var mws = this["_" + type], convert;
  convert = function(mw) {
    return mw(collection, action);
  };
  return compose(mws.map(convert));
};

module.exports = ResourcePlugin;