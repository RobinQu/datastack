var Datastack = function(app, options) {
  if(!(this instanceof Datastack)) {
    return new Datastack(app, options);
  }
  if(app.context.datastack) {
    console.log("Cannot hook this koa app more than once");
    return app.context.datastack;
  }
  app.context.datastack = new Datastack(options);
  try {
    //TODO: support more `Storage` instance
    this.storage = (function() {
      var solution = require("./storage/" + options.storage.type);
      return new solution.Storage(options.storage);
    }());
  } catch(e) {
    throw new Error("Unsupported storage type " + options.type);
  }
  // auto connect
  this.storage.connect();
  this.hook(app);
};

Datastack.prototype.hook = function(app) {
  var self = this;
  app.use(function*(next) {
    if(this.query.sort) {
      this.sort = self.storage.buildSort(this.query.sort);
    }
    if(this.query.conditions) {
      this.condtions = self.storage.buildQuery(this);
    }
    this.collection = self.storage.collection.bind(self.storage);
    yield next;
  });
};

Datastack.prototype.teardown = function () {
  this.storage.disconnect();
};

var datastack = module.exports = Datastack;

datastack.resource = require("./stack_resource");

datastack.app = require("./stack_app");



