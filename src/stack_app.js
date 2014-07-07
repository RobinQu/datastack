var koa = require("koa"),
    http = require("http"),
    util = require("util"),
    stackable = require("./stackable");

var StackApp = function(server, options) {
  options = options || {};
  koa.call(this);
  stackable(this, options);
  this.server = server;
  this.exposePlugins();
  this.server.on("close", this.dispose.bind(this));
};

util.inherits(StackApp, koa);

StackApp.prototype.exposePlugins = function () {
  var self = this;
  //expose the important instance to `StackApp` as well
  Object.defineProperty(this, "notifier", {
    get: function() {
      return self.plugin("notifier").notifier;
    },
    enumerable: true,
    configrable: false
  });
};

StackApp.prototype.listen = function () {
  if(!this.server) {
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

exports = StackApp;