var Plugin = require("./plugin"),
    debug = require("debug")("plugin:auth"),
    util = require("util"),
    UUID = require("node-uuid"),
    bcrypt = require("bcrypt-nodejs"),
    Constants = require("../constants"),
    Router = require("koa-router"),
    auth = require("basic-auth");
    
/**
 * Authentication plugin
 * @author robinqu
 * @requires StoragePlugin, ResourcePlugin
 */
var AuthPlugin = function(options) {
  options = options || {};
  Plugin.call(this);
  this.name = "authenticator";
  this.auth = options.auth || AuthPlugin.BasicTokenAuthenticate;
  this.grant = options.grant || AuthPlugin.BasicAuthGrant;
};

util.inherits(AuthPlugin, Plugin);

AuthPlugin.prototype.expose = function() {
  return this;
};

AuthPlugin.prototype.init = function(app) {
  //register before advice
  app.resource.before(this.auth);
  app.use(this.grant());
};

/*
 * @requires StoragePlugin
*/ 
AuthPlugin.BasicTokenAuthenticate = function (collectionName, action) {
  //scope is named as "{collectionName}:{actionName}"
  var requiredScope = util.format("%s:%s", collectionName, action);
  return function*(next) {
    debug("auth");
    var info = auth(this), token, collection, user;
    if(info && info.name && info.pass) {
      if(info.pass === "x-oauth-basic") {//token auth
        debug("token auth");
        //try to authenticate by token
        //get collection
        collection = yield this.storage.collection("_accessTokens");
        //find access token by token id
        token = yield collection.findById(info.name);
        if(token) {
          if(token.scopes === "*" || token.scopes.indexOf(requiredScope) > -1) {
            yield next;
            return;
          }
        }
      }
      debug("user/password auth");
      //auth by user name and password
      collection = yield this.storage.collection("_users");
      user = yield collection.findOne({"name": info.name});
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

AuthPlugin.BasicAuthGrant = function() {
  var router = new Router();
  router.post("/_grant", function*() {
    debug("grant");
    var grant = this.request.body, collection, data = {};
    this.status = 201;
    if(grant && grant.type === "user" && grant.name && grant.password) {
      collection = yield this.storage.collection("_users");
      data.name = grant.name;
      data.password = bcrypt.hashSync(grant.password);
      yield collection.insert(data);
      return;
    }
    
    if(grant && grant.type === "token" && grant.scopes && (grant.scopes === "*" || util.isArray(grant.scopes))) {
      collection = yield this.storage.collection("_accessTokens");
      data[this.storage.idKey] = UUID.v4();
      data.scopes = grant.scopes;
      yield collection.insert(data);
      this.body = {token:data[this.storage.idKey], scopes: data.scopes};
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

module.exports = AuthPlugin;