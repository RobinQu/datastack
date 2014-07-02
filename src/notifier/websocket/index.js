var Constants = require("../../constants"),
    Server = require("./server");

var WSNotifier = function(app) {
  if(!(this instanceof WSNotifier)) {
    return new WSNotifier(app);
  }
  //bind all events
  var events = [Constants.events.CREATE, Constants.events.UPDATE, Constants.events.DELETE],
      i, len;
  for(i=0,len=events.length; i<len; i++) {
    app.on(events[i], this.handleEvent.bind(this, events[i]));
  }
  this.servers = [];
};

WSNotifier.prototype.attach = function (httpServer) {
  if(httpServer._wsInstance) {
    throw new Error("cannot bind multiple websocket notifier on one http server");
  }
  var instance = new Server(httpServer);
  httpServer._wsInstance = instance;
  this.servers.push(instance);
  return this;
};

WSNotifier.prototype.detach = function (httpServer) {
  var instance = httpServer._wsInstance;
  if(instance) {
    try {
      instance.close();
    } catch(e) {
      throw e;
    } finally {
      this.servers.splice(this.servers.indexOf(instance), 1);
    }
  }
  return this;
};

WSNotifier.prototype.configure = function (httpServer) {
  return httpServer._wsInstance;
};

WSNotifier.prototype.handleEvent = function(type, data) {
  this.servers.forEach(function(server) {
    data.type = type;
    server.broadcast(data);
  });
};

module.exports = WSNotifier;