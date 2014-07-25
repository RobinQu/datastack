var util = require("util"),
    Constants = require("../constants");

var RefResource = function(resource) {
  this.debug = resource.debug;
  this.collection = resource.name;
  this.id = resource.id.bind(resource);
  this.parentPattern = resource.pattern("get")[1];
};

RefResource.prototype.index = function() {
  var self = this;
  return function*() {
    self.debug("versions");
    var collection = yield this.collection(self.collection);
    this.body = yield collection.versions(self.id(this));
  };
};

RefResource.prototype.get = function() {
  var self = this;
  return function*() {
    var id = self.id(this);
    self.debug("get %s, %s", id, this.params.ref);
    var collection = yield this.collection(self.collection);
    var one = yield collection.findById(id, this.params.ref);

    if(one) {
      this.identify(one);
      this.body = one;
    }
  };
};

RefResource.prototype.del = function() {
  var self = this;
  return function*() {
    var id = self.id(this);
    self.debug("del %s, %s", id, this.params.ref);
    var collection = yield this.collection(self.collection);
    yield collection.removeOne(id, this.params.ref);
    this.app.sync(Constants.events.DELETE, {
      collection: self.collection,
      data: {
        id: this.params.id,
        ref: this.params.ref
      }
    });
    this.status = 204;
  };
};

RefResource.prototype.pattern = function(action) {
  switch(action) {
  case "index":
    return ["get", util.format("%s/_refs", this.parentPattern)];
  case "get":
  case "del":
    return [action, util.format("%s/_refs/:ref", this.parentPattern)];
  }
};

module.exports = RefResource;