var Plugin = require("./plugin"),
    debug = require("debug")("plugin:storage"),
    Constants = require("../constants"),
    util = require("util");


var NotifierPlugin = function(options) {
  Plugin.call();
  options = options || {type:"websocket"};
  this.name = "notifier";
  
  try {
    this.notifier = typeof options.notify === "function" ? options : (function() {
      var Notifier = require("../notifier/" + options.type);
      return new Notifier(options);
    }());
  } catch(e) {
    throw new Error("Unsupported notifier type " + options.type);
  }
  
};

util.inherits(NotifierPlugin, Plugin);

NotifierPlugin.prototype.init = function (app) {
  debug("init");
  
  app.context.notifier = this.notifier;
  
  //bind all events
  var events = [Constants.events.CREATE, Constants.events.UPDATE, Constants.events.DELETE],
      i, len;
  for(i=0,len=events.length; i<len; i++) {
    app.on(events[i], this.notify.bind(this, events[i]));
  }
  return this;
};

NotifierPlugin.prototype.notify = function(type, data) {
  debug("notify");
  data.type = type;
  this.notifier.broadcast(data);
};

NotifierPlugin.prototype.dispose = function () {
  if(this.notifier.disconnect) {
    this.notifier.disconnect();
  }
};

module.exports = NotifierPlugin;