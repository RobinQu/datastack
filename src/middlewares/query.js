module.exports = function() {
  
  return function*(next) {
    // console.log(this.query);
    // `this` refers to the koa context
    this.sort = this.storage.buildSort(this.query.sort);
    this.criteria = this.storage.buildQuery(this.query.criteria);
    this.projection = this.storage.buildProjection(this.query.projection);
    this.sort = this.storage.buildSort(this.query.sort);
    
    yield next;
  };
  
};