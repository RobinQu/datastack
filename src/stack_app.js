var koa = require("koa"),
    util = require("util");

var StackApp = function(server, options) {
  koa.call(this);
  
  this.server = server;
  this.plugins = [];
};

util.inherits(StackApp, koa);

StackApp.prototype.plugin = function (plugin) {
  this.plugins.push(plugin);
  plugin.signal("init", this);
};

StackApp.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
  this.server.on("listening", this.notify.bind(this, "listening", this));
};

StackApp.prototype.notify = function (signal, data) {
  var i,len;
  for(i=0,len=this.plugins.length; i<len; i++) {
    this.plugins[i].signal(signal, data);
  }
};


exports = StackApp;