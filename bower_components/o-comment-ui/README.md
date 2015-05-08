# Introduction

JavaScript module which incorporates common UI elements of the FT commenting system like dialogs, forms, common parts of a commenting widget with DOM manipulation and a unified way to load it.

## Contents

 * <a href="#jsapi">JavaScript API</a>
     * <a href="#widget">Widget</a>
     * <a href="#widgetui">Widget UI</a>
     * <a href="#dialogs">Dialogs</a>
     * <a href="#templates">Templates</a>
     * <a href="#i18n">Internationalization</a>
     * <a href="#logging">Logging</a>
 * <a href="#sassapi">Sass API</a>
     * <a href="#fontfamily">Font family</a>
 * <a href="#browser">Browser support</a>
 * <a href="#core">Core/enhanced experience</a>

## <div id="jsapi"></div> JavaScript API
### <div id="widget"></div> Widget
Widget is responsible to coordinate getting initialization data, initializing the Ui. While this class implements some of the basic functionality (handling errors, loading timeout), it should be extended by providing an implementation for getting the initialization data.

#### Constructor

```javascript
new oCommentUi.Widget(config);
```

To create an instance, you need to provide a configuration object. This should have the following structure:

##### Mandatory fields:

- articleId: ID of the article, any string
- url: canonical URL of the page
- title: Title of the page

##### Optional fields:

 - timeout: Period of time after a timeout is triggered. Default is 15000 ms (15 sec). Its value should be given in milliseconds (ms).

#### Example

```javascript
new oCommentUi.Widget(el, {
    articleId: 'e113c91c-10d9-11e4-812b-00144feabdc0',
    url: 'http://www.ft.com/cms/s/0/e113c91c-10d9-11e4-812b-00144feabdc0.html',
    title: 'Rolls-Royce seeks to catch-up with rivals on margins - FT.com'
});
```

#### Final methods
###### init
This method will initiate the process of loading the initialization data that are needed to render the widget and the rendering of the UI. This method uses hook methods which are not implemented in this module, but should be implemented in the module that extends it.
`init` will handle errors of the process of loading the widget, also timeout if an error is not available.

This method can be called once on an instance (calling it multiple types will have no effect).

#### Abstract methods (not implemented in this module)
###### loadInitData
This method is responsible for gathering data that is needed to initialize the widget (e.g. metadata, site ID, comments, etc.).

###### render
This method is responsible for rendering the UI of the widget on the page. Render is called when the initialization process is done.
This method is called using the data gathered during the init process:

```javascript
this.render(initData);
```


#### Methods that can be overriden (they have default implementation)
###### onError
This method is responsible to handle any error that appears during the initialization.

```javascript
this.onError(errorObject);
```

The default implementation clears out the container of the widget and shows the unavailable message template (available using the template object).

###### onTimeout
This method is responsible to handle the case when within a given time the loading isn't finished and no error appeared.

The default implementation clears out the container of the widget and shows the unavailable message template (available using the template object).


#### Extend
Extending of the `Widget` can be done in the following way:

```javascript
var WidgetExtend = function () {
    oCommentUi.Widget.apply(this, arguments);
}
oCommentUi.Widget.__extend(WidgetExtend, {eventNamespace}, {classNamespace});
```

Example from `o-comments`:

```javascript
var Widget = function () {
    oCommentUi.Widget.apply(this, arguments);
}
oCommentUi.Widget.__extend(Widget, 'oComments', 'o-comments');
```


### <div id="widgetui"></div> Widget UI
This class is responsible to handle the UI part of a commenting widget. An instance of this is created within an instance of the `Widget`.
While this implementation has predefined methods, it can be extended with particular UI methods.

#### Constructor
```javascript
new oCommentUi.WidgetUi(widgetContainer);
```

Where `widgetContainer` should be a DOM element in which the widget is loaded.

#### Methods
###### scrollToWidget
Scrolls the page to the widget. A callback function is called when the scroll finished (optional).

###### addNotAvailableMessage
Inserts message when comments is not available, either because of the web services or Livefyre.

###### clearContainer
Clears the container's content.

#### Extend
Extending of Widget can be done in the following way:

```javascript
var WidgetUiExtend = function () {
    oCommentUi.WidgetUi.apply(this, arguments);
}
oCommentUi.WidgetUi.extend(WidgetUiExtend);
```



### <div id="dialogs"></div> Dialogs
Generic Ui functionality which is common across all istances of the comments. These are mostly dialogs which show on the page and are unrelated to the Widget's container or widget instance.

The features are available on the following object:

```javascript
oCommentUi.userDialogs
```

