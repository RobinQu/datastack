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
  
  it("should work with simple hash", function(done) {
    
    srv = app.listen(PORT);
    var uri = "http://localhost:8888/books/hello";
    request.put(uri).send({//create
      title: "hello world",
      author: "unknown"
    }).end(function(res) {
      expect(res.status).to.equal(201);
      request.get(uri, function(res) {//get
        expect(res.body.author).to.equal("unknown");
        request.put(uri).send({author: "james"}).end(function(res) {//update
          expect(res.status).to.equal(200);
          expect(store.books.data[0].author).to.equal("james");
          request.del(uri).end(function(res) {//delete
            expect(res.status).to.equal(204);
            expect(store.books.data.length).to.equal(0);
            srv.close(done);
          });
        });
      });
    });
  });
  
  it("should find by query", function() {});
  
});