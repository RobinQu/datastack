var Router = require("koa-router"),
    middlewares = require("./middlewares"),
    lingo = require("lingo");

module.exports = function createResource(name, options) {
  
  options = options || {};
  
  var router = new Router();
  
  var debug = require("debug")("resource:" + name);
  
  var pluralizedName = lingo.en.pluralize(name);
  
  // make up some regex like:
  // /^\/([^\/]+)\/?$/
  var pattern1 = new RegExp(["^\\/(", pluralizedName, ")\\/?$"].join(""));
  // /^\/([^\/]+)\/([^\/])+(\/?)$/
  var pattern2 = new RegExp(["^\\/(", pluralizedName, ")\\/([^\\/]+)\\/?$"].join(""));
  
  router.get(pattern1, middlewares.pagination(options.pagination), middlewares.query(), function*() {
    debug("index");
    
    var collection = yield this.collection(this.params[0]);
    this.body =  yield collection.find(this.criteria, this.projection)
              .skip(this.pagination.skip)
              .limit(this.pagination.limit)
              .sort(this.sort)
              .toArray();
  });
  
  router.get(pattern2, function*() {
    debug("show");
    
    var collection = yield this.collection(this.params[0]);
    var doc = yield collection.findById(this.params[1]);
    this.body = doc;
  });
  
  router.post(pattern1, function*() {
    debug("create");
    var collection = yield this.collection(this.params[0]);
    yield collection.insert(this.req.body);
    this.status = 201;
  });
  
  router.del(pattern2, function*() {
    debug("delete");
    var collection = yield this.collection(this.params[0]);
    yield collection.removeById(this.parmas[1]);
    this.status = 204;
  });
  
  router.put(pattern2, function*() {
    debug("update");
    var collection = yield this.collection(this.params[0]);
    yield collection.updateById(this.params[1], this.req.body);
    this.status = 200;
  });
  
  
  return router;
};