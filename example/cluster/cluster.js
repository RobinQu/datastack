var datastack = require("../.."),
    path = require("path");

var cluster = datastack.cluster(path.join(__dirname, "./app"), {
  workers: 2,
  args: [
    "--action", "sync1",
    "--times",  2
  ]
});

cluster.on("error", function(e) {
  console.log(e);
});


if(require.main === module) {
  cluster.run();
}


module.exports = cluster;