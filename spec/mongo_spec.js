/*global describe, it, before, after, beforeEach */

var datastack = require(".."),
    request = require("superagent"),
    koa = require("koa"),
    co = require("co"),
    debug = require("debug")("spec:mongo"),
    expect = require("chai").expect;


describe("Mongo storage", function() {
  
  
  var app = koa(),
      PORT = process.PORT || 8888,
      srv;
    
  
  datastack(app, {
    storage: {
      type: "mongodb",
      uri: "mongodb://127.0.0.1:27017/datastack-test"
    }
  });
  app.use(datastack.resource("books").middleware());
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
  app.on("error", function(e) {
    console.log(e && e.stack);
  });
    
  before(function(done) {
    debug("before");
    setTimeout(function() {
      co(function*() {
        var col = yield app.context.storage.collection("books");
        debug("remove all docs of book collection");
        yield col._col.remove();
      })(function(e) {
        if(e) {
          console.log(e && e.stack);
        }
        srv = app.listen(PORT, done);
      });
    }, 100);


  });
  after(function(done) {
    srv.close(done);
  });
  
  
  describe("create", function() {
    
    it("should create a record", function(done) {
      request.put("http://localhost:8888/books/bigtitle1").send({
        title: "JavaScript 101",
        author: "RobinQu"
      }).set("if-none-match", "*").end(function(res) {
        expect(res.status).to.equal(201);
        request.get("http://localhost:8888/books/bigtitle1", function(res) {
          expect(res.status).to.equal(200);
          expect(res.body.author).to.equal("RobinQu");
          expect(res.body._ctime).to.ok;
          done();
        });
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
  
  
  describe("index", function() {
    
    beforeEach(co(function*() {
      //clean all records
      var col = yield app.context.storage.collection("books");
      debug("remove all docs of book collection");
      yield col._col.remove();
    }));
    
    it("should find by query and projection", function(done) {
      request.post("http://localhost:8888/books")
      .send([{a:1, b:2}, {a:2, c:3}, {a:2, b:2}]).end(function(res) {
        expect(res.status).to.equal(201);
        request.get("http://localhost:8888/books").query({
          criteria: encodeURIComponent(JSON.stringify({a:1})),
          projection: encodeURIComponent(JSON.stringify({a:1}))
        }).end(function(res) {
          // console.log(res.body);
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(1);
          expect(res.body[0].a).to.equal(1);
          //`b` should be undefiend
          expect(res.body[0].b).not.to.be.ok;
          // other meta key should be avaiable even if projection is requested
          expect(res.body[0]._ref).to.be.ok;
          done();
        });
      });
    });
    
    
    it("should work with pagination", function(done) {
      request.post("http://localhost:8888/books")
      .send([{a:1, b:2}, {a:2, c:3}, {a:2, b:2}]).end(function(res) {
        expect(res.status).to.equal(201);
        request.get("http://localhost:8888/books").query({
          skip: 2,
          limit: 1
        }).end(function(res) {
          expect(res.status).to.equal(200);
          //get {a:1,b:2}, as DESC ctime is default sorter
          expect(res.body[0].a).to.equal(1);
          expect(res.body[0].b).to.equal(2);
          done();
        });
      });
    });
    
    
    
  });
  
  describe("update", function() {
    
    it("should update the created record", function(done) {
      
      var uri = "http://localhost:8888/books/bigtitle2";
      request.put(uri).send({
        title: "hello world",
        author: "unknown"
      }).end(function(res) {
        expect(res.status).to.equal(201);
        var ref = res.headers.etag;
        request.put(uri)
        .set("if-match", ref)
        .send({author: "james", date: new Date()})
        .end(function(res) {
          expect(res.status).to.equal(200);
          request.get(uri, function(res) {
            var book = res.body;
            expect(book._ref).to.equal(2);
            expect(res.status).to.equal(200);
            expect(book.author).to.equal("james");
            expect(book.date).to.be.ok;
            done();
          });
        });
      });
    });
    
  });
  
  describe("delete", function() {
    
    it("should delete an existing record", function(done) {
      request.post("http://localhost:8888/books").send({
        title: "Big world",
        author: "unknown"
      }).end(function(res) {
        var uri = "http://localhost:8888/books/" + res.body._storeKey;
        expect(res.status).to.equal(201);
        request.get(uri, function(res) {
          expect(res.status).to.equal(200);
          expect(res.body.author).to.equal("unknown");
          request.del(uri, function(res) {
            expect(res.status).to.equal(204);
            request.get(uri, function(res) {
              expect(res.status).to.equal(404);
              done();
            });
          });
        });
      });
    });
    
  });
  
  describe("versions", function() {
    it("should list all versions in DESC order", function(done) {
      var uri = "http://localhost:8888/books/bigtitle3";
      request.put(uri).send({title: "bigtitle", price: 10}).end(function(res) {
        expect(res.headers["x-datastack-ref"]).to.equal("1");
        request.put(uri).send({price:11}).set("if-match", res.headers.etag).end(function(res) {
          expect(res.headers["x-datastack-ref"]).to.equal("2");
          request.put(uri).send({price:12}).set("if-match", res.headers.etag).end(function(res) {
            expect(res.headers["x-datastack-ref"]).to.equal("3");
            
            request.get(uri + "/_refs", function(res) {
              expect(res.body).to.deep.equal([3,2,1]);
              done();
            });
          });
        });
      });
    });
    
    it("should get a single version", function(done) {
      var uri = "http://localhost:8888/books/bigtitle4";
      request.put(uri).send({title: "bigtitle", price: 10}).end(function(res) {
        expect(res.headers["x-datastack-ref"]).to.equal("1");
        request.put(uri).send({price:11}).set("if-match", res.headers.etag).end(function(res) {
          expect(res.headers["x-datastack-ref"]).to.equal("2");
          
          request.get(uri + "/_refs/1", function(res) {
            expect(res.body.price).to.equal(10);
            done();
          });
          
        });
      });
    });
    
    it("should delete a single record", function(done) {
      var uri = "http://localhost:8888/books/bigtitle5";
      request.put(uri).send({title: "bigtitle4", price: 10}).end(function(res) {
        expect(res.headers["x-datastack-ref"]).to.equal("1");
        request.put(uri).send({price:11}).set("if-match", res.headers.etag).end(function(res) {
          expect(res.headers["x-datastack-ref"]).to.equal("2");
          
          request.del(uri + "/_refs/1", function(res) {
            expect(res.status).to.equal(204);
            request.get(uri + "/_refs/1", function(res) {
              expect(res.status).to.equal(404);
              request.get(uri + "/_refs/2", function(res) {
                expect(res.status).to.equal(200);
                done();
              });
            });
          });
          
        });
      });
    });
    
  });
  
  
});