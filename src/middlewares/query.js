module.exports = function() {
  
  return function*(next) {
    this.criteria = this.query.criteria || {};
    this.projection = this.query.projection || {};
    this.sort = this.storage.buildSort(this.query.sort);
    yield next;
  };
  
};