/*global describe, it, after, before */
var datastack = require(".."),
    PORT = process.env.PORT || 8888,
    request = require("superagent"),
    koa = require("koa"),
    bcrypt = require("bcrypt-nodejs"),
    co = require("co"),
    UUID = require("node-uuid"),
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
  
  describe("user/password auth", function () {
    
    var app = koa(), server, uri;
    datastack(app, {
      storage: {
        type: "mongodb",
        uri: "mongodb://127.0.0.1:27017/datastack-test"
      }
    });
    uri = "http://localhost:" + PORT + "/books";
    
    before(function (done) {
      co(function*() {
        //using mongo to remove all users
        var mongo = require("co-mongo");
        var db = yield mongo.connect("mongodb://127.0.0.1:27017/datastack-test");
        var col = yield db.collection("_users");
        yield col.remove();
        
        
        //using storage plugin to insert a user
        var user = {
          password: bcrypt.hashSync("123456"),
          name: "robin",
          _archived: false
        };
        yield col.insert(user);
      })(function (e) {
        if(e) {
          console.log(e.stack);
        }
        server = app.listen(PORT, done);
      });
    });
    
    after(function (done) {
      server.close(done);
    });
    
    app.use(datastack.resource({name: "books", auth: true}).middleware());
    
    it("should block all requests without basic auth", function (done) {
      request.get(uri, function (res) {
        expect(res.status).to.equal(401);
        expect(res.body.status).to.equal("error");
        done();
      });
    });
    
    it("should allow requets with valid basic auth info", function (done) {
      request.get(uri).auth("robin", "123456").end(function (res) {
        expect(res.status).to.equal(200);
        done();
      });
    });
    
    
  });
  
  describe("access token auth", function () {
    
    var app = koa(), server, uri, token, token2;
    datastack(app, {
      storage: {
        type: "mongodb",
        uri: "mongodb://127.0.0.1:27017/datastack-test"
      }
    });
    uri = "http://localhost:" + PORT + "/books";
    app.use(datastack.resource({name: "books", auth: true}).middleware());
    token = UUID.v4();
    token2 = UUID.v4();
    before(function (done) {
      co(function*() {
        //using mongo to remove all users
        var mongo = require("co-mongo");
        var db = yield mongo.connect("mongodb://127.0.0.1:27017/datastack-test");
        var col = yield db.collection("_accessTokens");
        yield col.remove();
        yield col.insert({
          _storeKey: token,
          scopes: "*",
          _archived: false
        });
        
        yield col.insert({
          _storeKey: token2,
          scopes: ["books:index"],
          _archived: false
        });
        
        console.log(yield col.find().toArray());
      })(function () {
        server = app.listen(PORT, done);
      });
    });
    
    after(function (done) {
      server.close(done);
    });
    
    it("should allow requests with correct token in header, matching '*' scopes", function (done) {
      
      request.get(uri).auth(token, "x-oauth-basic").end(function (res) {
        expect(res.status).to.equal(200);
        done();
      });
      
    });
    
    it("should allow requests with correct token in header, matching specfic scopes", function (done) {
      request.get(uri).auth(token2, "x-oauth-basic").end(function (res) {
        expect(res.status).to.equal(200);
        done();
      });
    });
    
    it("should reject requests without correct token", function (done) {
      
      request.get(uri).end(function (res) {
        expect(res.status).to.equal(401);
        expect(res.body.status).to.equal("error");
        done();
      });
      
    });
    
  });
  
});