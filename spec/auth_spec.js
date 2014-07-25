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
    var app = koa(), keystone = {}, uri, server;
    
    uri = "http://localhost:" + PORT + "/books";
    keystone.auth = function () {
      return function *() {
        if(this.method.toUpperCase() === "GET") {
          this.body = "ok";
        } else {
          this.status = 401;
        }
      };
    };
    datastack(app, {
      storage: {type: "memory"}
    });
    app.install("auth", {keystone:keystone});
    app.use(datastack.resource({name: "books"}).middleware());
    
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
    app.install("auth");
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
    
    app.use(datastack.resource({name: "books"}).middleware());
    
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
    app.install("auth");
    uri = "http://localhost:" + PORT + "/books";
    app.use(datastack.resource({name: "books"}).middleware());
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
  
  describe("Grant middleware", function() {
    
    var app = koa(), server, uri, store = {};
    datastack(app, {
      storage: {type: "memory", store: store }
    });
    app.install("auth");
    
    before(function(done) {
      server = app.listen(PORT, done);
    });
    after(function(done) {
      server.close(done);
    });
    
    uri = "http://localhost:" + PORT + "/_grant";
    
    it("should create a user/pass grant", function(done) {
      request.post(uri).send({
        type: "user",
        name: "robin",
        password: "123456"
      }).end(function(res) {
        expect(res.status).to.equal(201);
        expect(store._users.data.length).to.equal(1);
        expect(store._users.data[0].name).to.equal("robin");
        expect(bcrypt.compareSync("123456", store._users.data[0].password)).to.be.ok;
        done();
      });
    });
    
    it("should create a token grant", function(done) {
      request.post(uri).send({
        type: "token",
        scopes: "*"
      }).end(function(res) {
        expect(res.status).to.equal(201);
        expect(res.body.token).to.be.ok;
        expect(res.body.scopes).to.equal("*");
        expect(store._accessTokens.data.length).to.equal(1);
        expect(store._accessTokens.data[0].id).to.equal(res.body.token);
        expect(store._accessTokens.data[0].scopes).to.equal("*");
        done();
      });
    });
    
  });
  
});