/*global describe, it */

var datastack = require(".."),
    PORT = process.env.PORT || 8888,
    request = require("superagent"),
    expect = require("chai").expect,
    koa = require("koa"),
    sinon = require("sinon"),
    Websocket = require("ws");


describe("WSS", function() {
  
  
  it("should work", function(done) {
    var app = koa(), srv;
  
    datastack(app);
    app.use(datastack.resource("book").middleware());
  
    srv = app.listen(PORT);
  
    //TODO: more graceful API
    
    var notifier = datastack.notifier.websocket(app);
    notifier.attach(srv, {
      collections: {
        "books": {
          // prefix: "",
          // events: [datastack.events.CREATE],
        }
      }
    });
    
    //client code
    var client = new Websocket("ws://localhost:8888/books/_subscription");
    // client.on("open", function() {
    //   console.log("client ok");
    //
    // });
    var messageCallback = sinon.spy();
    client.on("message", messageCallback);
    
    request.put("http://localhost:8888/books/bigtitle").send({
      title: "hello, world"
    }).end(function(res) {
      expect(res.status).to.equal(201);
      expect(messageCallback.callCount).to.to.equal(1);
      done();
    });
    
  });
  
  
  
  
});