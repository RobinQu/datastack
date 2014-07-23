var Plugin = require("./plugin"),
    debug = require("debug")("plugin:auth"),
    util = require("util"),
    bcrypt = require("bcrypt-nodejs"),
    auth = require("basic-auth");
    
/**
 * Authentication plugin
 * @author robinqu
 * @requires StoragePlugin
 */
var AuthPlugin = function() {
  Plugin.call(this);
  this.name = "authenticator";
};

util.inheirts(AuthPlugin, Plugin);

AuthPlugin.prototype.expose = function() {
  return function(requiredScopes) {
    debug("auth");
    return function*(next) {
      var info = auth(this), token, collection, i, len, user, hash;
      if(info && info.user && info.pass) {
        //auth by user name and password
        collection = yield this.storage.collection("_users");
        user = yield collection.findOne({"name": info.user});
        hash = yield bcrypt.hash.bind(bcrypt, info.pass, null, null);
        if(user && user.password && (yield bcrypt.compare.bind(bcrypt, user.password, hash))) {
          return yield next;
        }
        //get collection
        collection = yield this.storage.collection("_accessTokens");
        //find access token by token id
        token = yield collection.findById(info.pass);
        if(token === "*") {
          yield next;
        } else {
          for(i=0,len=requiredScopes.length; i<len; i++) {
            if(token.scopes.indexOf(requiredScopes[i]) === -1) {//
              this.status = 401;
              return;
            }
          }
          yield next;
        }
      } else {
        this.status = 401;
      }
    };
  };
};


module.exports = AuthPlugin;
