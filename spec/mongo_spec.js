/*global describe, it, before, after */

var datastack = require(".."),
    request = require("superagent"),
    koa = require("koa"),
    co = require("co"),
    debug = require("debug")("spec:mongo"),
    expect = require("chai").expect;


describe("Mongo solution", function() {
  
  
  var app = koa(),
      PORT = process.PORT || 8888,
      srv;
    
  
  datastack(app, {
    storage: {
      type: "mongodb",
      uri: "mongodb://127.0.0.1:27017/datastack-test"
    }
  });
  app.use(datastack.resource("book").middleware());
  // before(function(done) {
  //   var start = app.listen.bind(app, PORT, done);
  //   if(app.listening) {
  //     srv.close(start);
  //   } else {
  //     srv = start(function() {
  //       app.listening = true;
  //       done();
  //     });
  //   }
  // });
    
  before(function(done) {
    debug("before");
    setTimeout(function() {
      co(function*() {
        var col = yield app.context.storage.collection("books");
        debug("remove all docs of book collection");
        yield col._col.remove();
      })(function(e) {
        console.log(e && e.stack);
        srv = app.listen(PORT, done);
      });
    }, 100);


  });
  after(function(done) {
    srv.close(done);
  });
  
  
  describe("Record creation", function() {
    
    it("should create a record", function(done) {
      request.put("http://localhost:8888/books/bigtitle1").send({
        title: "JavaScript 101",
        author: "RobinQu"
      }).end(function(res) {
        expect(res.status).to.equal(201);
        done();
      });
    });
    
    it("should get the record", function(done) {
      request.get("http://localhost:8888/books/bigtitle1", function(res) {
        expect(res.status).to.equal(200);
        expect(res.body.author).to.equal("RobinQu");
        done();
      });
    });
    
    it("should create with POST", function(done) {
      request.post("http://localhost:8888/books").send({
        title: "nice day",
        author: "RobinQu"
      }).end(function(res) {
        expect(res.status).to.equal(201);
        var location = res.headers.location;
        request.get("http://localhost:8888" + location, function(res) {
          expect(res.body.author).to.equal("RobinQu");
          done();
        });
        
      });
    });
    
  });
  
  
});