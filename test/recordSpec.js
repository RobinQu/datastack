var datastack = require(".."),
    expect = require("chai").expect;

describe("Record", function() {
  
  it("should work as a simple object", function() {
    
    var r = new datastack.Record("foo");
    r.bar = "bar";
    expect(r.bar).to.equal("bar");
    delete r.bar;
    expect(r.bar).not.to.be.ok;
    expect(r instanceof datastack.Record).to.be.ok;
  });
  
  it("should only accept string, number, null, undefined, date and Record as values", function() {
    
    var r = new datastack.Record("foo");
    r.a = 1;
    r.b = "b";
    r.c = new Date();
    r.d = null;
    r.e = undefined;
    expect(r.a).to.equal(1);
    expect(r.b).to.equal("b");
    expect(r.c.constructor).to.equal(Date);
    expect(r.d).to.equal(null);
    expect(r.e).to.equal(undefined);
    
    r.f = {};
    expect(r.f).not.to.be.ok;
    
    var r2 = new datastack.Record("kar");
    r.g = r2;
    expect(r.g).to.equal(r2);
    
  });
  
  it("should to export json", function() {
    var r = new datastack.Record("foo");
    
    // r.a = {b:}
  });
  
  
});