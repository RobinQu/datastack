var datastack = require("../..");
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
  _.times(2, function() {
    app.sync(Date.now());
  });
});


