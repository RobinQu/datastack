var proto = Object.create(Object.prototype);

// export to JSON
proto.toJSON = function () {
  return this;
};

module.exports = proto;