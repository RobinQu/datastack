/*global describe, it */

var expect = require("chai").expect,
    datastack = require("../"),
    path = require("path"),
    // sinon = require("sinon"),
    _ = require("lodash"),
    cluster = require("cluster");

describe("Cluster", function() {
  this.timeout(1000 * 10);
  
  
  it("should support run in cluster mode", function(done) {
    
    var c = datastack.cluster(path.join(__dirname, "./lib/app.js"), {
      workers: 2
    });
    
    var count = 0;
    cluster.on("online", function() {
      count++;
      if(count === 2) {
        c.terminate();
        setTimeout(done, 100);
      }
    });
    c.run();
    
  });
  
  describe("SYNC", function() {
    it("should message inside cluster", function(done) {
      
      var c = datastack.cluster(path.join(__dirname, "./lib/app.js"), {
        workers: 2
      });
      
      var messages = {};
      c.on("message", function(worker, msg) {
        if(msg.cmd === "sync") {
          messages[msg.source] = messages[msg.source] || 0;
          messages[msg.source]++;
          // console.log(messages[msg.source]);
        }
      });
      
      setTimeout(function() {
        expect(_.values(messages)).to.deep.equal([2, 2]);
        c.terminate();
        setTimeout(done, 100);
      }, 3000);
      
      c.run();
    });
    
  });
  
});