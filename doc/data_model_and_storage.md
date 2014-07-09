# Data Model

## Document

* The minimal abstraction of data fields
* schema-free documents in nature
* A document can have multiple versions
* Versioning support may vary according to storage solution you specify.


## ID

* ID in `datastack` is not neccssarily unique and mandatory
* Key name for a ID can be configured accroding to the implementation of storage solution

## Collection

* A subset of documents in your database, commonly grouped by their logical category.
* It shares some ideas with some popular databases:
  * `table` in mysql
  * `collection` in mongodb
  * `view` in CouchDB

## Subscription

* A collection can emit different events to report data changes
* Data changes can be further populated by many means
  * Websocket
  * Apple Push Notification
  * Mail