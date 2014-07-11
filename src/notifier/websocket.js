var debug = require("debug")("notifier:websocket"),
    ws = require("ws"),
    Buffer = require("buffer").Buffer,
    util = require("util"),
    url = require("url"),
    _ = require("lodash"),
    assert = require("assert"),
    Constants = require("../constants"),
    EE = require("events").EventEmitter;


var WebsocketServer = function() {
  EE.call(this);
  // store the clients
  this.clients = {};
  // channel info
  this.channels = {};
  // wanted endpoint paths
  this.paths = [];
  //to cheat `ws` module
  this.options = {};
};

util.inherits(WebsocketServer, EE);

WebsocketServer.prototype.hook = function(server) {
  // http server
  this._server = server;
  // flag
  server.notifierEnabled = true;
  
  //handle server upgrade
  this._upgrade = this.upgrade.bind(this);
  this._server.on("upgrade", this._upgrade);
  return this;
};

WebsocketServer.prototype.abortConnection = function (socket) {
  try {
    var resp = ["HTTP/1.1 400 Bad Request", "", ""].join("\r\n");
    socket.write(resp);
  } catch(e) {
    debug(e);
  } finally {
    try { socket.destroy(); } catch(e) {}
  }
};

WebsocketServer.prototype.upgrade = function(req, socket, upgradeHead) {
  
  if(!this.shouldHandle(req)) {
    debug("bypass %s", req.url);
    this.abortCollection(socket);
    return;
  }
  
  debug("server upgrade");
  //copy buffer
  var head = new Buffer(upgradeHead.length),
      self = this;

  upgradeHead.copy(head);
  self.handleUpgrade(req, socket, head, function(client) {
    debug("connection ok");
    
    var channel = self._getChannel(req.url);
    self._trackClient(channel, client);
    self.emit("connection", client);
  });
};

WebsocketServer.prototype._trackClient = function (channel, client) {
  debug("track client");
  var list = this.clients[channel.collection];
  if(!list) {
    list = this.clients[channel.collection] = [];
  }
  list.push(client);
  
  client.on("close", function() {
    var idx = list.indexOf(client);
    if(idx > -1) {
      list.splice(idx, 1);
    }
  });
};

WebsocketServer.prototype.shouldHandle = function (req) {
  return this.paths.indexOf(url.parse(req.url).pathname) > -1;
};

WebsocketServer.prototype.handleUpgrade = ws.Server.prototype.handleUpgrade;


WebsocketServer.prototype._pathForChannel = function (subscriber) {
  var p = ["", subscriber.collection, "_subscription"].join("/");
  return subscriber.prefix ? subscriber.prefix + p : p;
};

WebsocketServer.prototype._getChannel = function (pathname) {
  var k, v, s;
  for(k in this.channels) {
    v = this.channels[k];
    s = this._pathForChannel(v);
    if(s === pathname) {
      return v;
    }
  }
};


//TODO: support url prefix
WebsocketServer.prototype.register = function (channel) {
  if(typeof channel === "string") {
    channel = {
      collection: channel
    };
  }
  assert(channel.collection, "should give collection name");
  debug("register %s", channel.collection);
  var path = this._pathForChannel(channel);
  if(this.paths.indexOf(path) === -1) {
    this.paths.push(path);
  }
  channel.events = channel.events || [
    Constants.events.CREATE,
    Constants.events.UPDATE,
    Constants.events.DELETE
  ];
  this.channels[channel.collection] = channel;
  return this;
};

WebsocketServer.prototype.unregister = function(channel) {
  if(typeof channel === "string") {
    channel = {
      collection: channel
    };
  }
  
  var path = this._pathForChannel(channel),
      idx = this.paths.indexOf(path);
  
  //remove endpoint path
  if(idx > -1) {
    this.paths.splice(idx, 1);
  }
  //delete channel
  delete this.channels[channel.collection];
  return this;
};

WebsocketServer.prototype.broadcast = function (data) {
  var clients = this.clients[data.collection],
      channel = this.channels[data.collection],
      self = this;

  if(!channel) {
    debug("channel not registered for type %s, collection", data.type, data.collection);
    return;
  }
  if(!clients) {
    debug("no clients for %s", data.type);
    return;
  }
  
  if(channel.events.indexOf(data.type) > -1) {
    debug("broadcast event '%s' to %d client(s)", data.type, clients.length);
    clients.forEach(function(client) {
      client.send(JSON.stringify(data));
      //signal sent
      self.emit("sent", data);
    });
  } else {
    debug("events %s not exposed by collection %s; won't braodcast", data.type, data.collection);
  }
};


WebsocketServer.prototype.detach = function () {
  this._server.notifierEnabled = false;
  this._server.removeListener("upgrade", this._upgrade);
  this._server = null;
  return this;
};

WebsocketServer.prototype.close = WebsocketServer.prototype.disconnect = function() {
  debug("close");
  //release server events
  this.detach();
  var error;
  try {
    _.each(this.clients, function(clients) {
      debug("close %d clients", clients.length);
      _.each(clients, function(client) {
        client.terminate();
      });
    });
  } catch (e) {
    debug(e);
    throw error;
  }
};

module.exports = WebsocketServer;