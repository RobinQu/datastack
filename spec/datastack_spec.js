/*global describe, it */

var koa = require("koa"),
    datastack = require(".."),
    request = require("superagent"),
    expect = require("chai").expect,
    PORT = process.env.PORT || 8888;

describe("datastack api", function() {
  
  it("should work out of box", function(done) {
    var app = koa(), uri, server;
    uri = "http://localhost:8888/books";
    datastack(app, {
      storage: {type: "memory"}
    });
    app.resource("books");
    server = app.listen(PORT, function() {
      request.get(uri).end(function(res) {
        expect(res.status).to.be.ok;
        server.close(done);
      });
    });
    
  });
  
});