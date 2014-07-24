/*global describe, it, after */
var datastack = require(".."),
    PORT = process.env.PORT || 8888,
    request = require("superagent"),
    koa = require("koa"),
    expect = require("chai").expect;

describe("auth plugin", function () {
  
  describe("custom authenticate logic", function () {
    var app = koa(), auth, uri, server;
    
    
    uri = "http://localhost:" + PORT + "/books";
    auth = function () {
      return function *() {
        if(this.method.toUpperCase() === "GET") {
          this.body = "ok";
        } else {
          this.status = 401;
        }
      };
    };
    
    datastack(app, {
      storage: {type: "memory"},
      authenticator: {auth:auth}
    });
    app.use(datastack.resource({auth: true, name: "books"}).middleware());
    
    server = app.listen(PORT);
    
    after(function (done) {
      server.close(done);
    });
    
    
    
    it("should allow all GET requests", function (done) {
      request.get(uri, function (res) {
        expect(res.status).to.equal(200);
        done();
      });
    });
    
    it("should block all requests other than GETs", function (done) {
      request.post(uri, function (res) {
        expect(res.status).to.equal(401);
        done();
      });
    });
    
  });
  
});