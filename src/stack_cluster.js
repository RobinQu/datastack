var recluster = require("recluster"),
    _  = require("lodash"),
    voka = require("voka"),
    assert = require("assert");

var proto = {
  broadcast: function(message, options) {
    options = options || {excludes: []};
    var i,len, excludes = options.excludes, candidates;
    candidates = this.workers.filter(function(w) {
      return excludes.indexOf(w.id) > -1;
    });
    //send to workers in the same cluster
    for(i=0,len=candidates.length; i<len; i++) {
      candidates[i].send(message);
    }
    //send to other clusters
    this.hub.publish("sync", message);
  }
};


// `StackCluster` manages the cluster master and workers
// Bonus: 
// 1. it route messages from outside to its workers
// 2. it is possible sync internal messages across workers
var StackCluster = function(path, options) {
  assert(path, "should provide file path");
  options = options || {};
  //manual trigger
  options.readyWhen = "ready";
  //create instance
  var cluster = recluster(path, options);
  //mixin proto
  _.extend(cluster, proto);
  //we like `dispose`
  cluster.dispose = cluster.terminate;
  
  
  process.on("SIGUSR2", function() {
    console.log("Got SIGUSR2, reloading cluster...");
    cluster.reload();
  });
  
  process.on("message", function(msg) {
    if(msg.cmd === "sync" && typeof msg.source !== "undefined") {//sync message to other workers
      cluster.broadcast(msg, {
        exclude: [msg.source]
      });
    }
  });
  
  
  cluster.hub = voka.hub({
    redis: options.redis
  });
  
  cluster.hub.subscribe("sync", function(msg) {//sync messages from other clusters
    cluster.broadcast(msg);
  });
  
  return cluster;
};


module.exports = StackCluster;