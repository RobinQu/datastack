var debug = require("debug")("pluggable"),
    plugins = require("./plugin");

var Pluggable = function() {
  
  var app = this;
  
  app.plugins = [];
  
  app.plugin = function (plugin) {
    if(typeof plugin === "string") {
      return this.plugins.find(function(p) {
        return p.name === plugin;
      });
    } else {
      app.install(plugin);
    }    
    return plugin;
  };
  
  app.signal = function (signal, data) {
    var i,len;
    for(i=0,len=this.plugins.length; i<len; i++) {
      this.plugins[i].signal(signal, data);
    }
  };
  
  app.uninstall = function() {
    var i,len;
    for(i=0,len=this.plugins.length; i<len; i++) {
      try {
        this.plugins[i].dispose();
      } catch(e) {
        debug(e);
      }
    }
  };
  
  app.install = function(name, options) {
    var plugin, Plugin;
    if(typeof name === "string") {//install by name
      Plugin = plugins[name];
      plugin = new Plugin(options);
    } else {//assuming `name` is a plugin instance
      plugin = name;
      name = plugin.name;
    }
    debug("hook plugin %s", name);
    this.plugins.push(plugin);
    plugin.signal("init", this);
    
    //if we should expose something onto the `app` instance
    if(typeof plugin.expose === "function") {
      debug("expose %s to koa context", plugin.name);
      Object.defineProperty(app, plugin.name, {
        get: function() {
          return plugin.expose();
        },
        enumerable: true,
        configurable: false
      });
    }
    return plugin;
  };
};


module.exports = function(target) {
  Pluggable.call(target);
  return target;
};