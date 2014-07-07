module.exports = function(target) {
  target.plugins = [];
  target.plugin = function (plugin) {
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
};