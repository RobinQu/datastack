//a simple wrapper that produces a datastack-powered koa app
var datastack = module.exports = function(app, options) {
  options = options || {
    storage: {type: "memory"}
  };
  var plugins = require("./plugin");
  var master = new plugins.Master();
  var storage = new plugins.Storage(options.storage);
  master.init(app);
  storage.init(app);
  return app;
};

require("pkginfo")(module, "version");

datastack.resource = require("./stack_resource");

datastack.notifier = require("./notifier");

datastack.app = require("./stack_app");

datastack.Constants = require("./constants");