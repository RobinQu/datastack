var EE = require("events").EventEmitter,
    _ = require("lodash"),
    util = require("util");

var Plugin = function() {
  EE.call(this);
};

util.inherits(Plugin, EE);

Plugin.prototype.signal = function (signal, data) {
  switch(signal) {
  case "init":
    this.init(data);
    break;
  case "dispose":
    this.dispose();
    break;
  default:
    var methodName = "on" + _.capitalize(signal);
    if(this[methodName]) {
      this[methodName](data);
    }
    this.emit(signal, data);
  }
};

Plugin.prototype.init = function() {
  //TO BE IMPLEMENTED
};

Plugin.prototype.dispose = function () {
  //TO BE IMPLEMENTED
};

module.exports = Plugin;