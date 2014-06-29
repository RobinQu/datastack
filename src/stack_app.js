var koa = require("koa-app"),
    util = require("util"),
    router = require("koa-router");

var StackApp = function() {
  koa.apply(this, arguments);
};

util.inherits(StackApp, koa);

exports = StackApp;