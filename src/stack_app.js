var koa = require("koa"),
    http = require("http"),
    https = require("https"),
    util = require("util"),
    debug = require("debug")("app"),
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
  if(options.auth) {//enable the auth plugin
    this.install("auth");
  }
};

util.inherits(StackApp, koa);

StackApp.prototype.listen = function () {
  debug("listen");
  if(this.server) {
    this.server.on("request", this.callback());
  } else {
    this.server = http.createServer(this.callback());
  }
  this.server.listen.apply(this.server, arguments);
  this.server.on("listening", this.signal.bind(this, "listening", this.server));
  if(this.notifier.hook) {
    this.notifier.hook(this.server);
  }
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



module.exports = StackApp;