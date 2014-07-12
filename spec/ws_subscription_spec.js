/*global describe, it, beforeEach, afterEach */

var datastack = require(".."),
    PORT = process.env.PORT || 8888,
    request = require("superagent"),
    expect = require("chai").expect,
    koa = require("koa"),
    sinon = require("sinon"),
    debug = require("debug")("spec:wss"),
    Websocket = require("ws");


describe("Websocket", function() {
  
  describe("event subscription", function() {
    
    var app = koa(), srv, notifier;

    datastack(app, {
      storage: {type:"memory"}
    });
    app.use(datastack.resource("books").middleware());
    
    var client, messageCallback;
    
    beforeEach(function(done) {
      debug("before each");
      notifier = app.plugin("notifier").notifier;
      srv = app.listen(PORT, done);
      notifier.hook(srv).register("books");
      client = new Websocket("ws://localhost:8888/books/_subscription");
      messageCallback = sinon.spy();
      client.on("message", messageCallback);
    });
    
    afterEach(function(done) {
      debug("after each");
      notifier.close();
      srv.close(done);
    });
    
    
    it("should recieve create event after PUT creation", function(done) {
      // var client, messageCallback;
      // client = new Websocket("ws://localhost:8888/books/_subscription");
      // messageCallback = sinon.spy();
      // client.on("message", messageCallback);

      request.put("http://localhost:8888/books/bigtitle").send({
        title: "hello, world"
      }).end(function(res) {
        var message = JSON.parse(messageCallback.firstCall.args[0]);
        expect(res.status).to.equal(201);
        expect(messageCallback.callCount).to.to.equal(1);
        expect(message.type).to.equal(datastack.Constants.events.CREATE);
        expect(message.data).to.deep.equal(["bigtitle"]);
        // client.terminate();
        done();
      });
    });
    
    it("should recieve create event after POST creation", function(done) {
      // var client, messageCallback;
      // client = new Websocket("ws://localhost:8888/books/_subscription");
      // messageCallback = sinon.spy();
      // client.on("message", messageCallback);
      
      request.post("http://localhost:8888/books").send([
        {title:"hello world"},
        {title: "nice day"}
      ]).end(function(e) {
        expect(e.status).to.equal(201);
        var message = JSON.parse(messageCallback.firstCall.args[0]);
        expect(message.type).to.equal(datastack.Constants.events.CREATE);
        expect(message.data.length).to.deep.equal(2);
        // client.terminate();
        done();
      });
    });
    
    it("should recieve update event after PUT", function(done) {
      var uri = "http://localhost:8888/books/1";
      
      // var client, messageCallback;
      // client = new Websocket("ws://localhost:8888/books/_subscription");
      // messageCallback = sinon.spy();
      // client.on("message", messageCallback);
      
      request.put(uri).send({//create
        title: "hello world"
      }).end(function(res) {
        expect(res.status).to.equal(201);
        var message = JSON.parse(messageCallback.firstCall.args[0]);
        expect(message.type).to.equal("datastack:create");
        request.put(uri).set("if-match", res.headers.etag).send({//update
          title: "nice world"
        }).end(function(res) {
          expect(messageCallback.callCount).to.equal(2);
          var message = JSON.parse(messageCallback.secondCall.args[0]);
          expect(res.status).to.equal(200);
          expect(message.data.from).to.equal(1);
          expect(message.data.to).to.equal(2);
          // client.terminate();
          done();
        });
        
      });
    });
    
    it("should recieve delete after DEL", function(done) {
      var uri = "http://localhost:8888/books/2";
      request.put(uri).send({//create
        title: "hello world"
      }).end(function(res) {
        expect(res.status).to.equal(201);
        var message = JSON.parse(messageCallback.firstCall.args[0]);
        expect(message.type).to.equal("datastack:create");
        request.put(uri).set("if-match", res.headers.etag).send({//update
          title: "nice world"
        }).end(function() {
          
          request.del(uri+"/_refs/1", function(res) {//delete ref
            expect(res.status).to.equal(204);
            var message = JSON.parse(messageCallback.getCall(2).args[0]);
            expect(message.type).to.equal("datastack:delete");
            expect(message.data.ref).to.equal("1");
            request.del(uri, function() {
              var message = JSON.parse(messageCallback.getCall(3).args[0]);
              expect(message.type).to.equal("datastack:delete");
              expect(message.data.ref).to.equal("*");
              done();
            });
          });
        });
        
      });
    });
    
    
    it("should support event filter", function(done) {
      notifier.register({
        collection: "books",
        events: [datastack.Constants.events.CREATE]
      });
    
      var uri = "http://localhost:8888/books/2";
      request.put(uri).send({//create
        title: "hello world"
      }).end(function(res) {
        var message = JSON.parse(messageCallback.firstCall.args[0]);
        expect(message.type).to.equal("datastack:create");
        request.put(uri).set("if-match", res.headers.etag).send({//update
          title: "nice world"
        }).end(function() {
          expect(messageCallback.callCount).to.equal(1);
          done();
        });
      });
    });
    
  });
  
  
  describe("server lifecycle", function() {
    
    var app = koa(), srv, notifier;

    datastack(app,{
      storage: {type:"memory"}
    });
    app.use(datastack.resource("books").middleware());
    
    it("should stop publish after closed", function(done) {
      
      srv = app.listen(PORT, done);
      notifier = app.plugin("notifier").notifier;
      notifier.hook(srv);
      notifier.register("books");
      var client = new Websocket("ws://localhost:8888/books/_subscription");
      var messageCallback = sinon.spy();
      client.on("message", messageCallback);
      
      var uri = "http://localhost:8888/books/3";
      request.put(uri).send({//create
        title: "hello world"
      }).end(function(res) {
        var message = JSON.parse(messageCallback.firstCall.args[0]);
        expect(message.type).to.equal("datastack:create");
        
        //stop listening
        notifier.close();
        
        request.put(uri).set("if-match", res.headers.etag).send({//update
          title: "nice world"
        }).end(function() {
          expect(messageCallback.callCount).to.equal(1);
          done();
        });
        
      });
      
      
    });
    
  });

});