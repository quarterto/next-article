# comment-ui

JavaScript module which incorporates common UI elements of the FT commenting system like dialogs, forms, common parts of a commenting widget with DOM manipulation and a unified way to load it.

---

## How to use it
There are two ways of using this module:

### Standalone
Run `grunt`, then insert the JS found in the dist folder:

```javascript
<script src="dist/javascripts/commentUi.min.js"></script>
```

The module's API can be accessed using `commentUi` in the global scope.

### Bower and browserify
With bower, simply require the module:

```javascript
var commentUi = require('comment-ui');
```

The module should be built using `browserify` (with `debowerify` and `textrequireify` transforms).

---

## Logging
Logging can be enabled for debugging purposes. It logs using the global 'console' if available (if not, nothing happens and it degrades gracefully).
By default logging is disabled.

###### enableLogging
This method enables logging of the module.

###### disableLogging
This method disables logging of the module.

###### setLoggingLevel
This method sets the logging level. This could be a number from 0 to 4 (where 0 is debug, 4 is error), or a string from the available methods of 'console' (debug, log, info, warn, error).
Default is 3 (warn).

---

## Integrated submodules
The submodules that are exposed are the following:

### Widget
Widget is responsible to coordinate getting initialization data, loading resources and initializing the Ui. While this class implements some of the basic functionality (handling errors, loading timeout), it should be extended by providing an implementation for getting the initialization data and loading the resources.

#### Constructor

```javascript
new commentUi.Widget(config);
```

To create an instance, you need to provide a configuration object. This should have the following structure:

##### Mandatory fields:

- elId: ID of the HTML element in which the widget should be loaded
- articleId: ID of the article, any string
- url: canonical URL of the page
- title: Title of the page

##### Optional fields:

 - timeout: Period of time after a timeout is triggered. Default is 15000 ms (15 sec). Its value should be given in milliseconds (ms).

#### Example

```javascript
new commentUi.Widget({
    elId: 'container_id',
    articleId: 'e113c91c-10d9-11e4-812b-00144feabdc0',
    url: 'http://www.ft.com/cms/s/0/e113c91c-10d9-11e4-812b-00144feabdc0.html',
    title: 'Rolls-Royce seeks to catch-up with rivals on margins - FT.com'
});
```

#### Final methods
###### load
This method will initiate the process of loading the resources that are needed to render the widget and the rendering of the UI. This method uses hook methods which are not implemented in this module, but should be implemented in the module that extends it.
Load will handle errors of the process of loading the widget, also timeout if an error is not clearly available.

This method can be called once (calling it multiple types will have no effect).

#### Abstract methods (not implemented in this module)
###### init
This method is responsible for gathering data that is needed to initialize the widget (e.g. metadata, site ID, comments, etc.).

###### loadResources
This method is responsible for loading resources like JavaScript libraries, stylesheets.

###### render
This method is responsible for rendering the UI of the widget on the page. Render is called when the initialization process is done and all resources are loaded.
This method is called using the data gathered during the init process:

```javascript
render(initData);
```


#### Methods that can be overriden (they have default implementation)
###### onError
This method is responsible to handle any error that appears during the initialization.

```javascript
onError(errorObject);
```

The default implementation clears out the container of the widget and shows the unavailable message template (available using the template object).

###### onTimeout
This method is responsible to handle the case when within a given time the loading isn't finished and no error appeared.

The default implementation clears out the container of the widget and shows the unavailable message template (available using the template object).


#### Extend
Extending of Widget can be done in the following way:

```javascript
var WidgetExtend = function () {
    commentUi.Widget.apply(this, arguments);
}
commentUi.Widget.extend(WidgetExtend);
```

---

### WidgetUi
This class is responsible to handle the UI part of a commenting widget. An instance of this is created within an instance of the `Widget`.
While this implementation has predefined methods, it can be extended with particular UI methods.

#### Constructor
```javascript
new commentUi.WidgetUi(widgetContainer);
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
    commentUi.WidgetUi.apply(this, arguments);
}
commentUi.WidgetUi.extend(WidgetUiExtend);
```

---

