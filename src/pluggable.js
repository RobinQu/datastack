var Pluggable = function() {
  
  this.plugins = [];
  
  this.plugin = function (plugin) {
    if(typeof plugin === "string") {
      return this.plugins.find(function(p) {
        return p.name === plugin;
      });
    } else {
      this.plugins.push(plugin);
      plugin.signal("init", this);
    }
    return plugin;
  };
  
  this.signal = function (signal, data) {
    var i,len;
    for(i=0,len=this.plugins.length; i<len; i++) {
      this.plugins[i].signal(signal, data);
    }
  };
  
};


module.exports = function(target) {
  Pluggable.call(target);
  return target;
};