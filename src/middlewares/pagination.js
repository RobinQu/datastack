var _ = require("lodash");

module.exports = function(options) {
  var defaults = _.extend({
    skip: 0,
    limit: 20
  }, options || {});
  return function*(next) {
    this.pagination = {};
    this.pagination.skip = this.query.skip || defaults.skip;
    this.pagination.limit = this.query.limit || defaults.limit;
    // console.log(this.pagination);
    yield next;
  };
};