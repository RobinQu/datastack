/*global describe, it */

var datastack = require(".."),
    testkit = require("testkit"),
    expect = require("chai").expect,
    request = require("superagent"),
    koa = require("koa");

describe("Encryption", function() {
  
  var app = koa(),
      server;
  datastack(app, {
    storage: {type: "memory"}
  });
  app.use(datastack.resource("books").middleware());
  server = testkit.web.createHttpServer(true, app.callback());
  
  
  it("should support https", function(done) {
    server.listen(8888, function() {
      request.put("https://localhost:8888/books/1").send({
        title: "nice world"
      }).end(function(res) {
        expect(res.status).to.equal(201);
        server.close(done);
      });
    });
  });
  
});