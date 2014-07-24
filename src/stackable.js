module.exports = function(app, options) {
  options = options || {};
  require("./pluggable")(app);
  var plugins = require("./plugin");
  app.plugin(new plugins.Master());
  app.plugin(new plugins.Storage(options.storage));
  app.plugin(new plugins.Notifier(options.notifier));
  app.plugin(new plugins.Cluster());
  app.plugin(new plugins.Auth(options.authenticator));
  return app;
};