var datastack = require("../.."),
    argv = require("optimist").argv;


process.on("uncaughtException", function(e) {
  console.log(e.stack);
});

var app = datastack.app({
  storage: {
    type: "mongodb",
    uri: "mongodb://127.0.0.1:27017/datastack-test"
  }
});

app.resource("book");

app.resource("author");

var port = argv.port || 8888;

app.listen(port, function() {
  console.log("server is up and running at %s in cluste %s", port, argv.name);
});


