//a simple wrapper that produces a datastack-powered koa app
var datastack = module.exports = function(app, options) {

  require("./pluggable")(app);
  options = options || {};
  var plugins = require("./plugin");
  var master = new plugins.Master();
  var storage = new plugins.Storage(options.storage);
  var notifier = new plugins.Notifier(options.notifier);
  
  app.plugin(master);
  app.plugin(storage);
  app.plugin(notifier);
  
  return app;
};

require("pkginfo")(module, "version");

datastack.resource = require("./stack_resource");

datastack.notifier = require("./notifier");

datastack.app = require("./stack_app");

datastack.Constants = require("./constants");