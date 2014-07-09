//a simple wrapper that produces a datastack-powered koa app
var datastack = module.exports = require("./stackable");

require("pkginfo")(module, "version");

datastack.Constants = require("./constants");

datastack.resource = require("./stack_resource");

datastack.app = require("./stack_app");

datastack.cluster = require("./stack_cluster");
