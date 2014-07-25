var Router = require("koa-router"),
    middlewares = require("../middleware"),
    lingo = require("lingo"),
    assert = require("assert"),
    _ = require("lodash"),
    util = require("util"),
    RefResource = require("./ref"),
    co = require("co"),
    Constants = require("../constants");


var StackResource = function(options) {
  if(!(this instanceof StackResource)) {
    return new StackResource(options);
  }
  if(typeof options === "string") {
    options = {name: options};
  }
  assert(options.name, "should provide collection name");
  this.name = options.name;
  this.debug = require("debug")("resource:" + this.name);
  this.pagination = options.pagination;
  this.idKey = lingo.en.singularize(this.name) + "_id";
  this.router = new Router();
  this.auth = options.auth || false;
  //prior middlewares
  this.prior = options.prior || [];
  //setup routes
  this.route();
};

StackResource.prototype.middleware = function() {
  return this.router.middleware();
};

StackResource.prototype.pattern = function(action) {
  switch(action) {
  case "index":
    return ["get", util.format("/%s", this.name)];
  case "post":
    return [action, util.format("/%s", this.name)];
  case "get":
  case "del":
  case "put":
  case "head":
    return [action, util.format("/%s/:%s", this.name, this.idKey)];
  }
};

StackResource.prototype.route = function() {
  var refResource = new RefResource(this),
      add,
      self = this;
  add = function(action, target) {
    target = target || self;
    var pattern = target.pattern(action), args;
    //insert the prior middleware
    if(self.prior) {
      if(self.prior === "function") {
        pattern.push(self.prior.consturcotr.name === "GeneratorFunction" ? self.prior : self.prior(self.name, action));
      } else if(util.isArray(self.prior)) {
        pattern = pattern.concat(self.prior);
      }
    }
    //insert before advice middlewares
    pattern.push(function*befreAdvice(next) {
      self.debug("before advice");
      if(this.app.resource) {
        yield this.app.resource.middleware("before", self.name, action).call(this, next);
      } else {
        yield next;
      }
    });
    // self.debug("additional middlewares %s for %s, %s", pattern.length, self.name, action);
    //insert action middleware
    args = pattern.concat(target[action]());
    args.push(function*afterAdvice() {
      if(this.app.resource) {
        self.debug("after advice");
        //after advice should not wait, and we don't care the result
        co(this.app.resource.middleware("afeter", self.name, action)).call(this);
      }
    });
    //register route
    self.router[pattern[0]].apply(self.router, args);
  };
  
  //add CRUD middleware
  ["index", "get", "post", "put", "del"].forEach(function(action) {
    add(action);
  });
  //add ref middleware
  ["del", "get", "index"].forEach(function(action) {
    add(action, refResource);
  });
};

StackResource.prototype.id = function(context) {
  return context.params[this.idKey];
};

StackResource.prototype.index = function() {
  var self = this, mw;
  
  mw = function*() {
    self.debug("index");

    var collection = yield this.collection(self.name);
    // console.log(this.pagination);
    self.debug("criteria %o, projection %o, sort %o, pagination %o", this.criteria, this.projection, this.sort, this.pagination);
    var cursor = yield collection.find(this.criteria, this.projection);
    this.body = yield cursor.sort(this.sort)
              .skip(this.pagination.skip)
              .limit(this.pagination.limit)
              .toArray();
  };
  
  return [middlewares.pagination(this.pagination),  middlewares.query(), mw];
};

StackResource.prototype.get = function () {
  var self = this;
  return function*() {
    self.debug("show");
    
    var collection = yield this.collection(self.name);
    var doc = yield collection.findById(self.id(this));
    if(!doc) {
      this.status = 404;
    } else {
      this.identify(doc);
      this.body = doc;
    }
  };
};

StackResource.prototype.post = function() {
  var self = this;
  return function*() {
      self.debug("create");
      var data, collection;

      collection = yield this.collection(self.name);
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
        this.identify(result[0]);
        this.set("Location", util.format("/%s/%s/_refs/%s", self.name, result[0][this.storage.idKey], result[0][this.storage.refKey]));
        this.body = result[0];
      } else {//mark as batch save
        self.debug("batch save %s", result.length);
        this.set("x-batch-save", result.length);
        this.body = result;
      }
    
      this.app.sync(Constants.events.CREATE, {
        collection: self.name,
        data: _.map(result, this.storage.idKey)
      });
      this.status = 201;
    };
};

StackResource.prototype.del = function() {
  var self = this;
  return function*() {
    self.debug("delete");
    var collection = yield this.collection(self.name);
    yield collection.removeOne(self.id(this));
    this.app.sync("datastack:delete", {
      collection: self.name,
      data: {
        id: self.id(this),
        ref: "*"
      }
    });
    this.status = 204;
  };
};

StackResource.prototype.put = function() {
  var self = this;
  return function*() {
    self.debug("put");
    var collection, id, record, newRecord, data, result;
    id = self.id(this);
    collection = yield this.collection(self.name);
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

    if(record && this.storage.etag(record) === this.get("if-match")) {//update
      self.debug("update");
      yield collection.updateById(id, data);
      this.status = 200;
      //TODO: save this query
      
      newRecord = yield collection.findById(id);
      
      self.debug("from %s to %s", this.storage.ref(record), this.storage.ref(newRecord));
      
      this.identify(newRecord);
      this.set("Location", util.format("/%s/%s/_refs/%s", self.name, id, this.storage.ref(newRecord)));
      
      this.app.sync(Constants.events.UPDATE, {
        collection: self.name,
        data: {
          id: id,
          from: this.storage.ref(record),
          to: this.storage.ref(newRecord)
        }
      });
      return;
    }
    if(!record || this.get("if-none-match")) {//create
      self.debug("create");
      data[this.storage.idKey] = id;
      result = yield collection.insert(data);
      this.status = 201;
      this.identify(result[0]);
      this.set("Location", util.format("/%s/%s/_refs/%s", self.name, id, result[0][this.storage.refKey]));
      
      this.app.sync(Constants.events.CREATE, {
        collection: self.name,
        data: _.map(result, this.storage.idKey)
      });
      return;
    }
    self.debug("conflict, expect %s to equal %s", this.storage.etag(record), this.get("if-match"));
    this.status = 409;
  };
};

module.exports = StackResource;