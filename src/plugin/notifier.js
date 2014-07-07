var Plugin = require("./plugin"),
    debug = require("debug")("plugin:storage"),
    Constants = require("../constants"),
    cluster = require("cluster"),
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
  this.notifier.on("sent", function(data) {
    //proxy every sent message to other app
    app.emit("sync", data);
  });
  return this;
};

NotifierPlugin.prototype.notify = function(type, data) {
  debug("notify");
  if(cluster.isWorker && data._source && cluster.worker.id === data._source) {//in worker mode and message originates form itself
    debug("Reject to send messages (%s) that are synced from myself! %s", type, cluster.worker.id);
    return;
  }
  data.type = type;
  //send to internal clients
  this.notifier.broadcast(data);
};

NotifierPlugin.prototype.dispose = function () {
  if(this.notifier.disconnect) {
    this.notifier.disconnect();
  }
};

module.exports = NotifierPlugin;