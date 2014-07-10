var datastack = require("../.."),
    argv = require("optimist").argv,
    path = require("path");

var cluster = datastack.cluster(path.join(__dirname, "./app"), {
  workers: 2,
  args: process.argv.slice(2)
});

cluster.on("error", function(e) {
  console.log(e);
});


if(require.main === module) {
  console.log("running cluster %s", argv.name);
  cluster.run();
}

module.exports = cluster;