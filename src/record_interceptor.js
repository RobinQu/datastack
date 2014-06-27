// import shim
require("es6-shim");

var getClassType = function(val) {
  return Object.prototype.toString.call(val).slice(8, -1);
};

var Interceptor = function(type, props) {
  Object.defineProperties(this, {
    // record type
    type: {
      value: type,
      configurable: false,
      writable: false,
      enumerable: true
    },
    // field properties
    props: {
      value: props || {},
      configurable: false,
      enumerable: true
    }
  });
};

Interceptor.prototype.isAccetableValue = function (value) {
  var isAcceptable = function(value) {
    if(value === undefined || value === null || 
      ["number", "string"].indexOf(typeof value) > -1 || 
      value instanceof require("./record") || 
      ["Date", "Object"].indexOf(getClassType(value)) > -1) {
      return true;
    }
    return false;
  };
};

Interceptor.prototype.handler = function () {
  return {
    set: function(receiver, property, value) {
      if(this.isAccetableValue(value)) {
        this.props[property] = value;
        return true;
      }
      return false;
    },

    get: function(receiver, property) {
      return this.props[property];
    },

    getOwnPropertyDescriptor: function(name) {
      return Object.getOwnPropertyDescriptor(this.props, name);
    },

    getPropertyDescriptor: function(name) {
      return Object.getPropertyDescriptor(this.props, name);
    },

    getOwnPropertyNames: function() {
      return Object.getOwnPropertyNames(this.props);
    },

    getPropertyNames: function() {
      return Object.getPropertyNames(this.props);
    },

    defineProperty: function() {
      return Object.defineProperty(this.props);
    },

    delete: function(name) {
      delete this.props[name];
    },

    fix: function() {
      if (Object.isFrozen(obj)) {
         var result = {};
         Object.getOwnPropertyNames(obj).forEach(function(name) {
           result[name] = Object.getOwnPropertyDescriptor(obj, name);
         });
         return result;
       }
       // As long as obj is not frozen, the proxy won't allow itself to be fixed
       return undefined; // will cause a TypeError to be thrown
    }
  };
};


module.exports = createInterceptor;