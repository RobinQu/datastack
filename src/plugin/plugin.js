var EE = require("events").EventEmitter,
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
    this.emit(signal, data);
    break;
  }
};

Plugin.prototype.init = function() {
  console.log("not implemented");
};

module.exports = Plugin;