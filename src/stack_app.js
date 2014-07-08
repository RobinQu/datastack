var koa = require("koa"),
    http = require("http"),
    https = require("https"),
    util = require("util"),
    debug = require("debug")("app"),
    mount = require("koa-mount"),
    stackable = require("./stackable");

var StackApp = function(server, options) {
  if(!(this instanceof StackApp)) {
    return new StackApp(server, options);
  }
  if(server instanceof http.Server || server instanceof https.Server) {
    debug("not server instance given");
  } else {
    options = server;
    server = null;
  }
  options = options || {};
  koa.call(this);
  stackable(this, options);
  this.server = server;
};

util.inherits(StackApp, koa);

StackApp.prototype.listen = function () {
  if(this.server) {
    this.server.on("request", this.callback());
  } else {
    this.server = http.createServer(this.callback());
  }
  this.server.listen.apply(this.server, arguments);
  this.server.on("listening", this.signal.bind(this, "listening", this.server));
  return this.server;
};

StackApp.prototype.dispose = function () {
  //dispose all plugins
  this.uninstall();
  //close down server
  try {
    this.server.close();
  } catch(e) {}
};

StackApp.prototype.resource = function (name, options) {
  options = options || {};
  var resource = require("./stack_resource")(name, options);
  if(options.prefix) {
    this.use(mount(options.prefix, resource.middleware()));
  } else {
    this.use(resource.middleware());
  }
  return resource;
};

module.exports = StackApp;