/*global describe, it, before */

var expect = require("chai").expect,
    datastack = require("../"),
    // co = require("co"),
    // sinon = require("sinon"),
    request = require("superagent"),
    PORT = process.env.PORT || 8888;


require("deep-eql");


var Collection = function(name) {
  var self = this;
  this.name = name;
  this.data = [];
  this.cursor = {};
  this.find = this.cursor.sort = this.cursor.limit  = this.cursor.skip = function() {
    // console.log("return cursor");
    self.data.push(Array.prototype.slice.call(arguments, 0));
    return self.cursor;
  };
  
  this.findById = this.removeById = this.updateById = this.cursor.toArray = function() {
    // console.log("return generator func");
    self.data.push(Array.prototype.slice.call(arguments, 0));
    return function*() {
      return self.data;
    };
  };
};


describe("router", function() {
  
  it("should create with resource name and used as middleware alone", function(done) {
    
    var resource = new datastack.resource("book");
    var app = require("koa")();
    app.use(function*() {
      this.body = this.req.url;
    });
    //the datastack middleware
    app.use(resource.middleware());
    var srv = app.listen(PORT);
    
    request.get("http://localhost:8888/books", function(res) {
      expect(res.status).to.equal(200);
      expect(res.text).to.equal("/books");
      srv.close(done);
    });
    
    
  });
  
  describe("Route GET /:collections", function() {
    
    var resource = new datastack.resource("book");
    var app = require("koa")(),
        collection, srv;
    //intercept incoming requests
    app.use(function*(next) {
      //mimick `storage`
      this.storage = {};
      this.storage.buildSort = function() {
        return [["ctime", -1]];
      };
      
      //mimick `collection`
      this.collection = function*(name) {
        collection = new Collection(name);
        return collection;
      };
      yield next;
    });
    app.on("error", function(e) {
      console.error(e.stack);
    });
    //the datastack middleware
    app.use(resource.middleware());
    
    before(function(done) {
      var start = app.listen.bind(app, PORT, done);
      if(app.listening) {
        srv.close(start);
      } else {
        srv = start(function() {
          app.listening = true;
          done();
        });
      }
    });
    
    
    it("should have default pagination, query, sort", function(done) {
      
      request.get("http://localhost:8888/books", function(res) {
        // console.log(res.text, res.status);
        var args = res.body;
        expect(args).to.be.ok;
        //criteria, projection
        expect(args[0]).to.deep.equal([{}, {}]);
        //skip
        expect(args[1][0]).to.equal(0);
        //limit
        expect(args[2][0]).to.equal(20);
        //sort
        expect(args[3][0][0]).to.deep.equal(["ctime", -1]);
        done();
      });
      
    });
    
    
  });
  
});