var assert = require("assert"),
    util = require("util");


var Prototype = require("./record_prototype"),
    Interceptor = require("./recrod_interceptor");

var Record = function(options) {
  var type;
  if(typeof options === "string") {
    type = options;
    options = {};
  } else {
    type = options.type;
  }
  assert(type, "should provide record type");


  var i = new Interceptor(type, options.props);
  // http://wiki.ecmascript.org/doku.php?id=harmony:proxies
  var proxy = Proxy.create(i.handler(), Prototype);

  return proxy;
};


// var defineRecord = function(type, defaults) {
//   var interceptor = new Interceptor(type, defaults);
//   var Record = Proxy.createFunction(interceptor.handler(), function(options) {//callTrap
//     return new Record()
//   })
// };




// fix `instanceof`
Record.prototype = Prototype;
Prototype.constructor = Record;

module.exports = Record;