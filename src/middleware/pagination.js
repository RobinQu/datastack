var _ = require("lodash");

module.exports = function(options) {
  var defaults = _.extend({
    skip: 0,
    limit: 20
  }, options || {});
  return function*(next) {
    this.pagination = {};
    this.pagination.skip = parseInt(this.query.skip, 10) || defaults.skip;
    this.pagination.limit = parseInt(this.query.limit, 10) || defaults.limit;
    // console.log(this.pagination);
    yield next;
  };
};