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
    debug("basick token auth");
    var info = auth(this), token, collection, user, hash;
    if(info && info.user && info.pass) {
      //auth by user name and password
      collection = yield this.storage.collection("_users");
      user = yield collection.findOne({"name": info.user});
      hash = yield bcrypt.hash.bind(bcrypt, info.pass, null, null);
      if(user && user.password && (yield bcrypt.compare.bind(bcrypt, user.password, hash))) {
        return yield next;
      }
      //try to authenticate by token
      //get collection
      collection = yield this.storage.collection("_accessTokens");
      //find access token by token id
      token = yield collection.findById(info.pass);
      if(token === "*") {
        yield next;
      } else {
        if(token.scopes.indexOf(requiredScope) === -1) {
          this.status = 401;
          this.body = {
            message: "Failed to authenticate using either user/pass nor token",
            status: "error",
            code: Constants.errors.AUTH_FAILED
          };
          return;
        }
        yield next;
      }
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