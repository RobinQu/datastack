var recluster = require("recluster"),
    _  = require("lodash"),
    voka = require("voka"),
    debug = require("debug")("cluster"),
    // ncluster = require("cluster"),
    assert = require("assert");

var proto = {
  /**
   * Send message to other workers in the same cluster as well as workers in other clusters (if any)
   * @param {String|Object} message Message to be sent
   */
  broadcast: function(message, options) {
    options = options || {};
    var i,len, excludes = options.excludes || [], candidates;
    debug("broadcast, exlucded workers: %o", options.excludes);
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

/**
 * StackCluster manages the cluster master and workers:
 *
 * 1. it route messages from outside to its workers
 * 2. it is possible sync internal messages across workers
 *
 * @author robinqu
 * @requires recluster
 */
var StackCluster = function(path, options, callback) {
  assert(path, "should provide file path");
  if(typeof options === "function") {
    callback = options;
    options = {};
  }
  //default options
  options = options || {};
  //manual trigger
  options.readyWhen = "ready";
  //setup default worker num
  // options.workers = require("os").cpus().length;
  //create instance
  var cluster = recluster(path, options);
  //mixin proto
  _.extend(cluster, proto);
  //we like `dispose`
  cluster.dispose = cluster.terminate;
  //SIGUSR2 is used as a signal to reload
  process.on("SIGUSR2", function() {
    console.log("Got SIGUSR2, reloading cluster...");
    cluster.reload();
  });
  
  cluster.on("message", function(worker, msg) {
    debug("message from worker %s, pid %s", worker.id, worker.process.pid);
    if(msg.cmd === "sync" && typeof msg.source !== "undefined") {//sync message to other workers
      cluster.broadcast(msg, {
        excludes: [msg.source]
      });
    }
  });
  
  
  
  var run = cluster.run.bind(run);

  cluster.run = function() {
    if(!cluster.hub) {
      // create a message hub
      cluster.hub = voka.hub({
        redis: options.redis
      }, function(e) {
        if(e) {
          debug(e);
          cluster.terminate();
          console.log("Cluster stopped due to unrecoverable exception happens during boot time");
          return;
        }
        // hook up with sync events
        cluster.hub.subscribe("sync", function(msg) {//sync messages from other clusters
          cluster.broadcast(msg);
        });
        
        run();
      });
    }
  };
  
  return cluster;
};


module.exports = StackCluster;