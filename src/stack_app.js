var koa = require("koa"),
    http = require("http"),
    util = require("util"),
    pluggable = require("./pluggable");

var StackApp = function(server) {
  koa.call(this);
  pluggable(this);
  this.server = server;
};

util.inherits(StackApp, koa);

StackApp.prototype.listen = function () {
  if(!this.server) {
    this.server = http.createServer(this.callback());
  }
  this.server.listen.apply(this.server, arguments);
  this.server.on("listening", this.signal.bind(this, "listening", this.server));
};

exports = StackApp;