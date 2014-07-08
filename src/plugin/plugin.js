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
    var methodName = "on" + signal[0].toUpperCase() + signal.slice(1);
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