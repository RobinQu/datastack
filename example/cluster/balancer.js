var balancer = require("xbalancer")({
  targets: ["http://localhost:8881", "http://localhost:8882"],
  port: 8888
});

balancer.start(function() {
  console.log("balancer is up and running");
});