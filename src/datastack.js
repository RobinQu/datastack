//a simple wrapper that produces a datastack-powered koa app
var datastack = module.exports = require("./stackable");

require("pkginfo")(module, "version");

datastack.resource = require("./stack_resource");

datastack.notifier = require("./notifier");

datastack.app = require("./stack_app");

datastack.Constants = require("./constants");