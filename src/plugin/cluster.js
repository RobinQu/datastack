var Plugin = require("./plugin"),
    debug = require("debug")("plugin:cluster"),
    cluster = require("cluster"),
    util = require("util");

var Cluster = function() {
  Plugin.call(this);
};

util.inherits(Cluster, Plugin);

Cluster.prototype.init = function (app) {
  debug("init");
  process.on("message", function(m) {
    if(m.cmd === "disconnect") {
      console.warn("Requested to shutdown, process pid %s", process.pid);
      app.dispose();
    } else if(m.cmd === "sync" && m.data && m.data.type) {//transmit message from other worker
      app.emit(m.data.type, m.data);
    }
  });
  
  app.on("sync", this.sync.bind(this));
};

Cluster.prototype.onListening = function () {
  if(cluster.isWorker) {
    process.end({cmd: "ready"});
  }
};

Cluster.prototype.sync = function (data) {
  data._source = cluster.worker.id;
  process.send({
    cmd: "sync",
    source: cluster.worker.id,
    data: data
  });
};

module.exports = Cluster;