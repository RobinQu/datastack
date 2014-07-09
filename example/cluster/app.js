var datastack = require("../..");
var argv = require("optimist").argv;
var _ = require("lodash");


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

app.listen(8888, function() {
  switch(argv.action) {
  case "sync1":
    var t = parseInt(argv.times, 10);
    _.times(t, function() {
      app.sync(require("cluster").worker.id);
    });
    break;
  }
  
});


