# DataStack

[![Build Status](https://travis-ci.org/RobinQu/datastack.svg?branch=master)](https://travis-ci.org/RobinQu/datastack)

Human-friendly RESTful middlewares for koa

## TL;DR

Building your API like a pro:


    var datastack = require("datastack"),
        koa = require("koa");

    var app = koa();
    datastack(app, {
      storage: {
        type: "mongodb",
        uri: "mongodb://127.0.0.1:27017/zoo"
      }
    });
    app.use(datastack.resource("cat"));
    app.use(datastack.resource("dog"));
    app.listen(porcess.env.PORT || 8888);


And you can now have fully operational RESTful API (and more) against two different `collection`s.


## Philosophy

Fundalmentally `datastack` is a web middleware that is powered by `koa` and its friends. It targets to help you to quickly build up your RESTful API with minimun code. To understand what `datastack` really is, please read on the following topics:

* [Data model and data storage](/doc/data_model_and_storage.md)
* [API exposed by built-in components](/doc/builtin_api.md)
* [Design patterns](/doc/patterns.md)
* [Plugin system](/doc/plugin.md)
* [Working with cluster](/doc/cluster.md)
* [Authentication](/doc/auth.md)

## Roadmap

* [Alpha](https://github.com/RobinQu/datastack/issues?milestone=1&state=open) July 6, 2014
* [Beta](https://github.com/RobinQu/datastack/issues?milestone=2&state=open) July 13, 2014
* [Theta](https://github.com/RobinQu/datastack/issues?milestone=3&state=open) July 20, 2014
* [Delta](https://github.com/RobinQu/datastack/issues?milestone=4&state=open) July 27, 2014

## License

MIT