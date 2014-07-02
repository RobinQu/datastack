var debug = require("debug")("datastack:notifier:server"),
    ws = require("ws"),
    Buffer = require("buffer").Buffer,
    util = require("util"),
    url = require("url"),
    _ = require("lodash"),
    assert = require("assert"),
    Constants = require("../../constants"),
    EventEmitter = require("events").EventEmitter;


var InternalServer = function(server) {
  // store the clients
  this.clients = {};
  // channel info
  this.channels = {};
  // wanted endpoint paths
  this.paths = [];
  // http server
  this._server = server;
  
  //handle server upgrade
  this._upgrade = this.upgrade.bind(this);
  server.on("upgrade", this._upgrade);
  
  
  //to cheat `ws` module
  this.options = {};
};

util.inherits(InternalServer, EventEmitter);

InternalServer.prototype.abortConnection = function (socket) {
  try {
    var resp = ["HTTP/1.1 400 Bad Request", "", ""].join("\r\n");
    socket.write(resp);
  } catch(e) {
    debug(e);
  } finally {
    try { socket.destroy(); } catch(e) {}
  }
};

InternalServer.prototype.upgrade = function(req, socket, upgradeHead) {
  
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

InternalServer.prototype._trackClient = function (channel, client) {
  var list = this.clients[channel.collection];
  if(!list) {
    list = this.clients[channel.collection] = [];
  }
  list.push(client);
  
  client.on("close", function() {
    console.log();
    var idx = list.indexOf(client);
    if(idx > -1) {
      list.splice(idx, 1);
    }
  });
  
};

InternalServer.prototype.shouldHandle = function (req) {
  return this.paths.indexOf(url.parse(req.url).pathname) > -1;
};

InternalServer.prototype.handleUpgrade = ws.Server.prototype.handleUpgrade;


InternalServer.prototype._pathForChannel = function (subscriber) {
  var p = ["", subscriber.collection, "_subscription"].join("/");
  return subscriber.prefix ? subscriber.prefix + p : p;
};

InternalServer.prototype._getChannel = function (pathname) {
  var k, v, s;
  for(k in this.channels) {
    v = this.channels[k];
    s = this._pathForChannel(v);
    if(s === pathname) {
      return v;
    }
  }
};

InternalServer.prototype.register = function (channel) {
  if(typeof channel === "string") {
    channel = {
      collection: channel,
      events: [
        Constants.events.CREATE,
        Constants.events.UPDATE,
        Constants.events.DELETE
      ]
    };
  }
  
  assert(channel.collection, "should give collection name");
  var path = this._pathForChannel(channel);
  if(this.paths.indexOf(path) === -1) {
    this.paths.push(path);
  }
  this.channels[channel.collection] = channel;
  return this;
};

InternalServer.prototype.unregister = function(channel) {
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

InternalServer.prototype.broadcast = function (data) {
  var clients = this.clients[data.collection],
      channel = this.channels[data.collection];
  
  if(channel.events.indexOf(data.type) > -1) {
    debug("broadcast event '%s' to %d client(s)", data.type, clients.length);
    clients.forEach(function(client) {
      client.send(JSON.stringify(data));
    });
  } else {
    debug("events %s not exposed by collection %s; won't braodcast", data.type, data.collection);
  }
};

InternalServer.prototype.close = function() {
  debug("close");
  this._server.removeListener("upgrade", this._upgrade);
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

module.exports = InternalServer;