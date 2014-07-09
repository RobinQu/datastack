var cluster = require("cluster");


if (cluster.isMaster) {
  var worker = cluster.fork();
  worker.send('hi there');
  worker.on("message", function(message) {
    console.log(message);
    setTimeout(function() {
      worker.send(message);
    }, 1000);
  });

} else if (cluster.isWorker) {
  process.on('message', function(msg) {
    console.log(msg);
    process.send(msg);
  });
}