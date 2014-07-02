// module.exports = function(app, options) {
//   try {
//     var Source = require("./" + options.type);
//     return new Source(app, options);
//   } catch(e) {
//     throw new Error("Unsupported subscription source " + options.type);
//   }
// };

module.exports = {
  
  websocket: require("./websocket")
  
};