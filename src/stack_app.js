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
  this.server.on("listening", this.notify.bind(this, "listening", this.server));
};

StackApp.prototype.notify = function (signal, data) {
  var i,len;
  for(i=0,len=this.plugins.length; i<len; i++) {
    this.plugins[i].signal(signal, data);
  }
};

exports = StackApp;