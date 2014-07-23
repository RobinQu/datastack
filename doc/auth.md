# Authentication

HTTP Basic Auth is used in `datastack`:

* username and password pair that has all privileges of data operations
* private OAuth2 access token with scopes. It's not a complete OAtuh2 implementaion, as `datastack` won't have any UI for confirmation and envoles a lot of things we don't need right now. Maybe it should be done in a seperate plugin.