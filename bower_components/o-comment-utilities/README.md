# Introduction
A collection of helper functions used by o-comments and o-chat.

## Contents

 * <a href="#api">API</a>
     * <a href="#envConfig">envConfig</a>
     * <a href="#events">Events</a>
     * <a href="#envConfig">envConfig</a>
     * <a href="#jsonp">jsonp</a>
     * <a href="#scriptLoader">scriptLoader</a>
     * <a href="#storageWrapper">storageWrapper</a>
     * <a href="#logger">logger</a>
     * <a href="#functionSync">functionSync</a>
     * <a href="#domConstruct">domConstruct</a>
     * <a href="#cookie">cookie</a>
     * <a href="#ftUser">ftUser</a>


## <div id="api"></div> API

### <div id="envConfig"></div> envConfig
This module provides a useful way to handle application level configurations. It supports setting and reading configurations, also overriding existing values (helpful when the application should be working on different environments with partially different configuration).

#### Constructor
In order to create a configuration, you should create an instance first:

```javascript
var config1 = new oCommentUtilities.EnvConfig();
```


In order to keep an isolated configuration object of your application, which is accessible within your whole application, the following method can be used:

 - define a config.js file within your application
 - create an instance of config.js and expose it within the application:

```javascript
var EnvConfig = require('js-env-config');

module.exports = new EnvConfig();
```

#### Methods
###### get
Gets the whole configuration if without parameter, or a field if a field is given as parameter.

Getting the whole configuration object:

```javascript
config.get();
```


Getting a field of the configuration object:

```javascript
config.get('aField');
```

###### set
Sets the configuration. The current configuration is merged with this object. Existing fields that have primitive type values and the same field has value in the object given to set, are overwritten.

Setting an object:

```javascript
config.set({
    'configField': 'value'
});
```


Setting a key/value:

```javascript
config.set('aField', {
    'configField': 'value'
});
```

This is equivalent with the following object:

```javascript
{
    "aField": {
        "configField": "value"
    }
}
```


### <div id="events"></div> Events
This module helps creating custom events, listening on custom events and triggering them. It is similar to jQuery's event system (except that it doesn't support namespacing).

#### Constructor
The constructor has no parameter.

```javascript
var myEvent = new Events();
```

#### Methods
###### on
Registers a new event handler to an event.

```javascript
myEvent.on(event, handler)
```

Where:

 - event: name of the event
 - handler: function which is called when the event is triggered. The handler can receive parameters if the trigger was made with data to be forwarded to handlers.

###### one
Registers a new event handler to an event. Similar to 'on', but the handler is called only once.

```javascript
myEvent.one(event, handler)
```

###### off
Removes one or more event handlers.

```javascript
myEvent.off(event, handler)
```

Where:

 - event: name of the event from which the handler should be removed.
 - handler: handler function that will be removed.

If handler is omitted, all event handlers from the event specified are removed.
If both event and handler are omitted, all event handlers are removed.

###### trigger
Triggers an event: it causes calling all the event handlers that are listening for the event name.

```javascript
myEvent.trigger(event, customData)
```

Where:

 - event: name of the event for which the handlers should be called.
 - customData: optional parameter, data to be passed to the event handlers.


### <div id="jsonp"></div> jsonp
This module provides a similar solution for JSONP communication as jQuery. For more information on JSONP, visit http://json-p.org/ .

The module is actually a single function. It should be called the following way:

```
commentUtilitis.jsonp({
    url: "URL here",
    data: "Data here" //optional
}, function (err, data) {
    if (err) {
        throw err;
    }

    // use the data
});
```

Both parameters (configuration object and callback) are required. Also, the configuration should contain the 'url' field.

###### data
If data should be sent, it can be part of the URL directly, or can be provided as the data field within the configuration object. The data field should be an object with key-value pairs.

###### callback
The callback has a Node.js inspired form. The first parameter is the error parameter, while the second one is the data parameter received from the server as a response.


### <div id="scriptLoader"></div> scriptLoader
This module provides a similar solution for loading a Javascript file asynchronously as jQuery's $.getScript() (http://api.jquery.com/jquery.getscript/).

The module is actually a single function. It can be called the following ways:

1.

