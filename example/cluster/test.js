var Websocket = require("ws"),
    request = require("superagent"),
    count = 6;

var clients = [], client, onMessage;

onMessage = function(client, message) {
  console.log(message);
};

while(count--) {
  client = new Websocket("ws://localhost:8888/books/_subscription");
  client.on("message", onMessage.bind(null, client));
  clients.push(client);
  client._id = count;
}

request.put("http://localhost:8888/books/1").send({
  title: "hello world"
}).end(function(res) {
  console.log("complete", res.status);
  console.log(res.text);
});