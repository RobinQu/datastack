module.exports = function(app, options) {

  require("./pluggable")(app);
  var plugins = require("./plugin");
  var master = new plugins.Master();
  var storage = new plugins.Storage(options.storage);
  var notifier = new plugins.Notifier(options.notifier);
  
  app.plugin(master);
  app.plugin(storage);
  app.plugin(notifier);
  
  return app;
};