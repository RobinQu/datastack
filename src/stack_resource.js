var Router = require("koa-router"),
    middlewares = require("./middlewares"),
    lingo = require("lingo");

module.exports = function createRouter(name) {
  
  var router = new Router();
  
  var pluralizedName = lingo.en.pluralize(name);
  
  // make up some regex like:
  // /^\/([^\/]+)\/?$/
  var pattern1 = new RegExp(["\/(", pluralizedName, ")\/?&"].join(""));
  // /^\/([^\/]+)\/([^\/])+(\/?)$/
  var pattern2 = new RegExp(["\/(", pluralizedName, ")\/([^\/]+)\/?$"].join(""));
  
  router.get(pattern1, middlewares.pagination(), middlewares.query(), function*() {
    var collection = yield this.collection(this.params[0]);

    this.body =  yield collection.find(this.conditions, this.projection)
              .skip(this.pagination.skip)
              .limit(this.paginaiton.limit)
              .sort(this.sort);
  });
  
  router.get(pattern2, function*() {
    var collection = yield this.collection(this.params[0]);
    var doc = yield collection.findById(this.params[1]);
    this.body = doc;
  });
  
  router.post(pattern1, function*() {
    var collection = yield this.collection(this.params[0]);
    yield collection.insert(this.req.body);
    this.status = 201;
  });
  
  router.del(pattern2, function*() {
    var collection = yield this.collection(this.params[0]);
    yield collection.removeById(this.parmas[1]);
    this.status = 204;
  });
  
  router.put(pattern2, function*() {
    var collection = yield this.collection(this.params[0]);
    yield collection.updateById(this.params[1], this.req.body);
    this.status = 200;
  });
  
};