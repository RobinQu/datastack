var Router = require("koa-router"),
    middlewares = require("./middlewares"),
    lingo = require("lingo"),
    util = require("util"),
    uuid = require("node-uuid"),
    Constants = require("./constants");


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
    if(!doc) {
      this.status = 404;
    } else {
      this.body = doc;
    }
  });
  
  router.post(pattern1, function*() {
    debug("create");
    var data, collection, idKey = this.storage.idKey;
    collection = yield this.collection(this.params[0]);
    data = this.request.body;
    if(util.isArray(data)) {//batch create
      data.forEach(function(d) {
        if(!d[idKey]) {
          d[idKey] = uuid.v4();
        }
      });
    } else {//create a single record
      if(!data[this.storage.idKey]) {
        data[this.storage.idKey] = uuid.v4();
      }
      this.set("Location", util.format("/%s/%s", pluralizedName, data[idKey]));
    }
    yield collection.insert(data);
    
    this.status = 201;
  });
  
  router.del(pattern2, function*() {
    debug("delete");
    var collection = yield this.collection(this.params[0]);
    yield collection.removeById(this.params[1]);
    this.status = 204;
  });
  
  router.put(pattern2, function*() {
    var collection, id, record, data;
    id = this.params[1];
    collection = yield this.collection(this.params[0]);
    data = this.request.body;
    if(!data) {
      this.status = 400;
      this.body = {
        message: "should have usable data",
        status: "error",
        code: Constants.errors.BAD_REQUEST
      };
      return;
    }
    record = yield collection.findById(id);
    if(record) {
      debug("update");
      yield collection.updateById(id, data);
      this.status = 200;
    } else {
      debug("create");
      data[this.storage.idKey] = id;
      yield collection.insert(data);
      this.status = 201;
    }
    this.set("Location", util.format("/%s/%s", pluralizedName, id));
    
  });
  
  
  return router;
};