# Authentication

HTTP Basic Auth is used in `datastack` resources:

* username and password pair that has all privileges of data operations
* private OAuth2 access token with scopes. It's not a complete OAtuh2 implementaion, as `datastack` won't have any UI for confirmation and envoles a lot of things we don't need right now. Maybe it should be done in a seperate plugin.

Auth feature is only enabled after `auth` plugin is used.

```
var app = koa();
datastack(app, {
  storage: {type:"memory"}
});
//manually enable auth plugin
app.install("auth");
app.listen(8888);
```

All RESTful resources created by `app.resource` or `datastack.resource` will be protected.

## Auth API

#### POST `/_grant`

Create a grant info.

* `type`: `user` or `token`

If you are creating a user grant:

* `name`: user name
* `password`: clear text password (will be encryped using bcrypt)

If you are creating a token grant:

* `scopes`: either a simple string `*` to indicate this token is granted on all scopes or specific scope list.

## Keystone

By default, all grant infos are persited on the same storage solution with RESTful data.

All users are stored in `_users` collection and all tokens are stored in `_accessTokens` collection.

Of course, you can completely change everything about authentication by giving a custom `Keystone` object.


At least two methods are required to be a valid `Keystone` object:

* `keystone.grant()` should return a koa middleware to handle grant requests
* `keystone.auth(collectionName, action)` should return a koa middleware which will be used in all resource layers.