#### Methods
###### showSetPseudonymDialog
Shows a dialog for setting the initial pseudonym (shown when the user doesn't have a pseudonym set).

```javascript
oCommentUi.userDialogs.showSetPseudonymDialog({
    submit: function (formData, callback) {
        // called when the form is submitted
    },
    close: function () {
        // called when the dialog is closed by a user action
    }
});
```

###### showSettingsDialog
Settings dialog where the user can change its pseudonym or email preferences.

```javascript
oCommentUi.userDialogs.showSettingsDialog({
        displayName: 'currentPseudonym',
        settings: {
            emaillikes: 'never'
        }
    },
    {
        submit: function (formData, callback) {
            // called when the form is submitted
        },
        close: function () {
            // called when the dialog is closed by a user action
        }
    });
```

###### showEmailAlertDialog
Shows a dialog which reminds the user to save its email preferences if he/she didn't do so.

```javascript
commentUi.userDialogs.showEmailAlertDialog({
    submit: function (formData, callback) {
        // called when the form is submitted
    },
    close: function () {
        // called when the dialog is closed by a user action
    }
});
```

###### showInactivityMessage
Shows a dialog with a sign in link to re-login after a session expire.

```javascript
commentUi.userDialogs.showInactivityMessage({
    submit: function (formData, callback) {
        // called when the form is submitted
    },
    close: function () {
        // called when the dialog is closed by a user action
    }
});
```

#### Parameters
All functions of `userDialogs` has the same callback parameter structure, which should be an object with the following fields:

###### submit
<strong>Required.</strong> Function that is called when the form is submitted. As parameters the form data is provided (serialized into an object of key-value pairs), and a callback which should be called with either an error message (if an error occurred) or without parameters if submission is successful.
Example:

```javascript
callbacks.submit({
    formKey: 'formValue'
}, function (err) {
    if (err) {
        // show the error message, leave the dialog open
        return;
    }

    // success, close the dialog
}
});
```
###### close
Optional. Function that is called when the dialog is closed.


### <div id="templates"></div> Templates
This contains common Mustache templates which are compiled and can be rendered with custom data.

The templates are available on the following object:

```javascript
oCommentUi.templates
```

Templates that are available:

###### unavailableTemplate
Message that appears when an error occured or loading the widget takes longer than the timeout period. It has a default style added.

Parameters:

- message: message to show. By default i18n.unavailable is used to render within the WidgetUi.

###### termsAndGuidelinesTemplate
Terms and guidelines message with default style.
Requires no parameters to render.

###### commentingSettingsLink
Link that is used for changing user settings.

Parameters:

- label: Label of the link. i18n.commentingSettings can be used for it.

###### clearLine
Clearfix. Separates rows horizontally that have float.

These templates can be overriden on a global level.


### <div id="i18n"></div> Internationalization
Internationalization is responsible to provide common messages/texts that are used within the commenting application.

The strings are available on the following object:

```javascript
oCommentUi.i18n
```

It exposes the following:
###### texts
Contains generic messages:

- unavailable: Message that is shown when the widget is unavailable
- changePseudonymError: Generic error when changing the pseudonym fails and no error message is coming from the server.
- genericError: Generic error message.
- commetingSettings: label of the commenting settings link "Commenting settings".

###### serviceMessageOverrides
Some error messages that come from the web services are not very user friendly. These messages are mapped to more user friendly versions that can be shown to the user.

### <div id="logging"></div> Logging
Logging can be enabled for debugging purposes. It logs using the global 'console' if available (if not, nothing happens and it degrades gracefully).
By default logging is disabled.

##### oChat.enableLogging()
This method enables logging of the module.

##### oChat.disableLogging()
This method disables logging of the module.

##### oChat.setLoggingLevel(level)
This method sets the logging level. This could be a number from 0 to 4 (where 0 is debug, 4 is error), or a string from the available methods of 'console' (debug, log, info, warn, error).
Default is 3 (warn).

## <div id="sassapi"></div> Sass API
### <div id="fontfamily"></div> Font-family
There is a default font-family set for o-comment-ui: `BentonSans, sans-serif`
*Please note that the font itself is not loaded by this module, this should be done by the product.*

In order to override the default font, set a value for the following variable:

```scss
$o-comment-ui-font-family: font1, font2;
```

## <div id="browser"></div> Browser support 
Works in accordance with our [support policy](https://docs.google.com/a/ft.com/document/d/1dX92MPm9ZNY2jqFidWf_E6V4S6pLkydjcPmk5F989YI/edit)

## <div id="core"></div> Core/Enhanced Experience
Only the enhanced experience offers any kind of commenting functionality. Core functionality will be added in due course.
