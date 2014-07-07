var recluster = require("recluster"),
    _  = require("lodash"),
    // voka = require("voka"),
    assert = require("assert");

var proto = {
  broadcast: function(message, options) {
    options = options || {excludes: []};
    var i,len, excludes = options.excludes, candidates;
    
    candidates = this.workers.filter(function(w) {
      return excludes.indexOf(w.id) > -1;
    });
    
    for(i=0,len=candidates.length; i<len; i++) {
      candidates[i].send(message);
    }
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
  var cluster = recluster(path, options);
  _.extend(cluster, proto);
  
  process.on("SIGUSR2", function() {
    console.log("Got SIGUSR2, reloading cluster...");
    cluster.reload();
  });
  
  process.on("message", function(msg) {
    if(msg.cmd === "sync" && typeof msg.source !== "undefined") {//sync message to all other
      cluster.broadcast(msg, {
        exclude: [msg.source]
      });
    }
  });
  
  //we like `dispose`
  cluster.dispose = cluster.terminate;
  
  return cluster;
};


module.exports = StackCluster;