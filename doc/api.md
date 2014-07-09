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

There will be many more notifiers:

* APN
* Mails
