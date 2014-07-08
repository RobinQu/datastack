var datastack = require("../..");

var app = datastack.app({
  storage: {
    type: "mongodb",
    uri: "mongodb://127.0.0.1:27017/datastack-test"
  }
});

app.resource("book");

app.resource("author");

app.listen(8888);