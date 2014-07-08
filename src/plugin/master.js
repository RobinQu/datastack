var Plugin = require("./plugin"),
    debug = require("debug")("plugin:master"),
    util = require("util"),
    datastack = require("../datastack"),
    Constants = datastack.Constants;

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
    if(!this.accepts("json", "urlencoded", "text", "multipart")) {
      this.stauts = 422;
      this.body = {
        message: "should have correct content-type",
        status: "error",
        code: Constants.errors.MISSING_REQUEST_CONTENT_TYPE
      };
      return;
    }
    
    //report version and vendor
    this.set("x-powered-by", "datastack");
    this.set("x-datastack-version", datastack.version);
    
    yield next;
  });
  
  return this;
  
};

module.exports = MasterPlugin;