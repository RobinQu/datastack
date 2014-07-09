var Plugin = require("./plugin"),
    debug = require("debug")("plugin:cluster"),
    cluster = require("cluster"),
    util = require("util");

var Cluster = function() {
  Plugin.call(this);
};

util.inherits(Cluster, Plugin);

Cluster.prototype.init = function (app) {
  debug("init as master? %s", cluster.isMaster);
  process.on("message", function(m) {
    debug("receive message from master: %s", m.cmd);
    if(m.cmd === "disconnect") {
      console.warn("Requested to shutdown, process pid %s", process.pid);
      app.dispose();
    } else if(m.cmd === "sync" && m.data && m.data.type && m.data.source !== cluster.worker.id) {//transmit message from other worker
      debug("sync message received");
      app.emit(m.data.type, m.data);
    }
  });
  
  app.on("sync", this.sync.bind(this));
  app.sync = this.sync.bind(this);
};

Cluster.prototype.onListening = function () {
  if(cluster.isWorker) {
    process.send({cmd: "ready"});
  }
};

Cluster.prototype.sync = function (data) {
  if(cluster.isWorker) {
    debug("sync request %s", data);
    process.send({
      cmd: "sync",
      source: cluster.worker.id,
      data: data
    });
  }
  
};

module.exports = Cluster;