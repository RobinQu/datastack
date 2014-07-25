var Plugin = require("./plugin"),
    debug = require("debug")("plugin:auth"),
    util = require("util"),
    UUID = require("node-uuid"),
    bcrypt = require("bcrypt-nodejs"),
    Constants = require("../constants"),
    Router = require("koa-router"),
    auth = require("basic-auth");

/*
 * @requires StoragePlugin, ResourcePlugin
*/ 
var Keystone = function() {
};

Keystone.prototype.grant = function() {
  var router = new Router(),
      self = this;
  router.post("/_grant", function*() {
    debug("grant");

    var grant = this.request.body;

    if(grant && (yield self.save(grant, this))) {
      this.status = 201;
      return;
    }
    this.body = {
      status: "error",
      code: Constants.errors.GRANT_REQUIRED,
      message: "missing grant info or grant info is incorrect"
    };
    this.status = 400;
    return;
  });
  return router.middleware();
};

Keystone.prototype.auth = function (collectionName, action) {
  //scope is named as "{collectionName}:{actionName}"
  var requiredScope = util.format("%s:%s", collectionName, action),
      self = this;
  return function*(next) {
    debug("auth");
    var info = auth(this), token, user;
    if(info && info.name && info.pass) {
      if(info.pass === "x-oauth-basic") {//token auth
        debug("token auth");
        //try to authenticate by token
        token = yield self.token(info.name, this);
        if(token) {
          if(token.scopes === "*" || token.scopes.indexOf(requiredScope) > -1) {
            yield next;
            return;
          }
        }
      }
      debug("user/password auth");
      user = yield self.user(info.name, this);
      if(user && user.password && (bcrypt.compareSync(info.pass, user.password))) {
        yield next;
        return;
      }
      this.status = 401;
      this.body = {
        message: "Failed to authenticate using either user/pass nor token",
        status: "error",
        code: Constants.errors.AUTH_FAILED
      };
    } else {
      this.status = 401;
      this.body = {
        message: "Missing auth info", 
        status: "error", 
        code: Constants.errors.AUTH_REQUIRED
      };
    }
  };
};

Keystone.prototype.save = function*(grant, ctx) {
  var collection, data = {};

  if(grant.type === "user" && grant.name && grant.password) {
    data.name = grant.name;
    data.password = bcrypt.hashSync(grant.password);
    collection = yield ctx.storage.collection("_users");
    yield collection.insert(data);
    return true;
  }

  if(grant.type === "token" && grant.scopes && (grant.scopes === "*" || util.isArray(grant.scopes))) {
    collection = yield ctx.storage.collection("_accessTokens");
    data[ctx.storage.idKey] = UUID.v4();
    data.scopes = grant.scopes;
    yield collection.insert(data);
    ctx.body = {token:data[ctx.storage.idKey], scopes: data.scopes};
    return true;
  }

  return false;
};

Keystone.prototype.token = function*(token, ctx) {
  //get collection
  var collection = yield ctx.storage.collection("_accessTokens");
  //find access token by token id
  return yield collection.findById(token);
};


Keystone.prototype.user = function*(name, ctx) {
  //auth by user name and password
  var collection = yield ctx.storage.collection("_users");
  return yield collection.findOne({"name": name});
};

    
/**
 * Authentication plugin
 * @author robinqu
 */
var AuthPlugin = function(options) {
  options = options || {};
  Plugin.call(this);
  this.keystone = options.keystone || new Keystone();
  this.name = "authenticator";
};

util.inherits(AuthPlugin, Plugin);

AuthPlugin.prototype.expose = function() {
  return this;
};

AuthPlugin.prototype.init = function(app) {
  //register before advice
  app.resource.before(this.keystone.auth.bind(this.keystone));
  if(this.keystone.grant) {
    app.use(this.keystone.grant());
  }
};


module.exports = AuthPlugin;