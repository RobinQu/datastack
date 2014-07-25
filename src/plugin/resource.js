var Plugin = require("./plugin"),
    debug = require("debug")("plugin:master"),
    util = require("util"),
    // datastack = require("../datastack"),
    compose = require("koa-compose");


var ResourcePlugin = function() {
  Plugin.call(this);
  this.name = "resource";
  this._before = [];
  this._after = [];
};

util.inherits(ResourcePlugin, Plugin);

ResourcePlugin.prototype.expose = function() {
  return this;
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