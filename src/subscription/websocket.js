var ws = require("ws"),
    Buffer = require("buffer").Buffer,
    util = require("util"),
    debug = require("debug")("datastack:subscription:ws"),
    EventEmitter = require("events").EventEmitter;

module.exports = function(app, srv, options) {
  
  var RouteHandler = function(server, path) {
    var self = this;
    
    server.on("upgrade", function(req, socket, upgradeHead) {
      debug("server upgrade");
      //copy buffer
      var head = new Buffer(upgradeHead.length);
      upgradeHead.copy(head);
      
      self.handleUpgrade(req, socket, head, function(client) {
        debug("connection ok");
        self.emit("connection", client);
      });
    });
    
    this._server = server;
    this._closeServer = function() { self._server.close(); };
    
    this.options = {
      path: path,
      clientTracking: true
    };
    this.clients = [];
    this.path = path;
    
  };
  
  util.inherits(RouteHandler, EventEmitter);
  
  RouteHandler.prototype.handleUpgrade = ws.Server.prototype.handleUpgrade;
  
  RouteHandler.prototype.close = function() {
    var error;
    try {
      for (var i = 0, l = this.clients.length; i < l; ++i) {
        this.clients[i].terminate();
      }
    } catch (e) {
      error = e;
    }
    
    // close the http server if it was internally created
    try {
      if (typeof this._closeServer !== "undefined") {
        this._closeServer();
      }
    } finally {
      delete this._server;
    }
    
    if(error) {
      throw error;
    }
  };
  
  RouteHandler.prototype.broadcast = function (data) {
    debug("broadcast %o", data);
    for(var i in this.clients) {
      this.clients[i].send(data);
    }
  };
  
  var h = new RouteHandler(srv, options.path);
  
  app.on("datastack:create", function(data) {
    data.type = "datastack:create";
    h.broadcast(JSON.stringify(data));
  });

  return h;
};