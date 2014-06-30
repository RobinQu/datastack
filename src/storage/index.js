// # A note about storage implementation

// A storage objcet should be responsible for the underlying data operations so that the `datastack` has no need to care about how and where to handle all these records.

// A basic storage solution should have:

// 1. A `Storage` class that handles the database lifecycle (if any), configrations, etc
// 2. A `Collection` that exposes the data helper methods like `findById`


// See `MemoryStorage` to see a most simple implementaion of storage oslution

module.exports = {
  
  mongodb: require("./mongodb"),
  
  memory: require("./memory")
  
};