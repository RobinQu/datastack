module.exports = function(app, options) {
  options = options || {};
  require("./pluggable")(app);
  app.install("master");
  app.install("resource");
  app.install("storage", options.storage);
  app.install("notifier", options.notifier);
  app.install("cluster");
  return app;
};