### userDialogs
Generic Ui functionality which is common across all istances of the comments. These are mostly dialogs which show on the page and are unrelated of the Widget's container or widget instance.

#### Methods
###### showSetPseudonymDialog
Shows a dialog for setting the initial pseudonym (shown when the user doesn't have a pseudonym set).

```javascript
commentUi.userDialogs.showSetPseudonymDialog({
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
commentUi.userDialogs.showSettingsDialog({
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

### Parameters
All functions has the same callback parameter structure, which should be an object with the following fields:

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

---

### dialog.Dialog
Dialog built within the DOM with custom content. Can be opened either with modal background or without it.

#### Constructor
```javascript
new commentUi.dialog.Dialog(htmlOrForm, userOptions)
```

Where:
 
 - htmlOrForm: plain HTML that is embedded within the dialog, or an instance of `form.Form`.
 - userOptions: object with the following optional fields:

     + modal: whether a modal overlay should be displayed or not. Default is true.
     + title: Title of the dialog

#### Methods

###### on
Listen to events. The only available event within the module is 'close'.

###### off
Removes the event listeners.

###### open
Opens the dialog. This will render the HTML and will embed at the end of the `<body>` element.

###### close
Closes the dialog and removes any HTML created and insterted in the `<body>` element.

###### show
Shows the dialog if it was already opened but is in a hidden state.

###### hide
Hides an already opened dialog without removing the HTML from the `<body>` element.

###### enableButtons
Enables the buttons by removing the disable attributes.

###### disableButtons
Disables the buttons by adding disable attributes.

###### getContainer
Returns the container HTML element.


---

### dialog.modal
Creates a modal overlay background which masks the whole page.

#### Methods
###### open
Creates the HTML needed and inserts as the last element in the <body>.

###### close
Closes the modal and removes the HTML created.

###### on
Listen to events. The only available event is 'click'.

###### off
Remove the listeners.


---

### formBuilder.Form
Form is a helper for creating a form. It handles constructing the form element, generating buttons, forwarding submit and cancel events.

#### Constructor

```javascript
new Form(config);
```

Where config should have the following structure:

```javascript
{
    name: 'name of the form element',
    method: 'method of the form element',
    action: 'action of the form element',
    items: [
        'any html string',
        {
            type: 'a type of an existing form fragment',
            config1: 'any config properties which are used by the form fragment'
        }
    ],
    buttons: [
        {
            type: 'button|submitButton|cancelButton|dismiss',
            label: 'label of the button/dismiss checkbox'
        }
    ]
}
```

#### Methods
###### on
Listen on submit/cancel events.

###### off
Remove listeners.

###### render
Returns an HTML fragment of the form built using the initialization parameters.
The response of this method can be used in the native `appendChild` function.

###### serialize
Returns the data of the form in a JSON format.

###### showError
Shows an error within the form.

###### clearError
Clears the error messages.


### formBuild.formFragments
This helper module contains predefined form fragments that can be used within a Form instance.

#### Methods
###### initialPseudonym
Form fragment for setting the initial pseudonym.

###### changePseudonym
Form fragment for changing an existing pseudonym.

###### emailSettings
Form fragment for changing the email preferences.

###### emailSettingsStandalone
Form fragment for the email alert dialog where email settings is the only fragment that is shown.

###### followExplanation
Explanation of the Follow functionality with images.

###### commentingSettingsExplanation
Explanation of changing the settings with images.

###### sessionExpired
Session expired fragment with sign in link.


---

### templates
This contains common Mustache templates which are compiled and can be rendered with custom data.

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

---

### i18n
i18n is responsible to provide common messages/texts that are used within the commenting application.

It exposes the following objects:
###### texts
Contains generic messages:

- unavailable: Message that is shown when the widget is unavailable
- changePseudonymError: Generic error when changing the pseudonym fails and no error message is coming from the server.
- genericError: Generic error message.
- commetingSettings: label of the commenting settings link "Commenting settings".

###### serviceMessageOverrides
Some error messages that come from the web services are not very user friendly. These messages are mapped to more user friendly versions that can be shown to the user.