var Plugin = require("./plugin"),
    debug = require("debug")("plugin:master"),
    util = require("util"),
    datastack = require("../datastack");

var MasterPlugin = function(options) {
  Plugin.call(this);
  options = options || {};
  this.bodyparser = options.bodyparser;
  this.qs = options.ps;
  this.name = "master";
};

util.inherits(MasterPlugin, Plugin);

MasterPlugin.prototype.init = function(app) {
  debug("init");
  
  if(this.bodyparser !== false) {
    app.use(this.bodyparser || require("koa-bodyparser")());
  }
  if(this.qs !== false) {
    if(this.qs) {
      app.use(this.qs);
    } else {
      require("koa-qs")(app);
    }
  }
  
  app.use(function *(next) {
    //report version and vendor
    this.set("x-powered-by", "datastack");
    this.set("x-datastack-version", datastack.version);
    
    yield next;
  });
  
  return this;
  
};

module.exports = MasterPlugin;