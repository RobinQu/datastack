# DataStack

[![Build Status](https://travis-ci.org/RobinQu/datastack.svg?branch=master)](https://travis-ci.org/RobinQu/datastack)

Human-friendly RESTful middlewares for koa

## Concept

Building your API like a ninja:

```
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
```

And you can now have fully operational RESTful API (and more) against two different `collection`.


### Document

* The minimal abstraction of data fields
* schema-free documents in nature
* A document can have multiple versions
* Versioning support may vary according to storage solution you specify.


#### ID

* ID in `datastack` is not neccssarily unique and mandatory
* Key name for a ID can be configured accroding to the implementation of storage solution

### Collection

* A subset of documents in your database, commonly grouped by their logical category.
* It shares some ideas with some popular databases:
  * `table` in mysql
  * `collection` in mongodb
  * `view` in CouchDB

### Subscription

* A collection can emit different events to report data changes
* Data changes can be further populated by many means
  * Websocket
  * Apple Push Notification
  * Mail

### API

The APIs that are avaiable out-of-box:

#### Collection

* List a collection: `GET /:collection`

#### Document

* Get a document: `GET /:collection/:id`
* Create or update a document: `PUT /:collection/:id`
* Create one or more documents: `POST /:collection`

#### Version

* List all versions for a document: `/:collection/:id/_refs`
* Get a version: `/:collection/:id/_refs/:ref`

#### Event

There are some simple events emitted on data operations

`CREATE` Event:

* `collection`: collection name
* `data`: an array of `id`s of created records

`UPDATE` Event:

* `collection`: collection name
* `data.from`: `ref` of last version
* `data.to`: `ref` of current version

`DELETE` Event:

* `collection`: collection name
* `data.ref`: `ref` that is deleted, `*` means this deletion involes all refs
* `data.id`: `id` of the record that is deleted

#### Subscription

We have `websocket-notifier` built-in.

* Endpoint: `/:collection/:id/_subscription`
* Message contains the stringified version of `events` mentioned above

There will be many more notifiers liek:

* APN
* Mails

## Roadmap

* [Alpha](https://github.com/RobinQu/datastack/issues?milestone=1&state=open) July 6, 2014
* [Beta](https://github.com/RobinQu/datastack/issues?milestone=2&state=open) July 13, 2014
* [Theta](https://github.com/RobinQu/datastack/issues?milestone=3&state=open) July 20, 2014
* [Delta](https://github.com/RobinQu/datastack/issues?milestone=4&state=open) July 27, 2014

## License

MIT