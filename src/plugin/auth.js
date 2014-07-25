var Plugin = require("./plugin"),
    debug = require("debug")("plugin:auth"),
    util = require("util"),
    bcrypt = require("bcrypt-nodejs"),
    Constants = require("../constants"),
    auth = require("basic-auth");
    
/**
 * Authentication plugin
 * @author robinqu
 * @requires StoragePlugin
 */
var AuthPlugin = function(options) {
  options = options || {};
  Plugin.call(this);
  this.name = "authenticator";
  this.auth = options.auth || AuthPlugin.BasicTokenAuthenticate;
};

util.inherits(AuthPlugin, Plugin);

AuthPlugin.prototype.expose = function() {
  return this;
};

AuthPlugin.prototype.middleware = function (collection, action) {
  return this.auth(collection, action);
};


/*
 * @requires StoragePlugin
*/ 
AuthPlugin.BasicTokenAuthenticate = function (collectionName, action) {
  //scope is named as "{collectionName}:{actionName}"
  var requiredScope = util.format("%s:%s", collectionName, action);
  return function*(next) {
    debug("basick token auth '%s'", this.get("authorization"));
    var info = auth(this), token, collection, user;
    if(info && info.name && info.pass) {
      if(info.pass === "x-oauth-basic") {//token auth
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

module.exports = AuthPlugin;