var Router = require("koa-router"),
    middlewares = require("./middlewares"),
    lingo = require("lingo"),
    util = require("util"),
    
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
    // console.log(this.pagination);
    debug("criteria %o, projection %o, sort %o, pagination %o", this.criteria, this.projection, this.sort, this.pagination);
    var cursor = yield collection.find(this.criteria, this.projection);
    this.body = yield cursor.sort(this.sort)
              .skip(this.pagination.skip)
              .limit(this.pagination.limit)
              .toArray();
  });
  
  router.get(pattern2, function*() {
    debug("show");
    
    var collection = yield this.collection(this.params[0]);
    var doc = yield collection.findOne(this.params[1]);
    if(!doc) {
      this.status = 404;
    } else {
      this.body = doc;
    }
  });
  
  router.post(pattern1, function*() {
    debug("create");
    var data, collection;

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
    
    var result = yield collection.insert(data);
    
    //write resource location for single record creation
    if(!util.isArray(data) && result.length && result[0][this.storage.idKey]) {
      this.set("Location", util.format("/%s/%s", pluralizedName, result[0][this.storage.idKey]));
    } else {//mark as batch save
      debug("batch save %s", result.length);
      this.set("x-batch-save", result.length);
    }
    
    this.status = 201;
  });
  
  router.del(pattern2, function*() {
    debug("delete");
    var collection = yield this.collection(this.params[0]);
    yield collection.removeById(this.params[1]);
    this.status = 204;
  });
  
  router.put(pattern2, function*() {
    var collection, id, record, data, result;
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
    record = yield collection.findOne(id);
    // console.log(record, this.get("if-match"));
    if(record && this.storage.etag(record) === this.get("if-match")) {//update
      debug("update");
      yield collection.updateById(id, data);
      this.status = 200;
      // this.set("Location", util.format("/%s/%s", pluralizedName, id));
      return;
    }
    if(!record || this.get("if-none-match")) {//create
      debug("create");
      data[this.storage.idKey] = id;
      result = yield collection.insert(data);
      this.status = 201;
      this.identify(result[0]);
      this.set("Location", util.format("/%s/%s", pluralizedName, id));
      return;
    }
    
    this.status = 409;
  });
  
  
  return router;
};