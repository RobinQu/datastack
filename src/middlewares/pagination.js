var _ = require("lodash");

module.exports = function(options) {
  _.extend(options, {
    limit: 20,
    skip: 0
  });
  return function*(next) {
    this.pagination = _.extend({}, options, {
      skip: this.query.skip,
      limit: this.query.skip
    });
    yield next;
  };
};