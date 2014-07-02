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
    
    var app = koa(), srv;

    datastack(app);
    app.use(datastack.resource("book").middleware());
  
    var notifier = datastack.notifier.websocket(app);
    
    var client, messageCallback;
    
    beforeEach(function(done) {
      debug("before each");
      srv = app.listen(PORT, done);
      notifier.attach(srv).register("books");
      client = new Websocket("ws://localhost:8888/books/_subscription");
      messageCallback = sinon.spy();
      client.on("message", messageCallback);
    });
    
    afterEach(function(done) {
      debug("after each");
      notifier.detach(srv);
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
    
  });
  

});