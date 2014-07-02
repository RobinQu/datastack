/*global describe, it */

var koa = require("koa"),
    expect = require("chai").expect,
    request = require("superagent"),
    datastack = require("..");

describe("Memory store", function() {
  
  var app = koa(),
      PORT = process.env.PORT || 8888,
      store = {},
      srv;
  
  datastack(app, {
    storage: {
      type: "memory",
      store: store
    }
  });
  app.use(datastack.resource("book").middleware());
  
  xit("should work with simple hash", function(done) {
    
    srv = app.listen(PORT);
    var uri = "http://localhost:8888/books/hello";
    request.put(uri).send({//create
      title: "hello world",
      author: "unknown"
    }).end(function(res) {
      var etag = res.headers.etag;
      expect(res.status).to.equal(201);
      request.get(uri, function(res) {//get
        expect(res.body.author).to.equal("unknown");
        request.put(uri).send({author: "james"}).set("if-match", etag).end(function(res) {//update
          expect(res.status).to.equal(200);
          request.get(uri, function(res) {
            var book = res.body;
            expect(book.author).to.equal("james");
            
            request.del(uri).end(function(res) {//delete
              expect(res.status).to.equal(204);
              expect(store.books.data.length).to.equal(0);
              srv.close(done);
            });
            
          });
          
        });
      });
    });
  });
  
  xit("should find by query and projection", function(done) {
    srv = app.listen(PORT);
    request.post("http://localhost:8888/books")
    .send([{a:1, b:2}, {a:2, c:3}, {a:2, b:2}]).end(function(res) {
      expect(res.status).to.equal(201);
      expect(store.books.data.length).to.equal(3);
      request.get("http://localhost:8888/books").query({
        criteria: encodeURIComponent(JSON.stringify({a:1})),
        projection: ["a"]
      }).end(function(res) {
        expect(res.status).to.equal(200);
        expect(res.body.length).to.equal(1);
        expect(res.body[0].a).to.equal(1);
        //`b` should be undefiend
        expect(res.body[0].b).not.to.be.ok;
        srv.close(done);
      });
    });
  });

  xit("should work with pagination", function(done) {
    srv = app.listen(PORT);
    request.post("http://localhost:8888/books")
    .send([{a:1, b:2}, {a:2, c:3}, {a:2, b:2}]).end(function(res) {
      expect(res.status).to.equal(201);
      request.get("http://localhost:8888/books").query({
        skip: 5,
        limit: 1
      }).end(function(res) {
        expect(res.status).to.equal(200);
        expect(res.body[0].a).to.equal(2);
        expect(res.body[0].b).to.equal(2);
        srv.close(done);
      });
    });
  });
  
  it("should support multiple version", function(done) {
    srv = app.listen(PORT);
    var uri = "http://localhost:8888/books/bigtitle3";
    request.put(uri).send({title: "bigtitle", price: 10}).end(function(res) {
      expect(res.headers["x-datastack-ref"]).to.equal("1");
      request.put(uri).send({price:11}).set("if-match", res.headers.etag).end(function(res) {
        expect(res.headers["x-datastack-ref"]).to.equal("2");
        request.put(uri).send({price:12}).set("if-match", res.headers.etag).end(function(res) {
          expect(res.headers["x-datastack-ref"]).to.equal("3");
          
          request.get(uri + "/_refs", function(res) {//list all refs
            expect(res.body).to.deep.equal([3,2,1]);
            
            request.get(uri + "/_refs/1", function(res) {//get a single version
              expect(res.body.price).to.equal(10);
              
              request.del(uri + "/_refs/1", function(res) {
                expect(res.status).to.equal(204);
                request.get(uri + "/_refs/1", function(res) {
                  expect(res.status).to.equal(404);
                  srv.close(done);
                });
                
              });
              
            });
          });
        });
      });
    });
    
  });
  
});