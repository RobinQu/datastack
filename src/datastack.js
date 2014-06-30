var debug = require("debug")("datastack");

var Datastack = function(app, options) {
  if(!(this instanceof Datastack)) {
    return new Datastack(app, options);
  }
  
  if(app.context.datastack) {
    console.log("Cannot hook this koa app more than once");
    return app.context.datastack;
  }
  
  //TODO: use memory storage as fallback
  options = options || {};
  
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
  debug("hook");
  app.context.datastack = this;
  app.context.storage = this.storage;
  app.use(require("koa-bodyparser")());
  app.use(function* datastack(next) {
    //report version and vendor
    this.set("x-powered-by", "datastack");
    this.set("x-datastack-version", Datastack.version);
    yield next;
  });
  
  app.use(function* storage(next) {
    // `this` refers to the koa context
    if(this.query.sort) {
      this.sort = this.storage.buildSort(this.query.sort);
    }
    if(this.query.criteria) {
      this.condtions = this.storage.buildQuery(this.query.criteria);
    }
    this.collection = this.storage.collection.bind(this.storage);
    yield next;
    
  });
};

Datastack.prototype.teardown = function () {
  this.storage.disconnect();
};

var datastack = module.exports = Datastack;

require("pkginfo")(module, "version");

datastack.resource = require("./stack_resource");

datastack.app = require("./stack_app");