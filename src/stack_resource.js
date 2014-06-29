var Router = require("koa-router"),
    middlewares = require("./middlewares");

module.exports = function() {
  
  var router = new Router();
  
  router.get("/:collection", middlewares.pagination(), middlewares.query(), function*() {
    var collection = yield this.collection(this.params.collection);

    this.body =  yield collection.find(this.conditions, this.projection)
              .skip(this.pagination.skip)
              .limit(this.paginaiton.limit)
              .sort(this.sort);
    
  });
  
  router.get("/:collection/:id", function*() {
    var collection = yield this.collection(this.params.collection);
    var doc = yield collection.findById(this.params.id);
    this.body = doc;
  });
  
  router.post("/:collection", function*() {
    var collection = yield this.collection(this.params.collection);
    yield collection.insert(this.req.body);
    this.status = 201;
  });
  
  router.del("/:collection/:id", function*() {
    var collection = yield this.collection(this.params.collection);
    yield collection.removeById(this.parmas.id);
    this.status = 204;
  });
  
  router.put("/:collection/:id", function*() {
    var collection = yield this.collection(this.params.collection);
    yield collection.updateById(this.params.id, this.req.body);
    this.status = 200;
  });
  
};