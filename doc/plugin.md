# Plugin System

`Plugin` is a kind of extension interface. Most of datastack features are encapsulated in various plugins. See [plugins folder](./plugins) for defail of built-in plugins.

Plugins are enabled by default:

* resource
* cluster
* master
* notifier
* storage


Optional plugins:

* auth

## Lifecycle

* Uninstalled: plugin is not created or installed
* Installed: plugin is created and installed onto a `datastack` app
  * init: during execution of `init` method on plugin
  * expose: during execution of `expose` method on plugin
* Working: plugin is configured and working with `datastack` app
* Disposed: plugin is uninstalled and disposed 

## API

`datastack` enabled app have following plugin-related API.

### app.install(nameOrPlugin, [options])

* `nameOrPlugin`: install a plugin with name of built-in plugin or a plugin instance
* `options`: if a plugin name is given, this option hash will be used to construct the actual plugin

### app.plugin(nameOrPlugin)

* `nameOrPlugin`: if name is given, return the plugin named; otherwise, install the plugin instance

### app.uninstall()

Uninstall all plugin

## Subclass Notes

### General

* All plugins are subclass of `datastack.Plugin`.
* Plugin is a standard `EventEmitter`

### plugin.name

Should always assign a name for each plugin

### plugin.init(app)

`init` of a plugin is called with app instance. Setup work should be done here.

### plugin.expose()

Upon installation, plugin will be queried if anything should exposed to the app instance.

If `expose` method is given, a lasy getter will be setup on app with the name of this plugin to get what is returned by `expose` method.