```
oCommentUtilities.scriptLoader({
    url: "URL here",
    charset: "utf-8" //optional
}, function (err) {
    if (err) {
        throw err;
    }

    // loaded successfully
});
```

2.

```
oCommentUtilities.scriptLoader("URL here", function (err) {
    if (err) {
        throw err;
    }

    // loaded successfully
});
```

Both parameters (configuration object/URL and callback) are required. Also, if the configuration is an object, it should contain the 'url' field.

###### callback
The callback has a Node.js inspired form. The parameter is either 'null' or an Error instance. If it doesn't contain an error, the loading finished with success.


### <div id="storageWrapper"></div> storageWrapper
Wrapper around localStorage and sessionStorage, but enhanced with automatic type conversion.

Automatic type conversion means the followin: for example, if you store an object which can be serialized into a JSON string, when you read it back you will get the same Javascript object and not just a plain string.

The module exposes two main fields, both having the same API:

```javascript
oCommentUtilities.storageWrapper.localStorage //wrapper around native localStorage
oCommentUtilities.storageWrapper.sessionStorage //wrapper around native sessionStorage
```

#### API of localStorage and sessionStorage
Both submodules has the same public API. The difference is only the place the data is saved (as it is in the native API).

Available methods:
###### setItem
Saves an item in the storage. It has the following form:

```javascript
setItem(key, value);
```

The value is saved in the storage with the key. The value can be looked up using the key provided.


The item is saved in the following format:

```
{type}|{value converted/serialized to string}
```

For example, a boolean "true" value is saved in the following way:

```
boolean|true
```

Objects that can be serialized are saved with the type "json".

###### getItem
Reads the item and returns it in the original type that was saved.

```javascript
getItem(key);
```

For example, if a boolean true was saved, it is not returned as a string, but as a boolean type.

###### hasItem
Returns true or false and it says if there is an item with that key.

```javascript
hasItem(key);
```

###### removeItem
Removes the item saved with the key provided.

```javascript
removeItem(key);
```

###### clear
Clears all entries for the current domain.

###### native
Returns the native localStorage or sessionStorage object.



### <div id="logger"></div> logger
Logging helper which uses the native "console" to log. It also extends IE8 logging capabilities by stringifying complex objects.

Where console is not available, the logger fails silently.

The module supports the following methods:

#### Logger configuration
The logger can be configured with the following: enable/disable, set the minimum level that is logged.

By default is logging disabled (recommended settings for production).
Default level of logging is 'warn'.

###### enable
Enables the logging.

```javascript
logger.enable();
```

###### disable
Disables the logging.

```javascript
logger.disable();
```

###### setLevel
Sets the minimum level that should be logged. The levels are the following:

 - debug
 - log
 - info
 - warn
 - error

```javascript
logger.setLevel(level);
```

Where level can be:
 - string: anything from the list above
 - numeric: any number from the range between 0-4, where 0 means log everything (min level is debug), while 4 means log only error level logs.

#### Logging functions
Available functions:

 - debug
 - log
 - info
 - warn
 - error


### <div id="functionSync"></div> functionSync
#### Parallel
This submodule is meant to generate a callback only when all functions provided finished their execution. This is achieved by passing a callback as parameter to the functions that are executed.

The submodule itself is a single function and can be called in the following way:

```javascript
oCommentUtilities.functionSync.parallel({
    func1: function (callback) {},
    func2: function (callback) {},
    func3: {
        args: ['param1', 'param2'],
        func: function (callback, param1, param2) {}
    }
}, function (dataAggregate) {
    // where data aggregate is:
    // {
    //      func1: 'dataFromFunc1',
    //      func2: 'dataFromFunc2',
    //      func2: 'dataFromFunc2'
    // }
}
});
```

Functions provided within the object can be in the following forms:

1. Single function. As example are func1 and func2.
2. Object with the following fields: func is the actual function that will be called, args are the arguments that are appended after the callback parameter.




For more information on the technical side, please visit the detailed documentation (docs/index.html).

### <div id="domConstruct"></div> domConstruct
This module is able to instantiate classes extended from o-comment-ui/Widget.js using markup in the DOM.

#### How to use it
This feature reads the DOM for certain types of elements. An example element:

