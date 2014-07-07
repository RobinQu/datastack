var util = require("util"),
    debug = require("debug")("datastack:middleware"),
    Constants = require("../constants");

module.exports = function() {
  
  return function*(next) {
    // `this` refers to the koa context
    var fields = ["sort", "criteria", "projection", "sort"],
        i, len, field, captialized;
    for(i=0,len=fields.length; i<len; i++) {
      field = fields[i];
      captialized = field[0].toUpperCase()+ field.slice(1);
      try {
        this[field] = this.storage["build" + captialized](this.query[field]);
      } catch(e) {
        debug("failed to parse %s: %s", fields[i], this.query[field]);
        debug(e);
        this.status = 400;
        this.body = {message: util.format("malformed query parameter %s", field), status: "error", code: Constants.errors.BAD_QUERY_PARAMETER};
        return;
      }
    }
    yield next;
  };
  
};