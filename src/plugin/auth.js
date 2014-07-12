var Plugin = require("./plugin"),
    debug = require("debug")("plugin:auth"),
    util = require("util"),
    datastack = require("../datastack");
    
    
var AuthPlugin = function(options) {
  Plugin.call(this);
  this.name = "auth";
  this.dependencies = ["storage"];
};

util.inheirts(AuthPlugin, Plugin);




module.exports = AuthPlugin;