```html
<div data-o-component="o-chat" id="commentWidget" data-o-chat-config-title="o-chat-test-closed3" data-o-chat-config-url="http://ftalphaville.ft.com/marketslive-test.html" data-o-chat-config-articleId="marketslive-test" data-o-chat-config-order="inverted"></div>
```

Key parts of the DOM element:

 - `data-o-component`: defines the type of Widget element, in this example `o-chat`.
 - id: optional, if it's not present it will be generated
 - data attributes in the format `data-o-{modulename}-config-{key}`: configuration options that are passed to the Widget constructor. `{key}` has the following rule: `--` means new object level, `-` means camel case. Example: `data-o-comments-config-livefyre--data-format--absolute="value"` is transformed to: ```{"livefyre": {"dataFormat": {"absolute": "value"}}}```.

In order to start the DOM construction, the `oCommentUtilities.initDomConstruct` function should be called with a configuration object, which has the following fields:

 - context: an HTML element or selector. In this element will be performed the search for elements which has `data-o-component="{modulename}"`. If none is specified, it falls back to `document.body`.
 - classNamespace: type of the Widget element, in the example above it would be a string `'o-chat'`. It is used as class and also as part of the data attributes.
 - eventNamespace: according to the origami spec, all events generated should be namespaced with the module's name, without dashes, but with camel case. In the example above namespace would be a string `'oChat'`.
 - module: reference to the global scope of the module. In the example above this would be the object `oChat`.
 - auto: if set to true, only the widgets which don't have `data-{namespace}-auto-init="false"` (e.g. data-o-chat-init="false") will be considered. This is useful when there are two phases of initialization: one on `o.DOMContentLoaded` and one on demand (lazy load). On `o.DOMContentLoaded` there will be loaded only the widgets which don't have this attribute, while the others only on explicit call.

Example: 

```javascript
var initDomConstructOnDemand = function () {
    oCommentUtilities.initDomConstruct({
        classNamespace: 'o-chat',
        eventNamespace: 'oChat',
        moduleRef: oChat,
        classRef: oChat.Widget
    });
}

document.addEventListener('o.DOMContentLoaded', function () {
    oCommentUtilities.initDomConstruct({
        classNamespace: 'o-chat',
        eventNamespace: 'oChat',
        moduleRef: oChat,
        classRef: oChat.Widget,
        auto: true
    });
});
```



In some cases this module should be called on demand by the product, so it could be exposed as a public API as part of the module which uses it.


Example: (from o-chat/main.js)

```javascript
var Widget = require('./src/javascripts/Widget.js');

exports.init = function (el) {
    return oCommentUtilities.initDomConstruct({
        context: el,
        classNamespace: 'o-chat',
        eventNamespace: 'oChat',
        moduleRef: this,
        classRef: Widget
    });
};
```

This way all the configurations are abstracted, the product should not care about setting them.

If you want to obtain a reference of the created *Class* instances, you should listen on the body to the event `{namespace}.ready` (e.g. oChat.ready), which will have the following details:

 - id: ID of the widget, which is basically the ID attribute of the owned DOM element
 - instance: the instance of the *Class*

Example:

```javascript
document.body.addEventListener('oChat.ready', function (evt) {
    //evt.detail.id and evt.detail.instance are available
});
```


The instance that is already created will have a flag that says that it shouldn't be created again, even if initDomConstruct is called again. The flag that is set is `data-{namespace}-built="true"` (e.g. data-o-chat-built="true"). **If you are creating instances in another way (programatically), the container element should have this flag set.**

#### Return value
The return value is an array with all the instances of `Class` (e.g. oChat.Widget) created.



### <div id="cookie"></div> cookie
Helpers for working with cookies.

#### get
Reads a cookie by name.

```javascript
oCommentUtilities.cookie.get('name');
```

#### set
Sets a cookie.

```javascript
oCommentUtilities.cookie.set('name', 'value', 36 /*days */);
```

#### remove
Removes a cookie

```javascript
oCommentUtilities.cookie.remove('name');
```


### <div id="ftUser"></div> ftUser
ftUser is a helper for obtaining information about the FT user, information like logged in status, user ID, email address, session ID.

Methods exposed that can be used:
 - isLoggedIn: returns the user's login status: true or false.
 - getEmail: returns the user's email address
 - getUserId: returns the user's ID
 - getSession: returns the FT session ID

