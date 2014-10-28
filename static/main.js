(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint browser:true, node:true*/

'use strict';

module.exports = Delegate;

/**
 * DOM event delegator
 *
 * The delegator will listen
 * for events that bubble up
 * to the root node.
 *
 * @constructor
 * @param {Node|string} [root] The root node or a selector string matching the root node
 */
function Delegate(root) {

  /**
   * Maintain a map of listener
   * lists, keyed by event name.
   *
   * @type Object
   */
  this.listenerMap = [{}, {}];
  if (root) {
    this.root(root);
  }

  /** @type function() */
  this.handle = Delegate.prototype.handle.bind(this);
}

/**
 * Start listening for events
 * on the provided DOM element
 *
 * @param  {Node|string} [root] The root node or a selector string matching the root node
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.root = function(root) {
  var listenerMap = this.listenerMap;
  var eventType;

  // Remove master event listeners
  if (this.rootElement) {
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, false);
      }
    }
  }

  // If no root or root is not
  // a dom node, then remove internal
  // root reference and exit here
  if (!root || !root.addEventListener) {
    if (this.rootElement) {
      delete this.rootElement;
    }
    return this;
  }

  /**
   * The root node at which
   * listeners are attached.
   *
   * @type Node
   */
  this.rootElement = root;

  // Set up master event listeners
  for (eventType in listenerMap[1]) {
    if (listenerMap[1].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, true);
    }
  }
  for (eventType in listenerMap[0]) {
    if (listenerMap[0].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, false);
    }
  }

  return this;
};

/**
 * @param {string} eventType
 * @returns boolean
 */
Delegate.prototype.captureForType = function(eventType) {
  return ['blur', 'error', 'focus', 'load', 'resize', 'scroll'].indexOf(eventType) !== -1;
};

/**
 * Attach a handler to one
 * event for all elements
 * that match the selector,
 * now or in the future
 *
 * The handler function receives
 * three arguments: the DOM event
 * object, the node that matched
 * the selector while the event
 * was bubbling and a reference
 * to itself. Within the handler,
 * 'this' is equal to the second
 * argument.
 *
 * The node that actually received
 * the event can be accessed via
 * 'event.target'.
 *
 * @param {string} eventType Listen for these events
 * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
 * @param {function()} handler Handler function - event data passed here will be in event.data
 * @param {Object} [eventData] Data to pass in event.data
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.on = function(eventType, selector, handler, useCapture) {
  var root, listenerMap, matcher, matcherParam;

  if (!eventType) {
    throw new TypeError('Invalid event type: ' + eventType);
  }

  // handler can be passed as
  // the second or third argument
  if (typeof selector === 'function') {
    useCapture = handler;
    handler = selector;
    selector = null;
  }

  // Fallback to sensible defaults
  // if useCapture not set
  if (useCapture === undefined) {
    useCapture = this.captureForType(eventType);
  }

  if (typeof handler !== 'function') {
    throw new TypeError('Handler must be a type of Function');
  }

  root = this.rootElement;
  listenerMap = this.listenerMap[useCapture ? 1 : 0];

  // Add master handler for type if not created yet
  if (!listenerMap[eventType]) {
    if (root) {
      root.addEventListener(eventType, this.handle, useCapture);
    }
    listenerMap[eventType] = [];
  }

  if (!selector) {
    matcherParam = null;

    // COMPLEX - matchesRoot needs to have access to
    // this.rootElement, so bind the function to this.
    matcher = matchesRoot.bind(this);

  // Compile a matcher for the given selector
  } else if (/^[a-z]+$/i.test(selector)) {
    matcherParam = selector;
    matcher = matchesTag;
  } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
    matcherParam = selector.slice(1);
    matcher = matchesId;
  } else {
    matcherParam = selector;
    matcher = matches;
  }

  // Add to the list of listeners
  listenerMap[eventType].push({
    selector: selector,
    handler: handler,
    matcher: matcher,
    matcherParam: matcherParam
  });

  return this;
};

/**
 * Remove an event handler
 * for elements that match
 * the selector, forever
 *
 * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
 * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
 * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.off = function(eventType, selector, handler, useCapture) {
  var i, listener, listenerMap, listenerList, singleEventType;

  // Handler can be passed as
  // the second or third argument
  if (typeof selector === 'function') {
    useCapture = handler;
    handler = selector;
    selector = null;
  }

  // If useCapture not set, remove
  // all event listeners
  if (useCapture === undefined) {
    this.off(eventType, selector, handler, true);
    this.off(eventType, selector, handler, false);
    return this;
  }

  listenerMap = this.listenerMap[useCapture ? 1 : 0];
  if (!eventType) {
    for (singleEventType in listenerMap) {
      if (listenerMap.hasOwnProperty(singleEventType)) {
        this.off(singleEventType, selector, handler);
      }
    }

    return this;
  }

  listenerList = listenerMap[eventType];
  if (!listenerList || !listenerList.length) {
    return this;
  }

  // Remove only parameter matches
  // if specified
  for (i = listenerList.length - 1; i >= 0; i--) {
    listener = listenerList[i];

    if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
      listenerList.splice(i, 1);
    }
  }

  // All listeners removed
  if (!listenerList.length) {
    delete listenerMap[eventType];

    // Remove the main handler
    if (this.rootElement) {
      this.rootElement.removeEventListener(eventType, this.handle, useCapture);
    }
  }

  return this;
};


/**
 * Handle an arbitrary event.
 *
 * @param {Event} event
 */
Delegate.prototype.handle = function(event) {
  var i, l, type = event.type, root, phase, listener, returned, listenerList = [], target, /** @const */ EVENTIGNORE = 'ftLabsDelegateIgnore';

  if (event[EVENTIGNORE] === true) {
    return;
  }

  target = event.target;

  // Hardcode value of Node.TEXT_NODE
  // as not defined in IE8
  if (target.nodeType === 3) {
    target = target.parentNode;
  }

  root = this.rootElement;

  phase = event.eventPhase || ( event.target !== event.currentTarget ? 3 : 2 );
  
  switch (phase) {
    case 1: //Event.CAPTURING_PHASE:
      listenerList = this.listenerMap[1][type];
    break;
    case 2: //Event.AT_TARGET:
      if (this.listenerMap[0] && this.listenerMap[0][type]) listenerList = listenerList.concat(this.listenerMap[0][type]);
      if (this.listenerMap[1] && this.listenerMap[1][type]) listenerList = listenerList.concat(this.listenerMap[1][type]);
    break;
    case 3: //Event.BUBBLING_PHASE:
      listenerList = this.listenerMap[0][type];
    break;
  }

  // Need to continuously check
  // that the specific list is
  // still populated in case one
  // of the callbacks actually
  // causes the list to be destroyed.
  l = listenerList.length;
  while (target && l) {
    for (i = 0; i < l; i++) {
      listener = listenerList[i];

      // Bail from this loop if
      // the length changed and
      // no more listeners are
      // defined between i and l.
      if (!listener) {
        break;
      }

      // Check for match and fire
      // the event if there's one
      //
      // TODO:MCG:20120117: Need a way
      // to check if event#stopImmediatePropagation
      // was called. If so, break both loops.
      if (listener.matcher.call(target, listener.matcherParam, target)) {
        returned = this.fire(event, target, listener);
      }

      // Stop propagation to subsequent
      // callbacks if the callback returned
      // false
      if (returned === false) {
        event[EVENTIGNORE] = true;
        event.preventDefault();
        return;
      }
    }

    // TODO:MCG:20120117: Need a way to
    // check if event#stopPropagation
    // was called. If so, break looping
    // through the DOM. Stop if the
    // delegation root has been reached
    if (target === root) {
      break;
    }

    l = listenerList.length;
    target = target.parentElement;
  }
};

/**
 * Fire a listener on a target.
 *
 * @param {Event} event
 * @param {Node} target
 * @param {Object} listener
 * @returns {boolean}
 */
Delegate.prototype.fire = function(event, target, listener) {
  return listener.handler.call(target, event, target);
};

/**
 * Check whether an element
 * matches a generic selector.
 *
 * @type function()
 * @param {string} selector A CSS selector
 */
var matches = (function(el) {
  if (!el) return;
  var p = el.prototype;
  return (p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector);
}(Element));

/**
 * Check whether an element
 * matches a tag selector.
 *
 * Tags are NOT case-sensitive,
 * except in XML (and XML-based
 * languages such as XHTML).
 *
 * @param {string} tagName The tag name to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesTag(tagName, element) {
  return tagName.toLowerCase() === element.tagName.toLowerCase();
}

/**
 * Check whether an element
 * matches the root.
 *
 * @param {?String} selector In this case this is always passed through as null and not used
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesRoot(selector, element) {
  /*jshint validthis:true*/
  if (this.rootElement === window) return element === document;
  return this.rootElement === element;
}

/**
 * Check whether the ID of
 * the element in 'this'
 * matches the given ID.
 *
 * IDs are case-sensitive.
 *
 * @param {string} id The ID to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesId(id, element) {
  return id === element.id;
}

/**
 * Short hand for off()
 * and root(), ie both
 * with no parameters
 *
 * @return void
 */
Delegate.prototype.destroy = function() {
  this.off();
  this.root();
};

},{}],2:[function(require,module,exports){
'use strict';

var reqwest = require("./../reqwest/reqwest.js");
var Delegate = require("./../dom-delegate/lib/delegate.js");
var header = document.querySelector('.o-header');
var myFt = document.querySelector('.o-header__secondary--myft-js');
var myFTButton = header.querySelector('.o-header-button-js[data-target-panel="myft"]');
var defaultPanel = header.getAttribute('data-default-panel');
var delegate = new Delegate(header);
var bodyDelegate = new Delegate();
var Notify = require('./src/js/Notify');
var nextUserPreferences = require("./../next-user-preferences/src/main.js");

delegate.on('click', '.o-header-button-js', function(event) {
	event.preventDefault();
	event.stopPropagation();

	// HACK
	var targetPanel = event.target.getAttribute('data-target-panel')
		|| event.target.parentNode.getAttribute('data-target-panel')
		|| defaultPanel;
	var currentPanel = header.getAttribute('data-panel');
	if (currentPanel !== targetPanel && targetPanel !== defaultPanel) {
		bodyDelegate.root(document.body);
		header.setAttribute('data-panel', targetPanel);
	} else {
		bodyDelegate.root();
		if (defaultPanel) {
			header.setAttribute('data-panel', defaultPanel);
		} else {
			header.removeAttribute('data-panel');
		}
	}
});

delegate.on('click', function(event) {
	event.stopPropagation();
});

bodyDelegate.on('click', function(event) {
	event.preventDefault();
	event.stopPropagation();
	if (defaultPanel) {
		header.setAttribute('data-panel', defaultPanel);
	} else {
		header.removeAttribute('data-panel');
	}
});

document.addEventListener('notifications:load', function(e) {
	var total = 0, 
			notifications = e.detail;
	for(var stream in notifications) {
		if(notifications[stream]) {
			total += notifications[stream].length;
		}
	}
	if(total > 0) {
		if(myFTButton.getElementsByClassName('notify-badge').length) {
			myFTButton.getElementsByClassName('notify-badge')[0].textContent = total;
		} else {
			myFTButton.insertAdjacentHTML('beforeend', '<span class="notify-badge">'+total + '</span>')
		}
	}
});

document.addEventListener('notifications:new', function(e) {
	var total = 0, 
			data = e.detail;
	
	var id = data.notifications[0].item;
	reqwest({
		url: '/' + id,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		}
	}).then(function(res) {
		new Notify({
			title: 'New article in ' + data.stream.displayText,
			body: res.headline,
			lifespan: 1000 * 10,
			onclick: function() {
				location.href = '/' + res.id
			}
		}).show();
	}).fail(function(err) {
		new Notify({
			title: 'New article in ' + data.stream.displayText,
			lifespan: 1000 * 10,
			onclick: function() {
				location.href = '/' + data.notifications[0].item
			}
		}).show();
	});


});



function transitionMyFTButton (type) {

	function listener() {
		myFTButton.classList.remove('transitioning');
		myFTButton.removeEventListener('transitionend', listener);
	};

	myFTButton.addEventListener('transitionend', listener);
	myFTButton.classList.add('transitioning');
	myFTButton.classList.add('myft--' + type);
	myFTButton.offsetWidth; //forces repaint

	myFTButton.classList.remove('myft--' + type);
}

document.addEventListener('favourites:add', function (e) {
	transitionMyFTButton('add-favourite');
});

document.addEventListener('favourites:remove', function (e) {
	transitionMyFTButton('remove-favourite');
});

reqwest('http://next-companies-et-al.herokuapp.com/v1/ubernav.json', function(resp) {
	var data = resp.data;
	header.querySelector('.o-header__secondary--menu-js').innerHTML = '<ul class="uber-index">'
		+ data.map(function(item) {
		return '<li class="uber-index__title" data-o-grid-colspan="6 M6 L3 XL3">'
			+ '<a href="' + item.nextUrl + '">' + item.title + '</a>'
			+ '<ul class="uber-index__children">'
			+ item.navigationItems.map(function(child) {
				return '<li class="uber-index__child"><a href="' + child.nextUrl + '">' + child.title + '</a></li>';
			}).join('')
			+ '</ul>'
			+ '</li>';
		}).join('');
		+ '</ul>';
});

if (myFt) nextUserPreferences.init(myFt, { notify: true });

},{"./../dom-delegate/lib/delegate.js":1,"./../next-user-preferences/src/main.js":7,"./../reqwest/reqwest.js":9,"./src/js/Notify":3}],3:[function(require,module,exports){
/**
 * Message the user
 *
 * > new Notify({ html: "You've got mail", lifespace: 10000 }).show();
 *
 * TODO
 *
 *  - UX to deal with multiple messages.
 *  - W3 / Chrome desktop notifications permission.
 *  - Acknowledgement UX
 *
 */
var Notify = function (message) {
    this.template = '<h3 class="message__title">' + message.title + '<i class="message__close icon icon__close"></i></h3><span class="message__body">' + message.body + '</span>';
    this.lifespan = message.lifespan || 5000;
    this.dom = document.createElement('div');
    this.dom.className = 'message__container'
    this.dom.innerHTML = this.template; 
    this.hasDesktopPermission = false;
    this.root = document.body;
    this.message = message;
};

function createNotification(message) {
    var notification = new Notification(message.title, {body: message.body});
    notification.addEventListener('click', message.onclick);
    return notification;
}

Notify.prototype.show = function () {
    
    var self = this;
    // granted
    //TODO - enable this again once we've thought about the UX!
    if (false && window.Notification && Notification.permission === "granted") {
        createNotification(self.message);
    } else if (false && window.Notification && Notification.permission !== "denied") {
      
        Notification.requestPermission(function (status) {
            if (Notification.permission !== status) {
                Notification.permission = status;
            }

            // granted
            if (status === "granted") {
                createNotification(self.message);
            } else {
                self.showHtmlNotification();    
            }
        });
    // denied
    } else {
        this.showHtmlNotification();    
    }
};

Notify.prototype.destroy = function () {
    // FIXME forget if I need to remove event listener :)
    this.dom.parentNode.removeChild(this.dom);
};

Notify.prototype.showHtmlNotification = function () {

    var self = this;

    this.root.appendChild(this.dom);

    // Automatically destroy the box after a few seconds
    var selfDestruct = setTimeout(function () {
        self.destroy();
    }, this.lifespan); 

    // Acknowledgment UI
    this.dom.querySelector('.message__close').addEventListener('click', function () {
        self.destroy();
        clearTimeout(selfDestruct);
    });

    this.dom.addEventListener('click', function (e) {
        if(e.target.className.indexOf('message__close') >= 0) {
            return;
        }
        self.message.onclick();
        self.destroy();
        clearTimeout(selfDestruct);
    });

};

module.exports = Notify;
},{}],4:[function(require,module,exports){
// Stores a unique list of things (Eg, sections, favourites, history) against a
// key in localStorage

var reqwest = require('../vendor/reqwest.min');

var API_URL = 'http://ft-next-api-user-prefs.herokuapp.com/user/';

var emit = function(name, data) {
  var event = document.createEvent('Event');
  event.initEvent(name, true, true);
  if (data) {
    event.detail = data;
  }
  top.document.dispatchEvent(event);
};


var Me = function (key, userId) {
  if (!key) {
    throw new Error('You must supply a key /^[a-z]+$/');
  }
  this.key = key;

  this.localStorageKey = 'ft.next.user.' + key;

  if(userId) {
    this.apiURL = API_URL + key;
    this.userId = userId;
  }      
    //Start off with local copy...
    this.val = this.getOrCreate();
    //Then try and fetch server copy
    this.fetch();

  };

  Me.prototype.get = function (key) {
    key = key || this.localStorageKey;
    var exists = localStorage.getItem(key);
    if (exists) {
      return JSON.parse(exists);
    } else {
      return false;
    }
  };

  Me.prototype.getOrCreate = function (key) {
    key = key || this.localStorageKey;
    var saved = this.get(key);
    if(saved) {
      return saved;
    } else {
      var empty = [];
      localStorage.setItem(key, JSON.stringify(empty));
      return empty;
    }
  };

  Me.prototype.fetch = function() {

    var me = this;

    //If no userID don't fetch from server
    if(!this.userId) {
      return;
    }

    reqwest({
      url: this.apiURL,
      type: 'json',
      method: 'get',
      headers: {
        'X-FT-UID': this.userId
      },
      crossOrigin: true
    }).then(function(faves) {
      if(faves) {
        me.val = faves;
        //accept the server copy as 'the truth'...
        me.save(me.val);
        //but then process any leftover requests locally
        me.processPending('add');
        me.processPending('remove');
        me.processPending('clear');
      }
    }).always(function(err) {
      //trigger load and update events
      emit(me.key + ':load', me);
      emit(me.key + ':update', me);
    });  
  };

  Me.prototype.save = function (obj, key) {
    key = key || this.localStorageKey;
    if(obj && obj.length) {
      localStorage.setItem(key, JSON.stringify(obj)); 
    } else {
      localStorage.removeItem(key);
    }
  };

  Me.prototype.addPending = function(obj, action) {
    var pending = this.getOrCreate(this.localStorageKey + '.' + action);
    pending.push(obj);
    //if we're adding something, then get rid of any pending clear requests
    if(action === 'add') {
      localStorage.removeItem(this.localStorageKey + '.clear');
    }
    this.save(pending, this.localStorageKey + '.' + action);
  };

  Me.prototype.processPending = function(action) {
    var me = this;
    var pending = this.get(this.localStorageKey + '.' + action);
    if(pending && pending.length) {
      //Clear is a special case
      if(action === 'clear') {
        if(pending[pending.length - 1] === true) {
          me.clear();
          pending = null;
        }
      } else {
        pending.forEach(function(itemToAdd, index) {
           // remove the item from the todo list and execute the action 
           pending.splice(index, 1);
           me[action](itemToAdd);
         });
      }
      this.save(pending, this.localStorageKey + '.' + action);
    }

  };

  Me.prototype.add = function (obj) {
    var me = this;
    this.val = this.getOrCreate();
    if (!this.exists(obj.uuidv3)) {
      this.val.push(obj);
      this.save(this.val);
      emit(me.key + ':update', me); //trigger event to render UI

      //Send a request to add to server
      if(this.apiURL) {
        reqwest({
          url: this.apiURL,
          method: 'put',
          type: 'json',
          contentType: 'application/json',
          data: JSON.stringify(obj),
          headers: {
            'X-FT-UID': this.userId
          },
          crossOrigin: true
        }).fail(function() {
          me.addPending(obj, 'add'); //server request failed so push it to the list of pending
        });
      }
    }
  };

  Me.prototype.remove = function (obj) {
    var me = this;

    this.val = this.getOrCreate();
    this.val = this.val.filter(function(item) {
      return (item.uuidv3 !== obj.uuidv3);
    });
    this.save(this.val);

    emit(me.key + ':update', me); //trigger event to render UI

    //Send a request to delete from server
    if(this.apiURL) {

      reqwest({
        url: this.apiURL + '/' + encodeURI(decodeURI(obj.uuidv3)),
        type: 'json',
        method: 'delete',
        headers: {
          'X-FT-UID': this.userId
        },
        crossOrigin: true
      }).fail(function() {
        me.addPending(obj, 'remove');  //server request failed so push it to the list of pending
      });
    }
  };


  Me.prototype.exists = function (uuid) {
    this.val = this.getOrCreate();
    return this.val.some(function (item) {
      return item.uuidv3 === uuid;
    });
  };

  Me.prototype.clear = function () {
    var me = this;
    var status = localStorage.removeItem(this.localStorageKey);
    this.val = [];

    emit(me.key + ':update', me); //trigger event to render UI

      //Send a request to delete ALL from server
      if(this.apiURL) {

        reqwest({
          url: this.apiURL,
          type: 'json',
          method: 'delete',
          headers: {
            'X-FT-UID': this.userId
          },
          crossOrigin: true
        }).fail(function() {
          me.addPending(true, 'clear');
        });
      }

      return status;
    };


    module.exports = Me;


},{"../vendor/reqwest.min":8}],5:[function(require,module,exports){
var reqwest = require('../vendor/reqwest.min');


var NOTIFICATIONS_URL = 'http://ft-next-api-user-prefs.herokuapp.com/user/notifications/';
var emit = function(name, data) {
	var event = document.createEvent('Event');
	event.initEvent(name, true, true);
	if (data) {
		event.detail = data;
	}
	top.document.dispatchEvent(event);
};


function extractSearchTerm(queryString) {
    return queryString.match(/q=([^&]*)/)[1];
}

var getCurrentStream = function() {
  var onArticle = /^\/[a-f0-9]+-(.*)/.test(location.pathname); // '27a5e286-4314-11e4-8a43-00144feabdc0'; 
  if(onArticle || location.pathname.indexOf('/search') !== 0) { //hacky way to exclude homepage!
  	return false;
  } else {
  	return extractSearchTerm(location.search);
  }
};


function NotificationPoller(userPreferenceList) {
	this.userPreferenceList = userPreferenceList;
	setInterval(this.poll.bind(this), 1000 * 60 * 0.2); //30 second polling
	this.notifications = {};

	//Clear notifications if a stream has been openend
	this.currentStream = getCurrentStream();
	if(location.pathname.indexOf('/favourites') >= 0) {
		this.clear()
	} else if(this.currentStream) {
		this.clear(this.currentStream);
	}

	this.poll(true); //pass flag to indicate this is the first load

}

NotificationPoller.prototype.poll = function(firstLoad) {
	var poller = this;
	var notificationPromises = [];
	var newNotifications;
	this.userPreferenceList.list.get().forEach(function(stream) {
		//don't bother fetching if you are on that stream currently
		(function(stream) {
			if(stream.resourceType !== 'stream') {
				return false;
			}
			notificationPromises.push(reqwest({
				url: NOTIFICATIONS_URL + stream.uuidv3,
				type: 'json',
				method: 'get',
				headers: {
					'X-FT-UID': poller.userPreferenceList.userId
				},
				crossOrigin: true
			}).then(function(notifications) {
				if(notifications && notifications.length) {

					//If the stream is currently open, emit an event with the notifications, and then clear them
					// (but only do this once)
					if(firstLoad && stream.uuidv3 === poller.currentStream) {
						emit('notifications:opened', { uuidv3: stream.uuidv3, notifications: notifications });
						poller.clear(stream.uuidv3);
					}

					newNotifications = filterNew(poller.notifications[stream.uuidv3], notifications);

					if(!firstLoad && newNotifications.length) {
						emit('notifications:new', { stream: stream, notifications: newNotifications });
					}
					poller.notifications[stream.uuidv3] = notifications;

				} else {
					delete poller.notifications[stream.uuidv3];
				}
				poller.render();
			}));

		}(stream))
		
	});

	Promise.all(notificationPromises).then(function(streamNotifications) {
		if(poller.notifications) {
			emit('notifications:load', poller.notifications);
		}
	});
};

function filterNew(originalList, newList) {
	originalList = originalList || [];
	newList = newList || [];
	var originalIds = originalList.map(function(item) { return item.id; });
	return newList.filter(function(notif) { return (originalIds.indexOf(notif.id) < 0); });
}

function renderBadge(el, number) {
	var badge = el.getElementsByClassName('js-notify-badge')[0];
	if(!badge) {
		badge = document.createElement('span');
		badge.className = 'notify-badge js-notify-badge';
		el.appendChild(badge);
	}
	if(number > 0) {
		badge.removeAttribute('aria-hidden');
		badge.textContent = number;
	} else {
		badge.setAttribute('aria-hidden', '');
	}
}

NotificationPoller.prototype.render = function() {
	for(var stream in this.notifications) {
		link = this.userPreferenceList.container.querySelector('[href="/search?q=' + stream + '"]');
		if(link) {
			renderBadge(link, this.notifications[stream].length);
		}
	}
};

NotificationPoller.prototype.clear = function(uuid) {
	if(uuid) {
		this.notifications[uuid] = [];
		reqwest({
			url: NOTIFICATIONS_URL + uuid,
			type: 'json',
			method: 'delete',
			headers: {
				'X-FT-UID': this.userPreferenceList.userId
			},
			crossOrigin: true
		});
	} else if (typeof uuid === 'undefined') {
		this.notifications = {};
	}
	this.render();
};

module.exports = NotificationPoller;
},{"../vendor/reqwest.min":8}],6:[function(require,module,exports){
var NotificationPoller = require('./NotificationPoller');
var Me = require('./Me');

var $ = function (selector) {
  return [].slice.call(document.querySelectorAll(selector));
};
var emit = function(name, data) {
  var event = document.createEvent('Event');
  event.initEvent(name, true, true);
  if (data) {
    event.detail = data;
  }
  top.document.dispatchEvent(event);
};

var getUserId = function() {
  var value = "; " + document.cookie;
  var parts = value.split("; FT_U=");
  var ftU = parts.pop().split(";").shift();
  if(ftU) {
    return ftU.match(/_EID=(\d+)_PID/)[1];
  } else {
    return;
  }
};

var UserPreferenceList = function(container, opts) {
  var self = this;
  this.userId = getUserId();
  this.key = container.getAttribute('data-user-preference-list');
  this.container = container;
  this.notify = opts.notify;

};

UserPreferenceList.prototype.init = function() {
  var self = this;
  if(!this.userId) {
    this.render();
  }

  document.addEventListener(this.key + ':add', function(ev) {
    self.add(ev.detail);
  });
  document.addEventListener(this.key + ':remove', function(ev) {
    self.remove(ev.detail);
  });

  document.addEventListener(this.key + ':clear', this.clear.bind(this));
  document.addEventListener(this.key + ':update', this.render.bind(this));

  $('[data-list-source="' + this.key + '"] .clear__button').map(function (el) {
    el.addEventListener('click', self.clear.bind(self));
  });

  this.list = new Me(this.key, this.userId);

  if(this.notify === true) {
    this.notifier = new NotificationPoller(this);
  }
}

UserPreferenceList.prototype.render = function() {
  var me = this;
  var href = '';

  var links = this.list ? this.list.getOrCreate().reverse() : [];

  var linksHTML = links.map(function (section) {
    href = section.resourceType === 'stream' ? '/search?q=' + section.uuidv3 : '/' + section.uuidv3;
    return '<li class="item-type--' + section.resourceType + '"><a href="' + href + '">' + section.displayText + '</a></li>';
  }).join('');
  
  if(this.container) {
    this.container.innerHTML =  linksHTML;
  }
  if(this.notifier) {
    this.notifier.render();
  }
};


UserPreferenceList.prototype.add = function(obj) {
  this.list.add(obj);
};

UserPreferenceList.prototype.remove = function(obj) {
  this.list.remove(obj);
};

UserPreferenceList.prototype.clear = function() {
  this.list.clear();
};

UserPreferenceList.init = function(rootEl, opts) {
  var components = {}, 
      fEls, 
      c, l, 
      component;

  rootEl = rootEl || document.body;
  //set config with overrides passed through

  if (rootEl.querySelectorAll) {
    fEls = rootEl.querySelectorAll('[data-user-preference-list]');
    for (c = 0, l = fEls.length; c < l; c++) {
      if (!fEls[c].hasAttribute('data-o-author-alerts--js')) {
        component = new UserPreferenceList(fEls[c], opts || {});
        component.init(opts);
        components[fEls[c].getAttribute('data-user-preference-list')] = component;
      }
    }
  }

  return components;
};


module.exports = UserPreferenceList;

},{"./Me":4,"./NotificationPoller":5}],7:[function(require,module,exports){
var UserPreferenceList = require('./lib/UserPreferenceList');

module.exports = UserPreferenceList;
},{"./lib/UserPreferenceList":6}],8:[function(require,module,exports){
/*!
  * Reqwest! A general purpose XHR connection manager
  * license MIT (c) Dustin Diaz 2014
  * https://github.com/ded/reqwest
  */
!function(e,t,n){typeof module!="undefined"&&module.exports?module.exports=n():typeof define=="function"&&define.amd?define(n):t[e]=n()}("reqwest",this,function(){function succeed(e){return httpsRe.test(window.location.protocol)?twoHundo.test(e.status):!!e.response}function handleReadyState(e,t,n){return function(){if(e._aborted)return n(e.request);e.request&&e.request[readyState]==4&&(e.request.onreadystatechange=noop,succeed(e.request)?t(e.request):n(e.request))}}function setHeaders(e,t){var n=t.headers||{},r;n.Accept=n.Accept||defaultHeaders.accept[t.type]||defaultHeaders.accept["*"];var i=typeof FormData=="function"&&t.data instanceof FormData;!t.crossOrigin&&!n[requestedWith]&&(n[requestedWith]=defaultHeaders.requestedWith),!n[contentType]&&!i&&(n[contentType]=t.contentType||defaultHeaders.contentType);for(r in n)n.hasOwnProperty(r)&&"setRequestHeader"in e&&e.setRequestHeader(r,n[r])}function setCredentials(e,t){typeof t.withCredentials!="undefined"&&typeof e.withCredentials!="undefined"&&(e.withCredentials=!!t.withCredentials)}function generalCallback(e){lastValue=e}function urlappend(e,t){return e+(/\?/.test(e)?"&":"?")+t}function handleJsonp(e,t,n,r){var i=uniqid++,s=e.jsonpCallback||"callback",o=e.jsonpCallbackName||reqwest.getcallbackPrefix(i),u=new RegExp("((^|\\?|&)"+s+")=([^&]+)"),a=r.match(u),f=doc.createElement("script"),l=0,c=navigator.userAgent.indexOf("MSIE 10.0")!==-1;return a?a[3]==="?"?r=r.replace(u,"$1="+o):o=a[3]:r=urlappend(r,s+"="+o),win[o]=generalCallback,f.type="text/javascript",f.src=r,f.async=!0,typeof f.onreadystatechange!="undefined"&&!c&&(f.htmlFor=f.id="_reqwest_"+i),f.onload=f.onreadystatechange=function(){if(f[readyState]&&f[readyState]!=="complete"&&f[readyState]!=="loaded"||l)return!1;f.onload=f.onreadystatechange=null,f.onclick&&f.onclick(),t(lastValue),lastValue=undefined,head.removeChild(f),l=1},head.appendChild(f),{abort:function(){f.onload=f.onreadystatechange=null,n({},"Request is aborted: timeout",{}),lastValue=undefined,head.removeChild(f),l=1}}}function getRequest(e,t){var n=this.o,r=(n.method||"GET").toUpperCase(),i=typeof n=="string"?n:n.url,s=n.processData!==!1&&n.data&&typeof n.data!="string"?reqwest.toQueryString(n.data):n.data||null,o,u=!1;return(n["type"]=="jsonp"||r=="GET")&&s&&(i=urlappend(i,s),s=null),n["type"]=="jsonp"?handleJsonp(n,e,t,i):(o=n.xhr&&n.xhr(n)||xhr(n),o.open(r,i,n.async===!1?!1:!0),setHeaders(o,n),setCredentials(o,n),win[xDomainRequest]&&o instanceof win[xDomainRequest]?(o.onload=e,o.onerror=t,o.onprogress=function(){},u=!0):o.onreadystatechange=handleReadyState(this,e,t),n.before&&n.before(o),u?setTimeout(function(){o.send(s)},200):o.send(s),o)}function Reqwest(e,t){this.o=e,this.fn=t,init.apply(this,arguments)}function setType(e){if(e.match("json"))return"json";if(e.match("javascript"))return"js";if(e.match("text"))return"html";if(e.match("xml"))return"xml"}function init(o,fn){function complete(e){o.timeout&&clearTimeout(self.timeout),self.timeout=null;while(self._completeHandlers.length>0)self._completeHandlers.shift()(e)}function success(resp){var type=o.type||setType(resp.getResponseHeader("Content-Type"));resp=type!=="jsonp"?self.request:resp;var filteredResponse=globalSetupOptions.dataFilter(resp.responseText,type),r=filteredResponse;try{resp.responseText=r}catch(e){}if(r)switch(type){case"json":try{resp=win.JSON?win.JSON.parse(r):eval("("+r+")")}catch(err){return error(resp,"Could not parse JSON in response",err)}break;case"js":resp=eval(r);break;case"html":resp=r;break;case"xml":resp=resp.responseXML&&resp.responseXML.parseError&&resp.responseXML.parseError.errorCode&&resp.responseXML.parseError.reason?null:resp.responseXML}self._responseArgs.resp=resp,self._fulfilled=!0,fn(resp),self._successHandler(resp);while(self._fulfillmentHandlers.length>0)resp=self._fulfillmentHandlers.shift()(resp);complete(resp)}function error(e,t,n){e=self.request,self._responseArgs.resp=e,self._responseArgs.msg=t,self._responseArgs.t=n,self._erred=!0;while(self._errorHandlers.length>0)self._errorHandlers.shift()(e,t,n);complete(e)}this.url=typeof o=="string"?o:o.url,this.timeout=null,this._fulfilled=!1,this._successHandler=function(){},this._fulfillmentHandlers=[],this._errorHandlers=[],this._completeHandlers=[],this._erred=!1,this._responseArgs={};var self=this;fn=fn||function(){},o.timeout&&(this.timeout=setTimeout(function(){self.abort()},o.timeout)),o.success&&(this._successHandler=function(){o.success.apply(o,arguments)}),o.error&&this._errorHandlers.push(function(){o.error.apply(o,arguments)}),o.complete&&this._completeHandlers.push(function(){o.complete.apply(o,arguments)}),this.request=getRequest.call(this,success,error)}function reqwest(e,t){return new Reqwest(e,t)}function normalize(e){return e?e.replace(/\r?\n/g,"\r\n"):""}function serial(e,t){var n=e.name,r=e.tagName.toLowerCase(),i=function(e){e&&!e.disabled&&t(n,normalize(e.attributes.value&&e.attributes.value.specified?e.value:e.text))},s,o,u,a;if(e.disabled||!n)return;switch(r){case"input":/reset|button|image|file/i.test(e.type)||(s=/checkbox/i.test(e.type),o=/radio/i.test(e.type),u=e.value,(!s&&!o||e.checked)&&t(n,normalize(s&&u===""?"on":u)));break;case"textarea":t(n,normalize(e.value));break;case"select":if(e.type.toLowerCase()==="select-one")i(e.selectedIndex>=0?e.options[e.selectedIndex]:null);else for(a=0;e.length&&a<e.length;a++)e.options[a].selected&&i(e.options[a])}}function eachFormElement(){var e=this,t,n,r=function(t,n){var r,i,s;for(r=0;r<n.length;r++){s=t[byTag](n[r]);for(i=0;i<s.length;i++)serial(s[i],e)}};for(n=0;n<arguments.length;n++)t=arguments[n],/input|select|textarea/i.test(t.tagName)&&serial(t,e),r(t,["input","select","textarea"])}function serializeQueryString(){return reqwest.toQueryString(reqwest.serializeArray.apply(null,arguments))}function serializeHash(){var e={};return eachFormElement.apply(function(t,n){t in e?(e[t]&&!isArray(e[t])&&(e[t]=[e[t]]),e[t].push(n)):e[t]=n},arguments),e}function buildParams(e,t,n,r){var i,s,o,u=/\[\]$/;if(isArray(t))for(s=0;t&&s<t.length;s++)o=t[s],n||u.test(e)?r(e,o):buildParams(e+"["+(typeof o=="object"?s:"")+"]",o,n,r);else if(t&&t.toString()==="[object Object]")for(i in t)buildParams(e+"["+i+"]",t[i],n,r);else r(e,t)}var win=window,doc=document,httpsRe=/^http/,twoHundo=/^(20\d|1223)$/,byTag="getElementsByTagName",readyState="readyState",contentType="Content-Type",requestedWith="X-Requested-With",head=doc[byTag]("head")[0],uniqid=0,callbackPrefix="reqwest_"+ +(new Date),lastValue,xmlHttpRequest="XMLHttpRequest",xDomainRequest="XDomainRequest",noop=function(){},isArray=typeof Array.isArray=="function"?Array.isArray:function(e){return e instanceof Array},defaultHeaders={contentType:"application/x-www-form-urlencoded",requestedWith:xmlHttpRequest,accept:{"*":"text/javascript, text/html, application/xml, text/xml, */*",xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript",js:"application/javascript, text/javascript"}},xhr=function(e){if(e.crossOrigin===!0){var t=win[xmlHttpRequest]?new XMLHttpRequest:null;if(t&&"withCredentials"in t)return t;if(win[xDomainRequest])return new XDomainRequest;throw new Error("Browser does not support cross-origin requests")}return win[xmlHttpRequest]?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP")},globalSetupOptions={dataFilter:function(e){return e}};return Reqwest.prototype={abort:function(){this._aborted=!0,this.request.abort()},retry:function(){init.call(this,this.o,this.fn)},then:function(e,t){return e=e||function(){},t=t||function(){},this._fulfilled?this._responseArgs.resp=e(this._responseArgs.resp):this._erred?t(this._responseArgs.resp,this._responseArgs.msg,this._responseArgs.t):(this._fulfillmentHandlers.push(e),this._errorHandlers.push(t)),this},always:function(e){return this._fulfilled||this._erred?e(this._responseArgs.resp):this._completeHandlers.push(e),this},fail:function(e){return this._erred?e(this._responseArgs.resp,this._responseArgs.msg,this._responseArgs.t):this._errorHandlers.push(e),this},"catch":function(e){return this.fail(e)}},reqwest.serializeArray=function(){var e=[];return eachFormElement.apply(function(t,n){e.push({name:t,value:n})},arguments),e},reqwest.serialize=function(){if(arguments.length===0)return"";var e,t,n=Array.prototype.slice.call(arguments,0);return e=n.pop(),e&&e.nodeType&&n.push(e)&&(e=null),e&&(e=e.type),e=="map"?t=serializeHash:e=="array"?t=reqwest.serializeArray:t=serializeQueryString,t.apply(null,n)},reqwest.toQueryString=function(e,t){var n,r,i=t||!1,s=[],o=encodeURIComponent,u=function(e,t){t="function"==typeof t?t():t==null?"":t,s[s.length]=o(e)+"="+o(t)};if(isArray(e))for(r=0;e&&r<e.length;r++)u(e[r].name,e[r].value);else for(n in e)e.hasOwnProperty(n)&&buildParams(n,e[n],i,u);return s.join("&").replace(/%20/g,"+")},reqwest.getcallbackPrefix=function(){return callbackPrefix},reqwest.compat=function(e,t){return e&&(e.type&&(e.method=e.type)&&delete e.type,e.dataType&&(e.type=e.dataType),e.jsonpCallback&&(e.jsonpCallbackName=e.jsonpCallback)&&delete e.jsonpCallback,e.jsonp&&(e.jsonpCallback=e.jsonp)),new Reqwest(e,t)},reqwest.ajaxSetup=function(e){e=e||{};for(var t in e)globalSetupOptions[t]=e[t]},reqwest})
},{}],9:[function(require,module,exports){
/*!
  * Reqwest! A general purpose XHR connection manager
  * license MIT (c) Dustin Diaz 2014
  * https://github.com/ded/reqwest
  */

!function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
}('reqwest', this, function () {

  var win = window
    , doc = document
    , httpsRe = /^http/
    , protocolRe = /(^\w+):\/\//
    , twoHundo = /^(20\d|1223)$/ //http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
    , byTag = 'getElementsByTagName'
    , readyState = 'readyState'
    , contentType = 'Content-Type'
    , requestedWith = 'X-Requested-With'
    , head = doc[byTag]('head')[0]
    , uniqid = 0
    , callbackPrefix = 'reqwest_' + (+new Date())
    , lastValue // data stored by the most recent JSONP callback
    , xmlHttpRequest = 'XMLHttpRequest'
    , xDomainRequest = 'XDomainRequest'
    , noop = function () {}

    , isArray = typeof Array.isArray == 'function'
        ? Array.isArray
        : function (a) {
            return a instanceof Array
          }

    , defaultHeaders = {
          'contentType': 'application/x-www-form-urlencoded'
        , 'requestedWith': xmlHttpRequest
        , 'accept': {
              '*':  'text/javascript, text/html, application/xml, text/xml, */*'
            , 'xml':  'application/xml, text/xml'
            , 'html': 'text/html'
            , 'text': 'text/plain'
            , 'json': 'application/json, text/javascript'
            , 'js':   'application/javascript, text/javascript'
          }
      }

    , xhr = function(o) {
        // is it x-domain
        if (o['crossOrigin'] === true) {
          var xhr = win[xmlHttpRequest] ? new XMLHttpRequest() : null
          if (xhr && 'withCredentials' in xhr) {
            return xhr
          } else if (win[xDomainRequest]) {
            return new XDomainRequest()
          } else {
            throw new Error('Browser does not support cross-origin requests')
          }
        } else if (win[xmlHttpRequest]) {
          return new XMLHttpRequest()
        } else {
          return new ActiveXObject('Microsoft.XMLHTTP')
        }
      }
    , globalSetupOptions = {
        dataFilter: function (data) {
          return data
        }
      }

  function succeed(r) {
    var protocol = protocolRe.exec(r.url);
    protocol = (protocol && protocol[1]) || window.location.protocol;
    return httpsRe.test(protocol) ? twoHundo.test(r.request.status) : !!r.request.response;
  }

  function handleReadyState(r, success, error) {
    return function () {
      // use _aborted to mitigate against IE err c00c023f
      // (can't read props on aborted request objects)
      if (r._aborted) return error(r.request)
      if (r.request && r.request[readyState] == 4) {
        r.request.onreadystatechange = noop
        if (succeed(r)) success(r.request)
        else
          error(r.request)
      }
    }
  }

  function setHeaders(http, o) {
    var headers = o['headers'] || {}
      , h

    headers['Accept'] = headers['Accept']
      || defaultHeaders['accept'][o['type']]
      || defaultHeaders['accept']['*']

    var isAFormData = typeof FormData === 'function' && (o['data'] instanceof FormData);
    // breaks cross-origin requests with legacy browsers
    if (!o['crossOrigin'] && !headers[requestedWith]) headers[requestedWith] = defaultHeaders['requestedWith']
    if (!headers[contentType] && !isAFormData) headers[contentType] = o['contentType'] || defaultHeaders['contentType']
    for (h in headers)
      headers.hasOwnProperty(h) && 'setRequestHeader' in http && http.setRequestHeader(h, headers[h])
  }

  function setCredentials(http, o) {
    if (typeof o['withCredentials'] !== 'undefined' && typeof http.withCredentials !== 'undefined') {
      http.withCredentials = !!o['withCredentials']
    }
  }

  function generalCallback(data) {
    lastValue = data
  }

  function urlappend (url, s) {
    return url + (/\?/.test(url) ? '&' : '?') + s
  }

  function handleJsonp(o, fn, err, url) {
    var reqId = uniqid++
      , cbkey = o['jsonpCallback'] || 'callback' // the 'callback' key
      , cbval = o['jsonpCallbackName'] || reqwest.getcallbackPrefix(reqId)
      , cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
      , match = url.match(cbreg)
      , script = doc.createElement('script')
      , loaded = 0
      , isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1

    if (match) {
      if (match[3] === '?') {
        url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
      } else {
        cbval = match[3] // provided callback func name
      }
    } else {
      url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
    }

    win[cbval] = generalCallback

    script.type = 'text/javascript'
    script.src = url
    script.async = true
    if (typeof script.onreadystatechange !== 'undefined' && !isIE10) {
      // need this for IE due to out-of-order onreadystatechange(), binding script
      // execution to an event listener gives us control over when the script
      // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
      script.htmlFor = script.id = '_reqwest_' + reqId
    }

    script.onload = script.onreadystatechange = function () {
      if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
        return false
      }
      script.onload = script.onreadystatechange = null
      script.onclick && script.onclick()
      // Call the user callback with the last value stored and clean up values and scripts.
      fn(lastValue)
      lastValue = undefined
      head.removeChild(script)
      loaded = 1
    }

    // Add the script to the DOM head
    head.appendChild(script)

    // Enable JSONP timeout
    return {
      abort: function () {
        script.onload = script.onreadystatechange = null
        err({}, 'Request is aborted: timeout', {})
        lastValue = undefined
        head.removeChild(script)
        loaded = 1
      }
    }
  }

  function getRequest(fn, err) {
    var o = this.o
      , method = (o['method'] || 'GET').toUpperCase()
      , url = typeof o === 'string' ? o : o['url']
      // convert non-string objects to query-string form unless o['processData'] is false
      , data = (o['processData'] !== false && o['data'] && typeof o['data'] !== 'string')
        ? reqwest.toQueryString(o['data'])
        : (o['data'] || null)
      , http
      , sendWait = false

    // if we're working on a GET request and we have data then we should append
    // query string to end of URL and not post data
    if ((o['type'] == 'jsonp' || method == 'GET') && data) {
      url = urlappend(url, data)
      data = null
    }

    if (o['type'] == 'jsonp') return handleJsonp(o, fn, err, url)

    // get the xhr from the factory if passed
    // if the factory returns null, fall-back to ours
    http = (o.xhr && o.xhr(o)) || xhr(o)

    http.open(method, url, o['async'] === false ? false : true)
    setHeaders(http, o)
    setCredentials(http, o)
    if (win[xDomainRequest] && http instanceof win[xDomainRequest]) {
        http.onload = fn
        http.onerror = err
        // NOTE: see
        // http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/30ef3add-767c-4436-b8a9-f1ca19b4812e
        http.onprogress = function() {}
        sendWait = true
    } else {
      http.onreadystatechange = handleReadyState(this, fn, err)
    }
    o['before'] && o['before'](http)
    if (sendWait) {
      setTimeout(function () {
        http.send(data)
      }, 200)
    } else {
      http.send(data)
    }
    return http
  }

  function Reqwest(o, fn) {
    this.o = o
    this.fn = fn

    init.apply(this, arguments)
  }

  function setType(header) {
    // json, javascript, text/plain, text/html, xml
    if (header.match('json')) return 'json'
    if (header.match('javascript')) return 'js'
    if (header.match('text')) return 'html'
    if (header.match('xml')) return 'xml'
  }

  function init(o, fn) {

    this.url = typeof o == 'string' ? o : o['url']
    this.timeout = null

    // whether request has been fulfilled for purpose
    // of tracking the Promises
    this._fulfilled = false
    // success handlers
    this._successHandler = function(){}
    this._fulfillmentHandlers = []
    // error handlers
    this._errorHandlers = []
    // complete (both success and fail) handlers
    this._completeHandlers = []
    this._erred = false
    this._responseArgs = {}

    var self = this

    fn = fn || function () {}

    if (o['timeout']) {
      this.timeout = setTimeout(function () {
        self.abort()
      }, o['timeout'])
    }

    if (o['success']) {
      this._successHandler = function () {
        o['success'].apply(o, arguments)
      }
    }

    if (o['error']) {
      this._errorHandlers.push(function () {
        o['error'].apply(o, arguments)
      })
    }

    if (o['complete']) {
      this._completeHandlers.push(function () {
        o['complete'].apply(o, arguments)
      })
    }

    function complete (resp) {
      o['timeout'] && clearTimeout(self.timeout)
      self.timeout = null
      while (self._completeHandlers.length > 0) {
        self._completeHandlers.shift()(resp)
      }
    }

    function success (resp) {
      var type = o['type'] || resp && setType(resp.getResponseHeader('Content-Type')) // resp can be undefined in IE
      resp = (type !== 'jsonp') ? self.request : resp
      // use global data filter on response text
      var filteredResponse = globalSetupOptions.dataFilter(resp.responseText, type)
        , r = filteredResponse
      try {
        resp.responseText = r
      } catch (e) {
        // can't assign this in IE<=8, just ignore
      }
      if (r) {
        switch (type) {
        case 'json':
          try {
            resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
          } catch (err) {
            return error(resp, 'Could not parse JSON in response', err)
          }
          break
        case 'js':
          resp = eval(r)
          break
        case 'html':
          resp = r
          break
        case 'xml':
          resp = resp.responseXML
              && resp.responseXML.parseError // IE trololo
              && resp.responseXML.parseError.errorCode
              && resp.responseXML.parseError.reason
            ? null
            : resp.responseXML
          break
        }
      }

      self._responseArgs.resp = resp
      self._fulfilled = true
      fn(resp)
      self._successHandler(resp)
      while (self._fulfillmentHandlers.length > 0) {
        resp = self._fulfillmentHandlers.shift()(resp)
      }

      complete(resp)
    }

    function error(resp, msg, t) {
      resp = self.request
      self._responseArgs.resp = resp
      self._responseArgs.msg = msg
      self._responseArgs.t = t
      self._erred = true
      while (self._errorHandlers.length > 0) {
        self._errorHandlers.shift()(resp, msg, t)
      }
      complete(resp)
    }

    this.request = getRequest.call(this, success, error)
  }

  Reqwest.prototype = {
    abort: function () {
      this._aborted = true
      this.request.abort()
    }

  , retry: function () {
      init.call(this, this.o, this.fn)
    }

    /**
     * Small deviation from the Promises A CommonJs specification
     * http://wiki.commonjs.org/wiki/Promises/A
     */

    /**
     * `then` will execute upon successful requests
     */
  , then: function (success, fail) {
      success = success || function () {}
      fail = fail || function () {}
      if (this._fulfilled) {
        this._responseArgs.resp = success(this._responseArgs.resp)
      } else if (this._erred) {
        fail(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
      } else {
        this._fulfillmentHandlers.push(success)
        this._errorHandlers.push(fail)
      }
      return this
    }

    /**
     * `always` will execute whether the request succeeds or fails
     */
  , always: function (fn) {
      if (this._fulfilled || this._erred) {
        fn(this._responseArgs.resp)
      } else {
        this._completeHandlers.push(fn)
      }
      return this
    }

    /**
     * `fail` will execute when the request fails
     */
  , fail: function (fn) {
      if (this._erred) {
        fn(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
      } else {
        this._errorHandlers.push(fn)
      }
      return this
    }
  , 'catch': function (fn) {
      return this.fail(fn)
    }
  }

  function reqwest(o, fn) {
    return new Reqwest(o, fn)
  }

  // normalize newline variants according to spec -> CRLF
  function normalize(s) {
    return s ? s.replace(/\r?\n/g, '\r\n') : ''
  }

  function serial(el, cb) {
    var n = el.name
      , t = el.tagName.toLowerCase()
      , optCb = function (o) {
          // IE gives value="" even where there is no value attribute
          // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
          if (o && !o['disabled'])
            cb(n, normalize(o['attributes']['value'] && o['attributes']['value']['specified'] ? o['value'] : o['text']))
        }
      , ch, ra, val, i

    // don't serialize elements that are disabled or without a name
    if (el.disabled || !n) return

    switch (t) {
    case 'input':
      if (!/reset|button|image|file/i.test(el.type)) {
        ch = /checkbox/i.test(el.type)
        ra = /radio/i.test(el.type)
        val = el.value
        // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
        ;(!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
      }
      break
    case 'textarea':
      cb(n, normalize(el.value))
      break
    case 'select':
      if (el.type.toLowerCase() === 'select-one') {
        optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
      } else {
        for (i = 0; el.length && i < el.length; i++) {
          el.options[i].selected && optCb(el.options[i])
        }
      }
      break
    }
  }

  // collect up all form elements found from the passed argument elements all
  // the way down to child elements; pass a '<form>' or form fields.
  // called with 'this'=callback to use for serial() on each element
  function eachFormElement() {
    var cb = this
      , e, i
      , serializeSubtags = function (e, tags) {
          var i, j, fa
          for (i = 0; i < tags.length; i++) {
            fa = e[byTag](tags[i])
            for (j = 0; j < fa.length; j++) serial(fa[j], cb)
          }
        }

    for (i = 0; i < arguments.length; i++) {
      e = arguments[i]
      if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
      serializeSubtags(e, [ 'input', 'select', 'textarea' ])
    }
  }

  // standard query string style serialization
  function serializeQueryString() {
    return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
  }

  // { 'name': 'value', ... } style serialization
  function serializeHash() {
    var hash = {}
    eachFormElement.apply(function (name, value) {
      if (name in hash) {
        hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
        hash[name].push(value)
      } else hash[name] = value
    }, arguments)
    return hash
  }

  // [ { name: 'name', value: 'value' }, ... ] style serialization
  reqwest.serializeArray = function () {
    var arr = []
    eachFormElement.apply(function (name, value) {
      arr.push({name: name, value: value})
    }, arguments)
    return arr
  }

  reqwest.serialize = function () {
    if (arguments.length === 0) return ''
    var opt, fn
      , args = Array.prototype.slice.call(arguments, 0)

    opt = args.pop()
    opt && opt.nodeType && args.push(opt) && (opt = null)
    opt && (opt = opt.type)

    if (opt == 'map') fn = serializeHash
    else if (opt == 'array') fn = reqwest.serializeArray
    else fn = serializeQueryString

    return fn.apply(null, args)
  }

  reqwest.toQueryString = function (o, trad) {
    var prefix, i
      , traditional = trad || false
      , s = []
      , enc = encodeURIComponent
      , add = function (key, value) {
          // If value is a function, invoke it and return its value
          value = ('function' === typeof value) ? value() : (value == null ? '' : value)
          s[s.length] = enc(key) + '=' + enc(value)
        }
    // If an array was passed in, assume that it is an array of form elements.
    if (isArray(o)) {
      for (i = 0; o && i < o.length; i++) add(o[i]['name'], o[i]['value'])
    } else {
      // If traditional, encode the "old" way (the way 1.3.2 or older
      // did it), otherwise encode params recursively.
      for (prefix in o) {
        if (o.hasOwnProperty(prefix)) buildParams(prefix, o[prefix], traditional, add)
      }
    }

    // spaces should be + according to spec
    return s.join('&').replace(/%20/g, '+')
  }

  function buildParams(prefix, obj, traditional, add) {
    var name, i, v
      , rbracket = /\[\]$/

    if (isArray(obj)) {
      // Serialize array item.
      for (i = 0; obj && i < obj.length; i++) {
        v = obj[i]
        if (traditional || rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, v)
        } else {
          buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add)
        }
      }
    } else if (obj && obj.toString() === '[object Object]') {
      // Serialize object item.
      for (name in obj) {
        buildParams(prefix + '[' + name + ']', obj[name], traditional, add)
      }

    } else {
      // Serialize scalar item.
      add(prefix, obj)
    }
  }

  reqwest.getcallbackPrefix = function () {
    return callbackPrefix
  }

  // jQuery and Zepto compatibility, differences can be remapped here so you can call
  // .ajax.compat(options, callback)
  reqwest.compat = function (o, fn) {
    if (o) {
      o['type'] && (o['method'] = o['type']) && delete o['type']
      o['dataType'] && (o['type'] = o['dataType'])
      o['jsonpCallback'] && (o['jsonpCallbackName'] = o['jsonpCallback']) && delete o['jsonpCallback']
      o['jsonp'] && (o['jsonpCallback'] = o['jsonp'])
    }
    return new Reqwest(o, fn)
  }

  reqwest.ajaxSetup = function (options) {
    options = options || {}
    for (var k in options) {
      globalSetupOptions[k] = options[k]
    }
  }

  return reqwest
});

},{}],10:[function(require,module,exports){
var header = require("./../bower_components/next-header/main.js");

},{"./../bower_components/next-header/main.js":2}]},{},[10])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL25vZGVfbW9kdWxlcy9vcmlnYW1pLWJ1aWxkLXRvb2xzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL2RvbS1kZWxlZ2F0ZS9saWIvZGVsZWdhdGUuanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtaGVhZGVyL21haW4uanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtaGVhZGVyL3NyYy9qcy9Ob3RpZnkuanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbGliL01lLmpzIiwiL1VzZXJzL2xlYW5uZS50aXRlL0RvY3VtZW50cy9Qcm9qZWN0cy9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL2xpYi9Ob3RpZmljYXRpb25Qb2xsZXIuanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbGliL1VzZXJQcmVmZXJlbmNlTGlzdC5qcyIsIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC11c2VyLXByZWZlcmVuY2VzL3NyYy9tYWluLmpzIiwiL1VzZXJzL2xlYW5uZS50aXRlL0RvY3VtZW50cy9Qcm9qZWN0cy9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL3ZlbmRvci9yZXF3ZXN0Lm1pbi5qcyIsIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvcmVxd2VzdC9yZXF3ZXN0LmpzIiwiL1VzZXJzL2xlYW5uZS50aXRlL0RvY3VtZW50cy9Qcm9qZWN0cy9uZXh0LWRvYmkvc3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ptQkE7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmpzaGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBEZWxlZ2F0ZTtcblxuLyoqXG4gKiBET00gZXZlbnQgZGVsZWdhdG9yXG4gKlxuICogVGhlIGRlbGVnYXRvciB3aWxsIGxpc3RlblxuICogZm9yIGV2ZW50cyB0aGF0IGJ1YmJsZSB1cFxuICogdG8gdGhlIHJvb3Qgbm9kZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqL1xuZnVuY3Rpb24gRGVsZWdhdGUocm9vdCkge1xuXG4gIC8qKlxuICAgKiBNYWludGFpbiBhIG1hcCBvZiBsaXN0ZW5lclxuICAgKiBsaXN0cywga2V5ZWQgYnkgZXZlbnQgbmFtZS5cbiAgICpcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICB0aGlzLmxpc3RlbmVyTWFwID0gW3t9LCB7fV07XG4gIGlmIChyb290KSB7XG4gICAgdGhpcy5yb290KHJvb3QpO1xuICB9XG5cbiAgLyoqIEB0eXBlIGZ1bmN0aW9uKCkgKi9cbiAgdGhpcy5oYW5kbGUgPSBEZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlLmJpbmQodGhpcyk7XG59XG5cbi8qKlxuICogU3RhcnQgbGlzdGVuaW5nIGZvciBldmVudHNcbiAqIG9uIHRoZSBwcm92aWRlZCBET00gZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUucm9vdCA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgdmFyIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcDtcbiAgdmFyIGV2ZW50VHlwZTtcblxuICAvLyBSZW1vdmUgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMV0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIG5vIHJvb3Qgb3Igcm9vdCBpcyBub3RcbiAgLy8gYSBkb20gbm9kZSwgdGhlbiByZW1vdmUgaW50ZXJuYWxcbiAgLy8gcm9vdCByZWZlcmVuY2UgYW5kIGV4aXQgaGVyZVxuICBpZiAoIXJvb3QgfHwgIXJvb3QuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICBkZWxldGUgdGhpcy5yb290RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHJvb3Qgbm9kZSBhdCB3aGljaFxuICAgKiBsaXN0ZW5lcnMgYXJlIGF0dGFjaGVkLlxuICAgKlxuICAgKiBAdHlwZSBOb2RlXG4gICAqL1xuICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdDtcblxuICAvLyBTZXQgdXAgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFsxXSkge1xuICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzBdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmNhcHR1cmVGb3JUeXBlID0gZnVuY3Rpb24oZXZlbnRUeXBlKSB7XG4gIHJldHVybiBbJ2JsdXInLCAnZXJyb3InLCAnZm9jdXMnLCAnbG9hZCcsICdyZXNpemUnLCAnc2Nyb2xsJ10uaW5kZXhPZihldmVudFR5cGUpICE9PSAtMTtcbn07XG5cbi8qKlxuICogQXR0YWNoIGEgaGFuZGxlciB0byBvbmVcbiAqIGV2ZW50IGZvciBhbGwgZWxlbWVudHNcbiAqIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9yLFxuICogbm93IG9yIGluIHRoZSBmdXR1cmVcbiAqXG4gKiBUaGUgaGFuZGxlciBmdW5jdGlvbiByZWNlaXZlc1xuICogdGhyZWUgYXJndW1lbnRzOiB0aGUgRE9NIGV2ZW50XG4gKiBvYmplY3QsIHRoZSBub2RlIHRoYXQgbWF0Y2hlZFxuICogdGhlIHNlbGVjdG9yIHdoaWxlIHRoZSBldmVudFxuICogd2FzIGJ1YmJsaW5nIGFuZCBhIHJlZmVyZW5jZVxuICogdG8gaXRzZWxmLiBXaXRoaW4gdGhlIGhhbmRsZXIsXG4gKiAndGhpcycgaXMgZXF1YWwgdG8gdGhlIHNlY29uZFxuICogYXJndW1lbnQuXG4gKlxuICogVGhlIG5vZGUgdGhhdCBhY3R1YWxseSByZWNlaXZlZFxuICogdGhlIGV2ZW50IGNhbiBiZSBhY2Nlc3NlZCB2aWFcbiAqICdldmVudC50YXJnZXQnLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgTGlzdGVuIGZvciB0aGVzZSBldmVudHNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc2VsZWN0b3IgT25seSBoYW5kbGUgZXZlbnRzIG9uIGVsZW1lbnRzIG1hdGNoaW5nIHRoaXMgc2VsZWN0b3IsIGlmIHVuZGVmaW5lZCBtYXRjaCByb290IGVsZW1lbnRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gaGFuZGxlciBIYW5kbGVyIGZ1bmN0aW9uIC0gZXZlbnQgZGF0YSBwYXNzZWQgaGVyZSB3aWxsIGJlIGluIGV2ZW50LmRhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXZlbnREYXRhXSBEYXRhIHRvIHBhc3MgaW4gZXZlbnQuZGF0YVxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgcm9vdCwgbGlzdGVuZXJNYXAsIG1hdGNoZXIsIG1hdGNoZXJQYXJhbTtcblxuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgZXZlbnQgdHlwZTogJyArIGV2ZW50VHlwZSk7XG4gIH1cblxuICAvLyBoYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIHNlbnNpYmxlIGRlZmF1bHRzXG4gIC8vIGlmIHVzZUNhcHR1cmUgbm90IHNldFxuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdXNlQ2FwdHVyZSA9IHRoaXMuY2FwdHVyZUZvclR5cGUoZXZlbnRUeXBlKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0hhbmRsZXIgbXVzdCBiZSBhIHR5cGUgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXBbdXNlQ2FwdHVyZSA/IDEgOiAwXTtcblxuICAvLyBBZGQgbWFzdGVyIGhhbmRsZXIgZm9yIHR5cGUgaWYgbm90IGNyZWF0ZWQgeWV0XG4gIGlmICghbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSkge1xuICAgIGlmIChyb290KSB7XG4gICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICAgIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0gPSBbXTtcbiAgfVxuXG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBudWxsO1xuXG4gICAgLy8gQ09NUExFWCAtIG1hdGNoZXNSb290IG5lZWRzIHRvIGhhdmUgYWNjZXNzIHRvXG4gICAgLy8gdGhpcy5yb290RWxlbWVudCwgc28gYmluZCB0aGUgZnVuY3Rpb24gdG8gdGhpcy5cbiAgICBtYXRjaGVyID0gbWF0Y2hlc1Jvb3QuYmluZCh0aGlzKTtcblxuICAvLyBDb21waWxlIGEgbWF0Y2hlciBmb3IgdGhlIGdpdmVuIHNlbGVjdG9yXG4gIH0gZWxzZSBpZiAoL15bYS16XSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc1RhZztcbiAgfSBlbHNlIGlmICgvXiNbYS16MC05XFwtX10rJC9pLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3Iuc2xpY2UoMSk7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXNJZDtcbiAgfSBlbHNlIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlcztcbiAgfVxuXG4gIC8vIEFkZCB0byB0aGUgbGlzdCBvZiBsaXN0ZW5lcnNcbiAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXS5wdXNoKHtcbiAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICBtYXRjaGVyOiBtYXRjaGVyLFxuICAgIG1hdGNoZXJQYXJhbTogbWF0Y2hlclBhcmFtXG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxuICogZm9yIGVsZW1lbnRzIHRoYXQgbWF0Y2hcbiAqIHRoZSBzZWxlY3RvciwgZm9yZXZlclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZXZlbnRUeXBlXSBSZW1vdmUgaGFuZGxlcnMgZm9yIGV2ZW50cyBtYXRjaGluZyB0aGlzIHR5cGUsIGNvbnNpZGVyaW5nIHRoZSBvdGhlciBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ30gW3NlbGVjdG9yXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBvdGhlciB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IFtoYW5kbGVyXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBwcmV2aW91cyB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgaSwgbGlzdGVuZXIsIGxpc3RlbmVyTWFwLCBsaXN0ZW5lckxpc3QsIHNpbmdsZUV2ZW50VHlwZTtcblxuICAvLyBIYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIElmIHVzZUNhcHR1cmUgbm90IHNldCwgcmVtb3ZlXG4gIC8vIGFsbCBldmVudCBsaXN0ZW5lcnNcbiAgaWYgKHVzZUNhcHR1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHRydWUpO1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIGZvciAoc2luZ2xlRXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoc2luZ2xlRXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLm9mZihzaW5nbGVFdmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG4gIGlmICghbGlzdGVuZXJMaXN0IHx8ICFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBSZW1vdmUgb25seSBwYXJhbWV0ZXIgbWF0Y2hlc1xuICAvLyBpZiBzcGVjaWZpZWRcbiAgZm9yIChpID0gbGlzdGVuZXJMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICBpZiAoKCFzZWxlY3RvciB8fCBzZWxlY3RvciA9PT0gbGlzdGVuZXIuc2VsZWN0b3IpICYmICghaGFuZGxlciB8fCBoYW5kbGVyID09PSBsaXN0ZW5lci5oYW5kbGVyKSkge1xuICAgICAgbGlzdGVuZXJMaXN0LnNwbGljZShpLCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBBbGwgbGlzdGVuZXJzIHJlbW92ZWRcbiAgaWYgKCFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgZGVsZXRlIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG5cbiAgICAvLyBSZW1vdmUgdGhlIG1haW4gaGFuZGxlclxuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogSGFuZGxlIGFuIGFyYml0cmFyeSBldmVudC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIGksIGwsIHR5cGUgPSBldmVudC50eXBlLCByb290LCBwaGFzZSwgbGlzdGVuZXIsIHJldHVybmVkLCBsaXN0ZW5lckxpc3QgPSBbXSwgdGFyZ2V0LCAvKiogQGNvbnN0ICovIEVWRU5USUdOT1JFID0gJ2Z0TGFic0RlbGVnYXRlSWdub3JlJztcblxuICBpZiAoZXZlbnRbRVZFTlRJR05PUkVdID09PSB0cnVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuXG4gIC8vIEhhcmRjb2RlIHZhbHVlIG9mIE5vZGUuVEVYVF9OT0RFXG4gIC8vIGFzIG5vdCBkZWZpbmVkIGluIElFOFxuICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcblxuICBwaGFzZSA9IGV2ZW50LmV2ZW50UGhhc2UgfHwgKCBldmVudC50YXJnZXQgIT09IGV2ZW50LmN1cnJlbnRUYXJnZXQgPyAzIDogMiApO1xuICBcbiAgc3dpdGNoIChwaGFzZSkge1xuICAgIGNhc2UgMTogLy9FdmVudC5DQVBUVVJJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMjogLy9FdmVudC5BVF9UQVJHRVQ6XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFswXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pO1xuICAgICAgaWYgKHRoaXMubGlzdGVuZXJNYXBbMV0gJiYgdGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXSkgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJMaXN0LmNvbmNhdCh0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKTtcbiAgICBicmVhaztcbiAgICBjYXNlIDM6IC8vRXZlbnQuQlVCQkxJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdO1xuICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gTmVlZCB0byBjb250aW51b3VzbHkgY2hlY2tcbiAgLy8gdGhhdCB0aGUgc3BlY2lmaWMgbGlzdCBpc1xuICAvLyBzdGlsbCBwb3B1bGF0ZWQgaW4gY2FzZSBvbmVcbiAgLy8gb2YgdGhlIGNhbGxiYWNrcyBhY3R1YWxseVxuICAvLyBjYXVzZXMgdGhlIGxpc3QgdG8gYmUgZGVzdHJveWVkLlxuICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgd2hpbGUgKHRhcmdldCAmJiBsKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICAgIC8vIEJhaWwgZnJvbSB0aGlzIGxvb3AgaWZcbiAgICAgIC8vIHRoZSBsZW5ndGggY2hhbmdlZCBhbmRcbiAgICAgIC8vIG5vIG1vcmUgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gZGVmaW5lZCBiZXR3ZWVuIGkgYW5kIGwuXG4gICAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYW5kIGZpcmVcbiAgICAgIC8vIHRoZSBldmVudCBpZiB0aGVyZSdzIG9uZVxuICAgICAgLy9cbiAgICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5XG4gICAgICAvLyB0byBjaGVjayBpZiBldmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25cbiAgICAgIC8vIHdhcyBjYWxsZWQuIElmIHNvLCBicmVhayBib3RoIGxvb3BzLlxuICAgICAgaWYgKGxpc3RlbmVyLm1hdGNoZXIuY2FsbCh0YXJnZXQsIGxpc3RlbmVyLm1hdGNoZXJQYXJhbSwgdGFyZ2V0KSkge1xuICAgICAgICByZXR1cm5lZCA9IHRoaXMuZmlyZShldmVudCwgdGFyZ2V0LCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0b3AgcHJvcGFnYXRpb24gdG8gc3Vic2VxdWVudFxuICAgICAgLy8gY2FsbGJhY2tzIGlmIHRoZSBjYWxsYmFjayByZXR1cm5lZFxuICAgICAgLy8gZmFsc2VcbiAgICAgIGlmIChyZXR1cm5lZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgZXZlbnRbRVZFTlRJR05PUkVdID0gdHJ1ZTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5IHRvXG4gICAgLy8gY2hlY2sgaWYgZXZlbnQjc3RvcFByb3BhZ2F0aW9uXG4gICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGxvb3BpbmdcbiAgICAvLyB0aHJvdWdoIHRoZSBET00uIFN0b3AgaWYgdGhlXG4gICAgLy8gZGVsZWdhdGlvbiByb290IGhhcyBiZWVuIHJlYWNoZWRcbiAgICBpZiAodGFyZ2V0ID09PSByb290KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcbiAgfVxufTtcblxuLyoqXG4gKiBGaXJlIGEgbGlzdGVuZXIgb24gYSB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge09iamVjdH0gbGlzdGVuZXJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBsaXN0ZW5lci5oYW5kbGVyLmNhbGwodGFyZ2V0LCBldmVudCwgdGFyZ2V0KTtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgZ2VuZXJpYyBzZWxlY3Rvci5cbiAqXG4gKiBAdHlwZSBmdW5jdGlvbigpXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgQSBDU1Mgc2VsZWN0b3JcbiAqL1xudmFyIG1hdGNoZXMgPSAoZnVuY3Rpb24oZWwpIHtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICB2YXIgcCA9IGVsLnByb3RvdHlwZTtcbiAgcmV0dXJuIChwLm1hdGNoZXMgfHwgcC5tYXRjaGVzU2VsZWN0b3IgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBwLm9NYXRjaGVzU2VsZWN0b3IpO1xufShFbGVtZW50KSk7XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgdGFnIHNlbGVjdG9yLlxuICpcbiAqIFRhZ3MgYXJlIE5PVCBjYXNlLXNlbnNpdGl2ZSxcbiAqIGV4Y2VwdCBpbiBYTUwgKGFuZCBYTUwtYmFzZWRcbiAqIGxhbmd1YWdlcyBzdWNoIGFzIFhIVE1MKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBUaGUgdGFnIG5hbWUgdG8gdGVzdCBhZ2FpbnN0XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNUYWcodGFnTmFtZSwgZWxlbWVudCkge1xuICByZXR1cm4gdGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgdGhlIHJvb3QuXG4gKlxuICogQHBhcmFtIHs/U3RyaW5nfSBzZWxlY3RvciBJbiB0aGlzIGNhc2UgdGhpcyBpcyBhbHdheXMgcGFzc2VkIHRocm91Z2ggYXMgbnVsbCBhbmQgbm90IHVzZWRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1Jvb3Qoc2VsZWN0b3IsIGVsZW1lbnQpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUqL1xuICBpZiAodGhpcy5yb290RWxlbWVudCA9PT0gd2luZG93KSByZXR1cm4gZWxlbWVudCA9PT0gZG9jdW1lbnQ7XG4gIHJldHVybiB0aGlzLnJvb3RFbGVtZW50ID09PSBlbGVtZW50O1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIElEIG9mXG4gKiB0aGUgZWxlbWVudCBpbiAndGhpcydcbiAqIG1hdGNoZXMgdGhlIGdpdmVuIElELlxuICpcbiAqIElEcyBhcmUgY2FzZS1zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBJRCB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc0lkKGlkLCBlbGVtZW50KSB7XG4gIHJldHVybiBpZCA9PT0gZWxlbWVudC5pZDtcbn1cblxuLyoqXG4gKiBTaG9ydCBoYW5kIGZvciBvZmYoKVxuICogYW5kIHJvb3QoKSwgaWUgYm90aFxuICogd2l0aCBubyBwYXJhbWV0ZXJzXG4gKlxuICogQHJldHVybiB2b2lkXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub2ZmKCk7XG4gIHRoaXMucm9vdCgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcXdlc3QgPSByZXF1aXJlKFwiLi8uLi9yZXF3ZXN0L3JlcXdlc3QuanNcIik7XG52YXIgRGVsZWdhdGUgPSByZXF1aXJlKFwiLi8uLi9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzXCIpO1xudmFyIGhlYWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vLWhlYWRlcicpO1xudmFyIG15RnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuby1oZWFkZXJfX3NlY29uZGFyeS0tbXlmdC1qcycpO1xudmFyIG15RlRCdXR0b24gPSBoZWFkZXIucXVlcnlTZWxlY3RvcignLm8taGVhZGVyLWJ1dHRvbi1qc1tkYXRhLXRhcmdldC1wYW5lbD1cIm15ZnRcIl0nKTtcbnZhciBkZWZhdWx0UGFuZWwgPSBoZWFkZXIuZ2V0QXR0cmlidXRlKCdkYXRhLWRlZmF1bHQtcGFuZWwnKTtcbnZhciBkZWxlZ2F0ZSA9IG5ldyBEZWxlZ2F0ZShoZWFkZXIpO1xudmFyIGJvZHlEZWxlZ2F0ZSA9IG5ldyBEZWxlZ2F0ZSgpO1xudmFyIE5vdGlmeSA9IHJlcXVpcmUoJy4vc3JjL2pzL05vdGlmeScpO1xudmFyIG5leHRVc2VyUHJlZmVyZW5jZXMgPSByZXF1aXJlKFwiLi8uLi9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL21haW4uanNcIik7XG5cbmRlbGVnYXRlLm9uKCdjbGljaycsICcuby1oZWFkZXItYnV0dG9uLWpzJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0Ly8gSEFDS1xuXHR2YXIgdGFyZ2V0UGFuZWwgPSBldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLXRhcmdldC1wYW5lbCcpXG5cdFx0fHwgZXZlbnQudGFyZ2V0LnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLXRhcmdldC1wYW5lbCcpXG5cdFx0fHwgZGVmYXVsdFBhbmVsO1xuXHR2YXIgY3VycmVudFBhbmVsID0gaGVhZGVyLmdldEF0dHJpYnV0ZSgnZGF0YS1wYW5lbCcpO1xuXHRpZiAoY3VycmVudFBhbmVsICE9PSB0YXJnZXRQYW5lbCAmJiB0YXJnZXRQYW5lbCAhPT0gZGVmYXVsdFBhbmVsKSB7XG5cdFx0Ym9keURlbGVnYXRlLnJvb3QoZG9jdW1lbnQuYm9keSk7XG5cdFx0aGVhZGVyLnNldEF0dHJpYnV0ZSgnZGF0YS1wYW5lbCcsIHRhcmdldFBhbmVsKTtcblx0fSBlbHNlIHtcblx0XHRib2R5RGVsZWdhdGUucm9vdCgpO1xuXHRcdGlmIChkZWZhdWx0UGFuZWwpIHtcblx0XHRcdGhlYWRlci5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnLCBkZWZhdWx0UGFuZWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRoZWFkZXIucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXBhbmVsJyk7XG5cdFx0fVxuXHR9XG59KTtcblxuZGVsZWdhdGUub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59KTtcblxuYm9keURlbGVnYXRlLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRpZiAoZGVmYXVsdFBhbmVsKSB7XG5cdFx0aGVhZGVyLnNldEF0dHJpYnV0ZSgnZGF0YS1wYW5lbCcsIGRlZmF1bHRQYW5lbCk7XG5cdH0gZWxzZSB7XG5cdFx0aGVhZGVyLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1wYW5lbCcpO1xuXHR9XG59KTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbm90aWZpY2F0aW9uczpsb2FkJywgZnVuY3Rpb24oZSkge1xuXHR2YXIgdG90YWwgPSAwLCBcblx0XHRcdG5vdGlmaWNhdGlvbnMgPSBlLmRldGFpbDtcblx0Zm9yKHZhciBzdHJlYW0gaW4gbm90aWZpY2F0aW9ucykge1xuXHRcdGlmKG5vdGlmaWNhdGlvbnNbc3RyZWFtXSkge1xuXHRcdFx0dG90YWwgKz0gbm90aWZpY2F0aW9uc1tzdHJlYW1dLmxlbmd0aDtcblx0XHR9XG5cdH1cblx0aWYodG90YWwgPiAwKSB7XG5cdFx0aWYobXlGVEJ1dHRvbi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdub3RpZnktYmFkZ2UnKS5sZW5ndGgpIHtcblx0XHRcdG15RlRCdXR0b24uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbm90aWZ5LWJhZGdlJylbMF0udGV4dENvbnRlbnQgPSB0b3RhbDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bXlGVEJ1dHRvbi5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsICc8c3BhbiBjbGFzcz1cIm5vdGlmeS1iYWRnZVwiPicrdG90YWwgKyAnPC9zcGFuPicpXG5cdFx0fVxuXHR9XG59KTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbm90aWZpY2F0aW9uczpuZXcnLCBmdW5jdGlvbihlKSB7XG5cdHZhciB0b3RhbCA9IDAsIFxuXHRcdFx0ZGF0YSA9IGUuZGV0YWlsO1xuXHRcblx0dmFyIGlkID0gZGF0YS5ub3RpZmljYXRpb25zWzBdLml0ZW07XG5cdHJlcXdlc3Qoe1xuXHRcdHVybDogJy8nICsgaWQsXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRcdCdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcblx0XHR9XG5cdH0pLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG5cdFx0bmV3IE5vdGlmeSh7XG5cdFx0XHR0aXRsZTogJ05ldyBhcnRpY2xlIGluICcgKyBkYXRhLnN0cmVhbS5kaXNwbGF5VGV4dCxcblx0XHRcdGJvZHk6IHJlcy5oZWFkbGluZSxcblx0XHRcdGxpZmVzcGFuOiAxMDAwICogMTAsXG5cdFx0XHRvbmNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcvJyArIHJlcy5pZFxuXHRcdFx0fVxuXHRcdH0pLnNob3coKTtcblx0fSkuZmFpbChmdW5jdGlvbihlcnIpIHtcblx0XHRuZXcgTm90aWZ5KHtcblx0XHRcdHRpdGxlOiAnTmV3IGFydGljbGUgaW4gJyArIGRhdGEuc3RyZWFtLmRpc3BsYXlUZXh0LFxuXHRcdFx0bGlmZXNwYW46IDEwMDAgKiAxMCxcblx0XHRcdG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRsb2NhdGlvbi5ocmVmID0gJy8nICsgZGF0YS5ub3RpZmljYXRpb25zWzBdLml0ZW1cblx0XHRcdH1cblx0XHR9KS5zaG93KCk7XG5cdH0pO1xuXG5cbn0pO1xuXG5cblxuZnVuY3Rpb24gdHJhbnNpdGlvbk15RlRCdXR0b24gKHR5cGUpIHtcblxuXHRmdW5jdGlvbiBsaXN0ZW5lcigpIHtcblx0XHRteUZUQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ3RyYW5zaXRpb25pbmcnKTtcblx0XHRteUZUQnV0dG9uLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBsaXN0ZW5lcik7XG5cdH07XG5cblx0bXlGVEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgbGlzdGVuZXIpO1xuXHRteUZUQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3RyYW5zaXRpb25pbmcnKTtcblx0bXlGVEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdteWZ0LS0nICsgdHlwZSk7XG5cdG15RlRCdXR0b24ub2Zmc2V0V2lkdGg7IC8vZm9yY2VzIHJlcGFpbnRcblxuXHRteUZUQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ215ZnQtLScgKyB0eXBlKTtcbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZmF2b3VyaXRlczphZGQnLCBmdW5jdGlvbiAoZSkge1xuXHR0cmFuc2l0aW9uTXlGVEJ1dHRvbignYWRkLWZhdm91cml0ZScpO1xufSk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Zhdm91cml0ZXM6cmVtb3ZlJywgZnVuY3Rpb24gKGUpIHtcblx0dHJhbnNpdGlvbk15RlRCdXR0b24oJ3JlbW92ZS1mYXZvdXJpdGUnKTtcbn0pO1xuXG5yZXF3ZXN0KCdodHRwOi8vbmV4dC1jb21wYW5pZXMtZXQtYWwuaGVyb2t1YXBwLmNvbS92MS91YmVybmF2Lmpzb24nLCBmdW5jdGlvbihyZXNwKSB7XG5cdHZhciBkYXRhID0gcmVzcC5kYXRhO1xuXHRoZWFkZXIucXVlcnlTZWxlY3RvcignLm8taGVhZGVyX19zZWNvbmRhcnktLW1lbnUtanMnKS5pbm5lckhUTUwgPSAnPHVsIGNsYXNzPVwidWJlci1pbmRleFwiPidcblx0XHQrIGRhdGEubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRyZXR1cm4gJzxsaSBjbGFzcz1cInViZXItaW5kZXhfX3RpdGxlXCIgZGF0YS1vLWdyaWQtY29sc3Bhbj1cIjYgTTYgTDMgWEwzXCI+J1xuXHRcdFx0KyAnPGEgaHJlZj1cIicgKyBpdGVtLm5leHRVcmwgKyAnXCI+JyArIGl0ZW0udGl0bGUgKyAnPC9hPidcblx0XHRcdCsgJzx1bCBjbGFzcz1cInViZXItaW5kZXhfX2NoaWxkcmVuXCI+J1xuXHRcdFx0KyBpdGVtLm5hdmlnYXRpb25JdGVtcy5tYXAoZnVuY3Rpb24oY2hpbGQpIHtcblx0XHRcdFx0cmV0dXJuICc8bGkgY2xhc3M9XCJ1YmVyLWluZGV4X19jaGlsZFwiPjxhIGhyZWY9XCInICsgY2hpbGQubmV4dFVybCArICdcIj4nICsgY2hpbGQudGl0bGUgKyAnPC9hPjwvbGk+Jztcblx0XHRcdH0pLmpvaW4oJycpXG5cdFx0XHQrICc8L3VsPidcblx0XHRcdCsgJzwvbGk+Jztcblx0XHR9KS5qb2luKCcnKTtcblx0XHQrICc8L3VsPic7XG59KTtcblxuaWYgKG15RnQpIG5leHRVc2VyUHJlZmVyZW5jZXMuaW5pdChteUZ0LCB7IG5vdGlmeTogdHJ1ZSB9KTtcbiIsIi8qKlxuICogTWVzc2FnZSB0aGUgdXNlclxuICpcbiAqID4gbmV3IE5vdGlmeSh7IGh0bWw6IFwiWW91J3ZlIGdvdCBtYWlsXCIsIGxpZmVzcGFjZTogMTAwMDAgfSkuc2hvdygpO1xuICpcbiAqIFRPRE9cbiAqXG4gKiAgLSBVWCB0byBkZWFsIHdpdGggbXVsdGlwbGUgbWVzc2FnZXMuXG4gKiAgLSBXMyAvIENocm9tZSBkZXNrdG9wIG5vdGlmaWNhdGlvbnMgcGVybWlzc2lvbi5cbiAqICAtIEFja25vd2xlZGdlbWVudCBVWFxuICpcbiAqL1xudmFyIE5vdGlmeSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgdGhpcy50ZW1wbGF0ZSA9ICc8aDMgY2xhc3M9XCJtZXNzYWdlX190aXRsZVwiPicgKyBtZXNzYWdlLnRpdGxlICsgJzxpIGNsYXNzPVwibWVzc2FnZV9fY2xvc2UgaWNvbiBpY29uX19jbG9zZVwiPjwvaT48L2gzPjxzcGFuIGNsYXNzPVwibWVzc2FnZV9fYm9keVwiPicgKyBtZXNzYWdlLmJvZHkgKyAnPC9zcGFuPic7XG4gICAgdGhpcy5saWZlc3BhbiA9IG1lc3NhZ2UubGlmZXNwYW4gfHwgNTAwMDtcbiAgICB0aGlzLmRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZG9tLmNsYXNzTmFtZSA9ICdtZXNzYWdlX19jb250YWluZXInXG4gICAgdGhpcy5kb20uaW5uZXJIVE1MID0gdGhpcy50ZW1wbGF0ZTsgXG4gICAgdGhpcy5oYXNEZXNrdG9wUGVybWlzc2lvbiA9IGZhbHNlO1xuICAgIHRoaXMucm9vdCA9IGRvY3VtZW50LmJvZHk7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZU5vdGlmaWNhdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIG5vdGlmaWNhdGlvbiA9IG5ldyBOb3RpZmljYXRpb24obWVzc2FnZS50aXRsZSwge2JvZHk6IG1lc3NhZ2UuYm9keX0pO1xuICAgIG5vdGlmaWNhdGlvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG1lc3NhZ2Uub25jbGljayk7XG4gICAgcmV0dXJuIG5vdGlmaWNhdGlvbjtcbn1cblxuTm90aWZ5LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xuICAgIFxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBncmFudGVkXG4gICAgLy9UT0RPIC0gZW5hYmxlIHRoaXMgYWdhaW4gb25jZSB3ZSd2ZSB0aG91Z2h0IGFib3V0IHRoZSBVWCFcbiAgICBpZiAoZmFsc2UgJiYgd2luZG93Lk5vdGlmaWNhdGlvbiAmJiBOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgY3JlYXRlTm90aWZpY2F0aW9uKHNlbGYubWVzc2FnZSk7XG4gICAgfSBlbHNlIGlmIChmYWxzZSAmJiB3aW5kb3cuTm90aWZpY2F0aW9uICYmIE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSBcImRlbmllZFwiKSB7XG4gICAgICBcbiAgICAgICAgTm90aWZpY2F0aW9uLnJlcXVlc3RQZXJtaXNzaW9uKGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgICAgIGlmIChOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPSBzdGF0dXM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGdyYW50ZWRcbiAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICAgICAgY3JlYXRlTm90aWZpY2F0aW9uKHNlbGYubWVzc2FnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuc2hvd0h0bWxOb3RpZmljYXRpb24oKTsgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIC8vIGRlbmllZFxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2hvd0h0bWxOb3RpZmljYXRpb24oKTsgICAgXG4gICAgfVxufTtcblxuTm90aWZ5LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIEZJWE1FIGZvcmdldCBpZiBJIG5lZWQgdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVyIDopXG4gICAgdGhpcy5kb20ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmRvbSk7XG59O1xuXG5Ob3RpZnkucHJvdG90eXBlLnNob3dIdG1sTm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5yb290LmFwcGVuZENoaWxkKHRoaXMuZG9tKTtcblxuICAgIC8vIEF1dG9tYXRpY2FsbHkgZGVzdHJveSB0aGUgYm94IGFmdGVyIGEgZmV3IHNlY29uZHNcbiAgICB2YXIgc2VsZkRlc3RydWN0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgIH0sIHRoaXMubGlmZXNwYW4pOyBcblxuICAgIC8vIEFja25vd2xlZGdtZW50IFVJXG4gICAgdGhpcy5kb20ucXVlcnlTZWxlY3RvcignLm1lc3NhZ2VfX2Nsb3NlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICBjbGVhclRpbWVvdXQoc2VsZkRlc3RydWN0KTtcbiAgICB9KTtcblxuICAgIHRoaXMuZG9tLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYoZS50YXJnZXQuY2xhc3NOYW1lLmluZGV4T2YoJ21lc3NhZ2VfX2Nsb3NlJykgPj0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNlbGYubWVzc2FnZS5vbmNsaWNrKCk7XG4gICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICBjbGVhclRpbWVvdXQoc2VsZkRlc3RydWN0KTtcbiAgICB9KTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb3RpZnk7IiwiLy8gU3RvcmVzIGEgdW5pcXVlIGxpc3Qgb2YgdGhpbmdzIChFZywgc2VjdGlvbnMsIGZhdm91cml0ZXMsIGhpc3RvcnkpIGFnYWluc3QgYVxuLy8ga2V5IGluIGxvY2FsU3RvcmFnZVxuXG52YXIgcmVxd2VzdCA9IHJlcXVpcmUoJy4uL3ZlbmRvci9yZXF3ZXN0Lm1pbicpO1xuXG52YXIgQVBJX1VSTCA9ICdodHRwOi8vZnQtbmV4dC1hcGktdXNlci1wcmVmcy5oZXJva3VhcHAuY29tL3VzZXIvJztcblxudmFyIGVtaXQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG4gIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICBldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gIGlmIChkYXRhKSB7XG4gICAgZXZlbnQuZGV0YWlsID0gZGF0YTtcbiAgfVxuICB0b3AuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5cbnZhciBNZSA9IGZ1bmN0aW9uIChrZXksIHVzZXJJZCkge1xuICBpZiAoIWtleSkge1xuICAgIHRocm93IG5ldyBFcnJvcignWW91IG11c3Qgc3VwcGx5IGEga2V5IC9eW2Etel0rJC8nKTtcbiAgfVxuICB0aGlzLmtleSA9IGtleTtcblxuICB0aGlzLmxvY2FsU3RvcmFnZUtleSA9ICdmdC5uZXh0LnVzZXIuJyArIGtleTtcblxuICBpZih1c2VySWQpIHtcbiAgICB0aGlzLmFwaVVSTCA9IEFQSV9VUkwgKyBrZXk7XG4gICAgdGhpcy51c2VySWQgPSB1c2VySWQ7XG4gIH0gICAgICBcbiAgICAvL1N0YXJ0IG9mZiB3aXRoIGxvY2FsIGNvcHkuLi5cbiAgICB0aGlzLnZhbCA9IHRoaXMuZ2V0T3JDcmVhdGUoKTtcbiAgICAvL1RoZW4gdHJ5IGFuZCBmZXRjaCBzZXJ2ZXIgY29weVxuICAgIHRoaXMuZmV0Y2goKTtcblxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAga2V5ID0ga2V5IHx8IHRoaXMubG9jYWxTdG9yYWdlS2V5O1xuICAgIHZhciBleGlzdHMgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgIGlmIChleGlzdHMpIHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGV4aXN0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmdldE9yQ3JlYXRlID0gZnVuY3Rpb24gKGtleSkge1xuICAgIGtleSA9IGtleSB8fCB0aGlzLmxvY2FsU3RvcmFnZUtleTtcbiAgICB2YXIgc2F2ZWQgPSB0aGlzLmdldChrZXkpO1xuICAgIGlmKHNhdmVkKSB7XG4gICAgICByZXR1cm4gc2F2ZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBlbXB0eSA9IFtdO1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShlbXB0eSkpO1xuICAgICAgcmV0dXJuIGVtcHR5O1xuICAgIH1cbiAgfTtcblxuICBNZS5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICAvL0lmIG5vIHVzZXJJRCBkb24ndCBmZXRjaCBmcm9tIHNlcnZlclxuICAgIGlmKCF0aGlzLnVzZXJJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJlcXdlc3Qoe1xuICAgICAgdXJsOiB0aGlzLmFwaVVSTCxcbiAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgIG1ldGhvZDogJ2dldCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdYLUZULVVJRCc6IHRoaXMudXNlcklkXG4gICAgICB9LFxuICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICB9KS50aGVuKGZ1bmN0aW9uKGZhdmVzKSB7XG4gICAgICBpZihmYXZlcykge1xuICAgICAgICBtZS52YWwgPSBmYXZlcztcbiAgICAgICAgLy9hY2NlcHQgdGhlIHNlcnZlciBjb3B5IGFzICd0aGUgdHJ1dGgnLi4uXG4gICAgICAgIG1lLnNhdmUobWUudmFsKTtcbiAgICAgICAgLy9idXQgdGhlbiBwcm9jZXNzIGFueSBsZWZ0b3ZlciByZXF1ZXN0cyBsb2NhbGx5XG4gICAgICAgIG1lLnByb2Nlc3NQZW5kaW5nKCdhZGQnKTtcbiAgICAgICAgbWUucHJvY2Vzc1BlbmRpbmcoJ3JlbW92ZScpO1xuICAgICAgICBtZS5wcm9jZXNzUGVuZGluZygnY2xlYXInKTtcbiAgICAgIH1cbiAgICB9KS5hbHdheXMoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAvL3RyaWdnZXIgbG9hZCBhbmQgdXBkYXRlIGV2ZW50c1xuICAgICAgZW1pdChtZS5rZXkgKyAnOmxvYWQnLCBtZSk7XG4gICAgICBlbWl0KG1lLmtleSArICc6dXBkYXRlJywgbWUpO1xuICAgIH0pOyAgXG4gIH07XG5cbiAgTWUucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbiAob2JqLCBrZXkpIHtcbiAgICBrZXkgPSBrZXkgfHwgdGhpcy5sb2NhbFN0b3JhZ2VLZXk7XG4gICAgaWYob2JqICYmIG9iai5sZW5ndGgpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkob2JqKSk7IFxuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xuICAgIH1cbiAgfTtcblxuICBNZS5wcm90b3R5cGUuYWRkUGVuZGluZyA9IGZ1bmN0aW9uKG9iaiwgYWN0aW9uKSB7XG4gICAgdmFyIHBlbmRpbmcgPSB0aGlzLmdldE9yQ3JlYXRlKHRoaXMubG9jYWxTdG9yYWdlS2V5ICsgJy4nICsgYWN0aW9uKTtcbiAgICBwZW5kaW5nLnB1c2gob2JqKTtcbiAgICAvL2lmIHdlJ3JlIGFkZGluZyBzb21ldGhpbmcsIHRoZW4gZ2V0IHJpZCBvZiBhbnkgcGVuZGluZyBjbGVhciByZXF1ZXN0c1xuICAgIGlmKGFjdGlvbiA9PT0gJ2FkZCcpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMubG9jYWxTdG9yYWdlS2V5ICsgJy5jbGVhcicpO1xuICAgIH1cbiAgICB0aGlzLnNhdmUocGVuZGluZywgdGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLicgKyBhY3Rpb24pO1xuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5wcm9jZXNzUGVuZGluZyA9IGZ1bmN0aW9uKGFjdGlvbikge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIHBlbmRpbmcgPSB0aGlzLmdldCh0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuJyArIGFjdGlvbik7XG4gICAgaWYocGVuZGluZyAmJiBwZW5kaW5nLmxlbmd0aCkge1xuICAgICAgLy9DbGVhciBpcyBhIHNwZWNpYWwgY2FzZVxuICAgICAgaWYoYWN0aW9uID09PSAnY2xlYXInKSB7XG4gICAgICAgIGlmKHBlbmRpbmdbcGVuZGluZy5sZW5ndGggLSAxXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIG1lLmNsZWFyKCk7XG4gICAgICAgICAgcGVuZGluZyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBlbmRpbmcuZm9yRWFjaChmdW5jdGlvbihpdGVtVG9BZGQsIGluZGV4KSB7XG4gICAgICAgICAgIC8vIHJlbW92ZSB0aGUgaXRlbSBmcm9tIHRoZSB0b2RvIGxpc3QgYW5kIGV4ZWN1dGUgdGhlIGFjdGlvbiBcbiAgICAgICAgICAgcGVuZGluZy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICBtZVthY3Rpb25dKGl0ZW1Ub0FkZCk7XG4gICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2F2ZShwZW5kaW5nLCB0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuJyArIGFjdGlvbik7XG4gICAgfVxuXG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHRoaXMudmFsID0gdGhpcy5nZXRPckNyZWF0ZSgpO1xuICAgIGlmICghdGhpcy5leGlzdHMob2JqLnV1aWR2MykpIHtcbiAgICAgIHRoaXMudmFsLnB1c2gob2JqKTtcbiAgICAgIHRoaXMuc2F2ZSh0aGlzLnZhbCk7XG4gICAgICBlbWl0KG1lLmtleSArICc6dXBkYXRlJywgbWUpOyAvL3RyaWdnZXIgZXZlbnQgdG8gcmVuZGVyIFVJXG5cbiAgICAgIC8vU2VuZCBhIHJlcXVlc3QgdG8gYWRkIHRvIHNlcnZlclxuICAgICAgaWYodGhpcy5hcGlVUkwpIHtcbiAgICAgICAgcmVxd2VzdCh7XG4gICAgICAgICAgdXJsOiB0aGlzLmFwaVVSTCxcbiAgICAgICAgICBtZXRob2Q6ICdwdXQnLFxuICAgICAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KG9iaiksXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ1gtRlQtVUlEJzogdGhpcy51c2VySWRcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNyb3NzT3JpZ2luOiB0cnVlXG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbWUuYWRkUGVuZGluZyhvYmosICdhZGQnKTsgLy9zZXJ2ZXIgcmVxdWVzdCBmYWlsZWQgc28gcHVzaCBpdCB0byB0aGUgbGlzdCBvZiBwZW5kaW5nXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBNZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBtZSA9IHRoaXM7XG5cbiAgICB0aGlzLnZhbCA9IHRoaXMuZ2V0T3JDcmVhdGUoKTtcbiAgICB0aGlzLnZhbCA9IHRoaXMudmFsLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gKGl0ZW0udXVpZHYzICE9PSBvYmoudXVpZHYzKTtcbiAgICB9KTtcbiAgICB0aGlzLnNhdmUodGhpcy52YWwpO1xuXG4gICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTsgLy90cmlnZ2VyIGV2ZW50IHRvIHJlbmRlciBVSVxuXG4gICAgLy9TZW5kIGEgcmVxdWVzdCB0byBkZWxldGUgZnJvbSBzZXJ2ZXJcbiAgICBpZih0aGlzLmFwaVVSTCkge1xuXG4gICAgICByZXF3ZXN0KHtcbiAgICAgICAgdXJsOiB0aGlzLmFwaVVSTCArICcvJyArIGVuY29kZVVSSShkZWNvZGVVUkkob2JqLnV1aWR2MykpLFxuICAgICAgICB0eXBlOiAnanNvbicsXG4gICAgICAgIG1ldGhvZDogJ2RlbGV0ZScsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnWC1GVC1VSUQnOiB0aGlzLnVzZXJJZFxuICAgICAgICB9LFxuICAgICAgICBjcm9zc09yaWdpbjogdHJ1ZVxuICAgICAgfSkuZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgbWUuYWRkUGVuZGluZyhvYmosICdyZW1vdmUnKTsgIC8vc2VydmVyIHJlcXVlc3QgZmFpbGVkIHNvIHB1c2ggaXQgdG8gdGhlIGxpc3Qgb2YgcGVuZGluZ1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgTWUucHJvdG90eXBlLmV4aXN0cyA9IGZ1bmN0aW9uICh1dWlkKSB7XG4gICAgdGhpcy52YWwgPSB0aGlzLmdldE9yQ3JlYXRlKCk7XG4gICAgcmV0dXJuIHRoaXMudmFsLnNvbWUoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpdGVtLnV1aWR2MyA9PT0gdXVpZDtcbiAgICB9KTtcbiAgfTtcblxuICBNZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB2YXIgc3RhdHVzID0gbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy5sb2NhbFN0b3JhZ2VLZXkpO1xuICAgIHRoaXMudmFsID0gW107XG5cbiAgICBlbWl0KG1lLmtleSArICc6dXBkYXRlJywgbWUpOyAvL3RyaWdnZXIgZXZlbnQgdG8gcmVuZGVyIFVJXG5cbiAgICAgIC8vU2VuZCBhIHJlcXVlc3QgdG8gZGVsZXRlIEFMTCBmcm9tIHNlcnZlclxuICAgICAgaWYodGhpcy5hcGlVUkwpIHtcblxuICAgICAgICByZXF3ZXN0KHtcbiAgICAgICAgICB1cmw6IHRoaXMuYXBpVVJMLFxuICAgICAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgICAgICBtZXRob2Q6ICdkZWxldGUnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdYLUZULVVJRCc6IHRoaXMudXNlcklkXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjcm9zc09yaWdpbjogdHJ1ZVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG1lLmFkZFBlbmRpbmcodHJ1ZSwgJ2NsZWFyJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH07XG5cblxuICAgIG1vZHVsZS5leHBvcnRzID0gTWU7XG5cbiIsInZhciByZXF3ZXN0ID0gcmVxdWlyZSgnLi4vdmVuZG9yL3JlcXdlc3QubWluJyk7XG5cblxudmFyIE5PVElGSUNBVElPTlNfVVJMID0gJ2h0dHA6Ly9mdC1uZXh0LWFwaS11c2VyLXByZWZzLmhlcm9rdWFwcC5jb20vdXNlci9ub3RpZmljYXRpb25zLyc7XG52YXIgZW1pdCA9IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcblx0dmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG5cdGV2ZW50LmluaXRFdmVudChuYW1lLCB0cnVlLCB0cnVlKTtcblx0aWYgKGRhdGEpIHtcblx0XHRldmVudC5kZXRhaWwgPSBkYXRhO1xuXHR9XG5cdHRvcC5kb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cblxuZnVuY3Rpb24gZXh0cmFjdFNlYXJjaFRlcm0ocXVlcnlTdHJpbmcpIHtcbiAgICByZXR1cm4gcXVlcnlTdHJpbmcubWF0Y2goL3E9KFteJl0qKS8pWzFdO1xufVxuXG52YXIgZ2V0Q3VycmVudFN0cmVhbSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb25BcnRpY2xlID0gL15cXC9bYS1mMC05XSstKC4qKS8udGVzdChsb2NhdGlvbi5wYXRobmFtZSk7IC8vICcyN2E1ZTI4Ni00MzE0LTExZTQtOGE0My0wMDE0NGZlYWJkYzAnOyBcbiAgaWYob25BcnRpY2xlIHx8IGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoJy9zZWFyY2gnKSAhPT0gMCkgeyAvL2hhY2t5IHdheSB0byBleGNsdWRlIGhvbWVwYWdlIVxuICBcdHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgXHRyZXR1cm4gZXh0cmFjdFNlYXJjaFRlcm0obG9jYXRpb24uc2VhcmNoKTtcbiAgfVxufTtcblxuXG5mdW5jdGlvbiBOb3RpZmljYXRpb25Qb2xsZXIodXNlclByZWZlcmVuY2VMaXN0KSB7XG5cdHRoaXMudXNlclByZWZlcmVuY2VMaXN0ID0gdXNlclByZWZlcmVuY2VMaXN0O1xuXHRzZXRJbnRlcnZhbCh0aGlzLnBvbGwuYmluZCh0aGlzKSwgMTAwMCAqIDYwICogMC4yKTsgLy8zMCBzZWNvbmQgcG9sbGluZ1xuXHR0aGlzLm5vdGlmaWNhdGlvbnMgPSB7fTtcblxuXHQvL0NsZWFyIG5vdGlmaWNhdGlvbnMgaWYgYSBzdHJlYW0gaGFzIGJlZW4gb3BlbmVuZFxuXHR0aGlzLmN1cnJlbnRTdHJlYW0gPSBnZXRDdXJyZW50U3RyZWFtKCk7XG5cdGlmKGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoJy9mYXZvdXJpdGVzJykgPj0gMCkge1xuXHRcdHRoaXMuY2xlYXIoKVxuXHR9IGVsc2UgaWYodGhpcy5jdXJyZW50U3RyZWFtKSB7XG5cdFx0dGhpcy5jbGVhcih0aGlzLmN1cnJlbnRTdHJlYW0pO1xuXHR9XG5cblx0dGhpcy5wb2xsKHRydWUpOyAvL3Bhc3MgZmxhZyB0byBpbmRpY2F0ZSB0aGlzIGlzIHRoZSBmaXJzdCBsb2FkXG5cbn1cblxuTm90aWZpY2F0aW9uUG9sbGVyLnByb3RvdHlwZS5wb2xsID0gZnVuY3Rpb24oZmlyc3RMb2FkKSB7XG5cdHZhciBwb2xsZXIgPSB0aGlzO1xuXHR2YXIgbm90aWZpY2F0aW9uUHJvbWlzZXMgPSBbXTtcblx0dmFyIG5ld05vdGlmaWNhdGlvbnM7XG5cdHRoaXMudXNlclByZWZlcmVuY2VMaXN0Lmxpc3QuZ2V0KCkuZm9yRWFjaChmdW5jdGlvbihzdHJlYW0pIHtcblx0XHQvL2Rvbid0IGJvdGhlciBmZXRjaGluZyBpZiB5b3UgYXJlIG9uIHRoYXQgc3RyZWFtIGN1cnJlbnRseVxuXHRcdChmdW5jdGlvbihzdHJlYW0pIHtcblx0XHRcdGlmKHN0cmVhbS5yZXNvdXJjZVR5cGUgIT09ICdzdHJlYW0nKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdG5vdGlmaWNhdGlvblByb21pc2VzLnB1c2gocmVxd2VzdCh7XG5cdFx0XHRcdHVybDogTk9USUZJQ0FUSU9OU19VUkwgKyBzdHJlYW0udXVpZHYzLFxuXHRcdFx0XHR0eXBlOiAnanNvbicsXG5cdFx0XHRcdG1ldGhvZDogJ2dldCcsXG5cdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHQnWC1GVC1VSUQnOiBwb2xsZXIudXNlclByZWZlcmVuY2VMaXN0LnVzZXJJZFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjcm9zc09yaWdpbjogdHJ1ZVxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihub3RpZmljYXRpb25zKSB7XG5cdFx0XHRcdGlmKG5vdGlmaWNhdGlvbnMgJiYgbm90aWZpY2F0aW9ucy5sZW5ndGgpIHtcblxuXHRcdFx0XHRcdC8vSWYgdGhlIHN0cmVhbSBpcyBjdXJyZW50bHkgb3BlbiwgZW1pdCBhbiBldmVudCB3aXRoIHRoZSBub3RpZmljYXRpb25zLCBhbmQgdGhlbiBjbGVhciB0aGVtXG5cdFx0XHRcdFx0Ly8gKGJ1dCBvbmx5IGRvIHRoaXMgb25jZSlcblx0XHRcdFx0XHRpZihmaXJzdExvYWQgJiYgc3RyZWFtLnV1aWR2MyA9PT0gcG9sbGVyLmN1cnJlbnRTdHJlYW0pIHtcblx0XHRcdFx0XHRcdGVtaXQoJ25vdGlmaWNhdGlvbnM6b3BlbmVkJywgeyB1dWlkdjM6IHN0cmVhbS51dWlkdjMsIG5vdGlmaWNhdGlvbnM6IG5vdGlmaWNhdGlvbnMgfSk7XG5cdFx0XHRcdFx0XHRwb2xsZXIuY2xlYXIoc3RyZWFtLnV1aWR2Myk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bmV3Tm90aWZpY2F0aW9ucyA9IGZpbHRlck5ldyhwb2xsZXIubm90aWZpY2F0aW9uc1tzdHJlYW0udXVpZHYzXSwgbm90aWZpY2F0aW9ucyk7XG5cblx0XHRcdFx0XHRpZighZmlyc3RMb2FkICYmIG5ld05vdGlmaWNhdGlvbnMubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRlbWl0KCdub3RpZmljYXRpb25zOm5ldycsIHsgc3RyZWFtOiBzdHJlYW0sIG5vdGlmaWNhdGlvbnM6IG5ld05vdGlmaWNhdGlvbnMgfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHBvbGxlci5ub3RpZmljYXRpb25zW3N0cmVhbS51dWlkdjNdID0gbm90aWZpY2F0aW9ucztcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRlbGV0ZSBwb2xsZXIubm90aWZpY2F0aW9uc1tzdHJlYW0udXVpZHYzXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRwb2xsZXIucmVuZGVyKCk7XG5cdFx0XHR9KSk7XG5cblx0XHR9KHN0cmVhbSkpXG5cdFx0XG5cdH0pO1xuXG5cdFByb21pc2UuYWxsKG5vdGlmaWNhdGlvblByb21pc2VzKS50aGVuKGZ1bmN0aW9uKHN0cmVhbU5vdGlmaWNhdGlvbnMpIHtcblx0XHRpZihwb2xsZXIubm90aWZpY2F0aW9ucykge1xuXHRcdFx0ZW1pdCgnbm90aWZpY2F0aW9uczpsb2FkJywgcG9sbGVyLm5vdGlmaWNhdGlvbnMpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXJOZXcob3JpZ2luYWxMaXN0LCBuZXdMaXN0KSB7XG5cdG9yaWdpbmFsTGlzdCA9IG9yaWdpbmFsTGlzdCB8fCBbXTtcblx0bmV3TGlzdCA9IG5ld0xpc3QgfHwgW107XG5cdHZhciBvcmlnaW5hbElkcyA9IG9yaWdpbmFsTGlzdC5tYXAoZnVuY3Rpb24oaXRlbSkgeyByZXR1cm4gaXRlbS5pZDsgfSk7XG5cdHJldHVybiBuZXdMaXN0LmZpbHRlcihmdW5jdGlvbihub3RpZikgeyByZXR1cm4gKG9yaWdpbmFsSWRzLmluZGV4T2Yobm90aWYuaWQpIDwgMCk7IH0pO1xufVxuXG5mdW5jdGlvbiByZW5kZXJCYWRnZShlbCwgbnVtYmVyKSB7XG5cdHZhciBiYWRnZSA9IGVsLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2pzLW5vdGlmeS1iYWRnZScpWzBdO1xuXHRpZighYmFkZ2UpIHtcblx0XHRiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblx0XHRiYWRnZS5jbGFzc05hbWUgPSAnbm90aWZ5LWJhZGdlIGpzLW5vdGlmeS1iYWRnZSc7XG5cdFx0ZWwuYXBwZW5kQ2hpbGQoYmFkZ2UpO1xuXHR9XG5cdGlmKG51bWJlciA+IDApIHtcblx0XHRiYWRnZS5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG5cdFx0YmFkZ2UudGV4dENvbnRlbnQgPSBudW1iZXI7XG5cdH0gZWxzZSB7XG5cdFx0YmFkZ2Uuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICcnKTtcblx0fVxufVxuXG5Ob3RpZmljYXRpb25Qb2xsZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuXHRmb3IodmFyIHN0cmVhbSBpbiB0aGlzLm5vdGlmaWNhdGlvbnMpIHtcblx0XHRsaW5rID0gdGhpcy51c2VyUHJlZmVyZW5jZUxpc3QuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tocmVmPVwiL3NlYXJjaD9xPScgKyBzdHJlYW0gKyAnXCJdJyk7XG5cdFx0aWYobGluaykge1xuXHRcdFx0cmVuZGVyQmFkZ2UobGluaywgdGhpcy5ub3RpZmljYXRpb25zW3N0cmVhbV0ubGVuZ3RoKTtcblx0XHR9XG5cdH1cbn07XG5cbk5vdGlmaWNhdGlvblBvbGxlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbih1dWlkKSB7XG5cdGlmKHV1aWQpIHtcblx0XHR0aGlzLm5vdGlmaWNhdGlvbnNbdXVpZF0gPSBbXTtcblx0XHRyZXF3ZXN0KHtcblx0XHRcdHVybDogTk9USUZJQ0FUSU9OU19VUkwgKyB1dWlkLFxuXHRcdFx0dHlwZTogJ2pzb24nLFxuXHRcdFx0bWV0aG9kOiAnZGVsZXRlJyxcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J1gtRlQtVUlEJzogdGhpcy51c2VyUHJlZmVyZW5jZUxpc3QudXNlcklkXG5cdFx0XHR9LFxuXHRcdFx0Y3Jvc3NPcmlnaW46IHRydWVcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgdXVpZCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHR0aGlzLm5vdGlmaWNhdGlvbnMgPSB7fTtcblx0fVxuXHR0aGlzLnJlbmRlcigpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOb3RpZmljYXRpb25Qb2xsZXI7IiwidmFyIE5vdGlmaWNhdGlvblBvbGxlciA9IHJlcXVpcmUoJy4vTm90aWZpY2F0aW9uUG9sbGVyJyk7XG52YXIgTWUgPSByZXF1aXJlKCcuL01lJyk7XG5cbnZhciAkID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gIHJldHVybiBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbn07XG52YXIgZW1pdCA9IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcbiAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gIGV2ZW50LmluaXRFdmVudChuYW1lLCB0cnVlLCB0cnVlKTtcbiAgaWYgKGRhdGEpIHtcbiAgICBldmVudC5kZXRhaWwgPSBkYXRhO1xuICB9XG4gIHRvcC5kb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cbnZhciBnZXRVc2VySWQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZhbHVlID0gXCI7IFwiICsgZG9jdW1lbnQuY29va2llO1xuICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIjsgRlRfVT1cIik7XG4gIHZhciBmdFUgPSBwYXJ0cy5wb3AoKS5zcGxpdChcIjtcIikuc2hpZnQoKTtcbiAgaWYoZnRVKSB7XG4gICAgcmV0dXJuIGZ0VS5tYXRjaCgvX0VJRD0oXFxkKylfUElELylbMV07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuO1xuICB9XG59O1xuXG52YXIgVXNlclByZWZlcmVuY2VMaXN0ID0gZnVuY3Rpb24oY29udGFpbmVyLCBvcHRzKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy51c2VySWQgPSBnZXRVc2VySWQoKTtcbiAgdGhpcy5rZXkgPSBjb250YWluZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXVzZXItcHJlZmVyZW5jZS1saXN0Jyk7XG4gIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICB0aGlzLm5vdGlmeSA9IG9wdHMubm90aWZ5O1xuXG59O1xuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZighdGhpcy51c2VySWQpIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmtleSArICc6YWRkJywgZnVuY3Rpb24oZXYpIHtcbiAgICBzZWxmLmFkZChldi5kZXRhaWwpO1xuICB9KTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmtleSArICc6cmVtb3ZlJywgZnVuY3Rpb24oZXYpIHtcbiAgICBzZWxmLnJlbW92ZShldi5kZXRhaWwpO1xuICB9KTtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMua2V5ICsgJzpjbGVhcicsIHRoaXMuY2xlYXIuYmluZCh0aGlzKSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5rZXkgKyAnOnVwZGF0ZScsIHRoaXMucmVuZGVyLmJpbmQodGhpcykpO1xuXG4gICQoJ1tkYXRhLWxpc3Qtc291cmNlPVwiJyArIHRoaXMua2V5ICsgJ1wiXSAuY2xlYXJfX2J1dHRvbicpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYuY2xlYXIuYmluZChzZWxmKSk7XG4gIH0pO1xuXG4gIHRoaXMubGlzdCA9IG5ldyBNZSh0aGlzLmtleSwgdGhpcy51c2VySWQpO1xuXG4gIGlmKHRoaXMubm90aWZ5ID09PSB0cnVlKSB7XG4gICAgdGhpcy5ub3RpZmllciA9IG5ldyBOb3RpZmljYXRpb25Qb2xsZXIodGhpcyk7XG4gIH1cbn1cblxuVXNlclByZWZlcmVuY2VMaXN0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG1lID0gdGhpcztcbiAgdmFyIGhyZWYgPSAnJztcblxuICB2YXIgbGlua3MgPSB0aGlzLmxpc3QgPyB0aGlzLmxpc3QuZ2V0T3JDcmVhdGUoKS5yZXZlcnNlKCkgOiBbXTtcblxuICB2YXIgbGlua3NIVE1MID0gbGlua3MubWFwKGZ1bmN0aW9uIChzZWN0aW9uKSB7XG4gICAgaHJlZiA9IHNlY3Rpb24ucmVzb3VyY2VUeXBlID09PSAnc3RyZWFtJyA/ICcvc2VhcmNoP3E9JyArIHNlY3Rpb24udXVpZHYzIDogJy8nICsgc2VjdGlvbi51dWlkdjM7XG4gICAgcmV0dXJuICc8bGkgY2xhc3M9XCJpdGVtLXR5cGUtLScgKyBzZWN0aW9uLnJlc291cmNlVHlwZSArICdcIj48YSBocmVmPVwiJyArIGhyZWYgKyAnXCI+JyArIHNlY3Rpb24uZGlzcGxheVRleHQgKyAnPC9hPjwvbGk+JztcbiAgfSkuam9pbignJyk7XG4gIFxuICBpZih0aGlzLmNvbnRhaW5lcikge1xuICAgIHRoaXMuY29udGFpbmVyLmlubmVySFRNTCA9ICBsaW5rc0hUTUw7XG4gIH1cbiAgaWYodGhpcy5ub3RpZmllcikge1xuICAgIHRoaXMubm90aWZpZXIucmVuZGVyKCk7XG4gIH1cbn07XG5cblxuVXNlclByZWZlcmVuY2VMaXN0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihvYmopIHtcbiAgdGhpcy5saXN0LmFkZChvYmopO1xufTtcblxuVXNlclByZWZlcmVuY2VMaXN0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihvYmopIHtcbiAgdGhpcy5saXN0LnJlbW92ZShvYmopO1xufTtcblxuVXNlclByZWZlcmVuY2VMaXN0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmxpc3QuY2xlYXIoKTtcbn07XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5pbml0ID0gZnVuY3Rpb24ocm9vdEVsLCBvcHRzKSB7XG4gIHZhciBjb21wb25lbnRzID0ge30sIFxuICAgICAgZkVscywgXG4gICAgICBjLCBsLCBcbiAgICAgIGNvbXBvbmVudDtcblxuICByb290RWwgPSByb290RWwgfHwgZG9jdW1lbnQuYm9keTtcbiAgLy9zZXQgY29uZmlnIHdpdGggb3ZlcnJpZGVzIHBhc3NlZCB0aHJvdWdoXG5cbiAgaWYgKHJvb3RFbC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgZkVscyA9IHJvb3RFbC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS11c2VyLXByZWZlcmVuY2UtbGlzdF0nKTtcbiAgICBmb3IgKGMgPSAwLCBsID0gZkVscy5sZW5ndGg7IGMgPCBsOyBjKyspIHtcbiAgICAgIGlmICghZkVsc1tjXS5oYXNBdHRyaWJ1dGUoJ2RhdGEtby1hdXRob3ItYWxlcnRzLS1qcycpKSB7XG4gICAgICAgIGNvbXBvbmVudCA9IG5ldyBVc2VyUHJlZmVyZW5jZUxpc3QoZkVsc1tjXSwgb3B0cyB8fCB7fSk7XG4gICAgICAgIGNvbXBvbmVudC5pbml0KG9wdHMpO1xuICAgICAgICBjb21wb25lbnRzW2ZFbHNbY10uZ2V0QXR0cmlidXRlKCdkYXRhLXVzZXItcHJlZmVyZW5jZS1saXN0JyldID0gY29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnRzO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFVzZXJQcmVmZXJlbmNlTGlzdDtcbiIsInZhciBVc2VyUHJlZmVyZW5jZUxpc3QgPSByZXF1aXJlKCcuL2xpYi9Vc2VyUHJlZmVyZW5jZUxpc3QnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBVc2VyUHJlZmVyZW5jZUxpc3Q7IiwiLyohXG4gICogUmVxd2VzdCEgQSBnZW5lcmFsIHB1cnBvc2UgWEhSIGNvbm5lY3Rpb24gbWFuYWdlclxuICAqIGxpY2Vuc2UgTUlUIChjKSBEdXN0aW4gRGlheiAyMDE0XG4gICogaHR0cHM6Ly9naXRodWIuY29tL2RlZC9yZXF3ZXN0XG4gICovXG4hZnVuY3Rpb24oZSx0LG4pe3R5cGVvZiBtb2R1bGUhPVwidW5kZWZpbmVkXCImJm1vZHVsZS5leHBvcnRzP21vZHVsZS5leHBvcnRzPW4oKTp0eXBlb2YgZGVmaW5lPT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQ/ZGVmaW5lKG4pOnRbZV09bigpfShcInJlcXdlc3RcIix0aGlzLGZ1bmN0aW9uKCl7ZnVuY3Rpb24gc3VjY2VlZChlKXtyZXR1cm4gaHR0cHNSZS50ZXN0KHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCk/dHdvSHVuZG8udGVzdChlLnN0YXR1cyk6ISFlLnJlc3BvbnNlfWZ1bmN0aW9uIGhhbmRsZVJlYWR5U3RhdGUoZSx0LG4pe3JldHVybiBmdW5jdGlvbigpe2lmKGUuX2Fib3J0ZWQpcmV0dXJuIG4oZS5yZXF1ZXN0KTtlLnJlcXVlc3QmJmUucmVxdWVzdFtyZWFkeVN0YXRlXT09NCYmKGUucmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2U9bm9vcCxzdWNjZWVkKGUucmVxdWVzdCk/dChlLnJlcXVlc3QpOm4oZS5yZXF1ZXN0KSl9fWZ1bmN0aW9uIHNldEhlYWRlcnMoZSx0KXt2YXIgbj10LmhlYWRlcnN8fHt9LHI7bi5BY2NlcHQ9bi5BY2NlcHR8fGRlZmF1bHRIZWFkZXJzLmFjY2VwdFt0LnR5cGVdfHxkZWZhdWx0SGVhZGVycy5hY2NlcHRbXCIqXCJdO3ZhciBpPXR5cGVvZiBGb3JtRGF0YT09XCJmdW5jdGlvblwiJiZ0LmRhdGEgaW5zdGFuY2VvZiBGb3JtRGF0YTshdC5jcm9zc09yaWdpbiYmIW5bcmVxdWVzdGVkV2l0aF0mJihuW3JlcXVlc3RlZFdpdGhdPWRlZmF1bHRIZWFkZXJzLnJlcXVlc3RlZFdpdGgpLCFuW2NvbnRlbnRUeXBlXSYmIWkmJihuW2NvbnRlbnRUeXBlXT10LmNvbnRlbnRUeXBlfHxkZWZhdWx0SGVhZGVycy5jb250ZW50VHlwZSk7Zm9yKHIgaW4gbiluLmhhc093blByb3BlcnR5KHIpJiZcInNldFJlcXVlc3RIZWFkZXJcImluIGUmJmUuc2V0UmVxdWVzdEhlYWRlcihyLG5bcl0pfWZ1bmN0aW9uIHNldENyZWRlbnRpYWxzKGUsdCl7dHlwZW9mIHQud2l0aENyZWRlbnRpYWxzIT1cInVuZGVmaW5lZFwiJiZ0eXBlb2YgZS53aXRoQ3JlZGVudGlhbHMhPVwidW5kZWZpbmVkXCImJihlLndpdGhDcmVkZW50aWFscz0hIXQud2l0aENyZWRlbnRpYWxzKX1mdW5jdGlvbiBnZW5lcmFsQ2FsbGJhY2soZSl7bGFzdFZhbHVlPWV9ZnVuY3Rpb24gdXJsYXBwZW5kKGUsdCl7cmV0dXJuIGUrKC9cXD8vLnRlc3QoZSk/XCImXCI6XCI/XCIpK3R9ZnVuY3Rpb24gaGFuZGxlSnNvbnAoZSx0LG4scil7dmFyIGk9dW5pcWlkKysscz1lLmpzb25wQ2FsbGJhY2t8fFwiY2FsbGJhY2tcIixvPWUuanNvbnBDYWxsYmFja05hbWV8fHJlcXdlc3QuZ2V0Y2FsbGJhY2tQcmVmaXgoaSksdT1uZXcgUmVnRXhwKFwiKChefFxcXFw/fCYpXCIrcytcIik9KFteJl0rKVwiKSxhPXIubWF0Y2godSksZj1kb2MuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKSxsPTAsYz1uYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJNU0lFIDEwLjBcIikhPT0tMTtyZXR1cm4gYT9hWzNdPT09XCI/XCI/cj1yLnJlcGxhY2UodSxcIiQxPVwiK28pOm89YVszXTpyPXVybGFwcGVuZChyLHMrXCI9XCIrbyksd2luW29dPWdlbmVyYWxDYWxsYmFjayxmLnR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIixmLnNyYz1yLGYuYXN5bmM9ITAsdHlwZW9mIGYub25yZWFkeXN0YXRlY2hhbmdlIT1cInVuZGVmaW5lZFwiJiYhYyYmKGYuaHRtbEZvcj1mLmlkPVwiX3JlcXdlc3RfXCIraSksZi5vbmxvYWQ9Zi5vbnJlYWR5c3RhdGVjaGFuZ2U9ZnVuY3Rpb24oKXtpZihmW3JlYWR5U3RhdGVdJiZmW3JlYWR5U3RhdGVdIT09XCJjb21wbGV0ZVwiJiZmW3JlYWR5U3RhdGVdIT09XCJsb2FkZWRcInx8bClyZXR1cm4hMTtmLm9ubG9hZD1mLm9ucmVhZHlzdGF0ZWNoYW5nZT1udWxsLGYub25jbGljayYmZi5vbmNsaWNrKCksdChsYXN0VmFsdWUpLGxhc3RWYWx1ZT11bmRlZmluZWQsaGVhZC5yZW1vdmVDaGlsZChmKSxsPTF9LGhlYWQuYXBwZW5kQ2hpbGQoZikse2Fib3J0OmZ1bmN0aW9uKCl7Zi5vbmxvYWQ9Zi5vbnJlYWR5c3RhdGVjaGFuZ2U9bnVsbCxuKHt9LFwiUmVxdWVzdCBpcyBhYm9ydGVkOiB0aW1lb3V0XCIse30pLGxhc3RWYWx1ZT11bmRlZmluZWQsaGVhZC5yZW1vdmVDaGlsZChmKSxsPTF9fX1mdW5jdGlvbiBnZXRSZXF1ZXN0KGUsdCl7dmFyIG49dGhpcy5vLHI9KG4ubWV0aG9kfHxcIkdFVFwiKS50b1VwcGVyQ2FzZSgpLGk9dHlwZW9mIG49PVwic3RyaW5nXCI/bjpuLnVybCxzPW4ucHJvY2Vzc0RhdGEhPT0hMSYmbi5kYXRhJiZ0eXBlb2Ygbi5kYXRhIT1cInN0cmluZ1wiP3JlcXdlc3QudG9RdWVyeVN0cmluZyhuLmRhdGEpOm4uZGF0YXx8bnVsbCxvLHU9ITE7cmV0dXJuKG5bXCJ0eXBlXCJdPT1cImpzb25wXCJ8fHI9PVwiR0VUXCIpJiZzJiYoaT11cmxhcHBlbmQoaSxzKSxzPW51bGwpLG5bXCJ0eXBlXCJdPT1cImpzb25wXCI/aGFuZGxlSnNvbnAobixlLHQsaSk6KG89bi54aHImJm4ueGhyKG4pfHx4aHIobiksby5vcGVuKHIsaSxuLmFzeW5jPT09ITE/ITE6ITApLHNldEhlYWRlcnMobyxuKSxzZXRDcmVkZW50aWFscyhvLG4pLHdpblt4RG9tYWluUmVxdWVzdF0mJm8gaW5zdGFuY2VvZiB3aW5beERvbWFpblJlcXVlc3RdPyhvLm9ubG9hZD1lLG8ub25lcnJvcj10LG8ub25wcm9ncmVzcz1mdW5jdGlvbigpe30sdT0hMCk6by5vbnJlYWR5c3RhdGVjaGFuZ2U9aGFuZGxlUmVhZHlTdGF0ZSh0aGlzLGUsdCksbi5iZWZvcmUmJm4uYmVmb3JlKG8pLHU/c2V0VGltZW91dChmdW5jdGlvbigpe28uc2VuZChzKX0sMjAwKTpvLnNlbmQocyksbyl9ZnVuY3Rpb24gUmVxd2VzdChlLHQpe3RoaXMubz1lLHRoaXMuZm49dCxpbml0LmFwcGx5KHRoaXMsYXJndW1lbnRzKX1mdW5jdGlvbiBzZXRUeXBlKGUpe2lmKGUubWF0Y2goXCJqc29uXCIpKXJldHVyblwianNvblwiO2lmKGUubWF0Y2goXCJqYXZhc2NyaXB0XCIpKXJldHVyblwianNcIjtpZihlLm1hdGNoKFwidGV4dFwiKSlyZXR1cm5cImh0bWxcIjtpZihlLm1hdGNoKFwieG1sXCIpKXJldHVyblwieG1sXCJ9ZnVuY3Rpb24gaW5pdChvLGZuKXtmdW5jdGlvbiBjb21wbGV0ZShlKXtvLnRpbWVvdXQmJmNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpLHNlbGYudGltZW91dD1udWxsO3doaWxlKHNlbGYuX2NvbXBsZXRlSGFuZGxlcnMubGVuZ3RoPjApc2VsZi5fY29tcGxldGVIYW5kbGVycy5zaGlmdCgpKGUpfWZ1bmN0aW9uIHN1Y2Nlc3MocmVzcCl7dmFyIHR5cGU9by50eXBlfHxzZXRUeXBlKHJlc3AuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb250ZW50LVR5cGVcIikpO3Jlc3A9dHlwZSE9PVwianNvbnBcIj9zZWxmLnJlcXVlc3Q6cmVzcDt2YXIgZmlsdGVyZWRSZXNwb25zZT1nbG9iYWxTZXR1cE9wdGlvbnMuZGF0YUZpbHRlcihyZXNwLnJlc3BvbnNlVGV4dCx0eXBlKSxyPWZpbHRlcmVkUmVzcG9uc2U7dHJ5e3Jlc3AucmVzcG9uc2VUZXh0PXJ9Y2F0Y2goZSl7fWlmKHIpc3dpdGNoKHR5cGUpe2Nhc2VcImpzb25cIjp0cnl7cmVzcD13aW4uSlNPTj93aW4uSlNPTi5wYXJzZShyKTpldmFsKFwiKFwiK3IrXCIpXCIpfWNhdGNoKGVycil7cmV0dXJuIGVycm9yKHJlc3AsXCJDb3VsZCBub3QgcGFyc2UgSlNPTiBpbiByZXNwb25zZVwiLGVycil9YnJlYWs7Y2FzZVwianNcIjpyZXNwPWV2YWwocik7YnJlYWs7Y2FzZVwiaHRtbFwiOnJlc3A9cjticmVhaztjYXNlXCJ4bWxcIjpyZXNwPXJlc3AucmVzcG9uc2VYTUwmJnJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvciYmcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yLmVycm9yQ29kZSYmcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yLnJlYXNvbj9udWxsOnJlc3AucmVzcG9uc2VYTUx9c2VsZi5fcmVzcG9uc2VBcmdzLnJlc3A9cmVzcCxzZWxmLl9mdWxmaWxsZWQ9ITAsZm4ocmVzcCksc2VsZi5fc3VjY2Vzc0hhbmRsZXIocmVzcCk7d2hpbGUoc2VsZi5fZnVsZmlsbG1lbnRIYW5kbGVycy5sZW5ndGg+MClyZXNwPXNlbGYuX2Z1bGZpbGxtZW50SGFuZGxlcnMuc2hpZnQoKShyZXNwKTtjb21wbGV0ZShyZXNwKX1mdW5jdGlvbiBlcnJvcihlLHQsbil7ZT1zZWxmLnJlcXVlc3Qsc2VsZi5fcmVzcG9uc2VBcmdzLnJlc3A9ZSxzZWxmLl9yZXNwb25zZUFyZ3MubXNnPXQsc2VsZi5fcmVzcG9uc2VBcmdzLnQ9bixzZWxmLl9lcnJlZD0hMDt3aGlsZShzZWxmLl9lcnJvckhhbmRsZXJzLmxlbmd0aD4wKXNlbGYuX2Vycm9ySGFuZGxlcnMuc2hpZnQoKShlLHQsbik7Y29tcGxldGUoZSl9dGhpcy51cmw9dHlwZW9mIG89PVwic3RyaW5nXCI/bzpvLnVybCx0aGlzLnRpbWVvdXQ9bnVsbCx0aGlzLl9mdWxmaWxsZWQ9ITEsdGhpcy5fc3VjY2Vzc0hhbmRsZXI9ZnVuY3Rpb24oKXt9LHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcnM9W10sdGhpcy5fZXJyb3JIYW5kbGVycz1bXSx0aGlzLl9jb21wbGV0ZUhhbmRsZXJzPVtdLHRoaXMuX2VycmVkPSExLHRoaXMuX3Jlc3BvbnNlQXJncz17fTt2YXIgc2VsZj10aGlzO2ZuPWZufHxmdW5jdGlvbigpe30sby50aW1lb3V0JiYodGhpcy50aW1lb3V0PXNldFRpbWVvdXQoZnVuY3Rpb24oKXtzZWxmLmFib3J0KCl9LG8udGltZW91dCkpLG8uc3VjY2VzcyYmKHRoaXMuX3N1Y2Nlc3NIYW5kbGVyPWZ1bmN0aW9uKCl7by5zdWNjZXNzLmFwcGx5KG8sYXJndW1lbnRzKX0pLG8uZXJyb3ImJnRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChmdW5jdGlvbigpe28uZXJyb3IuYXBwbHkobyxhcmd1bWVudHMpfSksby5jb21wbGV0ZSYmdGhpcy5fY29tcGxldGVIYW5kbGVycy5wdXNoKGZ1bmN0aW9uKCl7by5jb21wbGV0ZS5hcHBseShvLGFyZ3VtZW50cyl9KSx0aGlzLnJlcXVlc3Q9Z2V0UmVxdWVzdC5jYWxsKHRoaXMsc3VjY2VzcyxlcnJvcil9ZnVuY3Rpb24gcmVxd2VzdChlLHQpe3JldHVybiBuZXcgUmVxd2VzdChlLHQpfWZ1bmN0aW9uIG5vcm1hbGl6ZShlKXtyZXR1cm4gZT9lLnJlcGxhY2UoL1xccj9cXG4vZyxcIlxcclxcblwiKTpcIlwifWZ1bmN0aW9uIHNlcmlhbChlLHQpe3ZhciBuPWUubmFtZSxyPWUudGFnTmFtZS50b0xvd2VyQ2FzZSgpLGk9ZnVuY3Rpb24oZSl7ZSYmIWUuZGlzYWJsZWQmJnQobixub3JtYWxpemUoZS5hdHRyaWJ1dGVzLnZhbHVlJiZlLmF0dHJpYnV0ZXMudmFsdWUuc3BlY2lmaWVkP2UudmFsdWU6ZS50ZXh0KSl9LHMsbyx1LGE7aWYoZS5kaXNhYmxlZHx8IW4pcmV0dXJuO3N3aXRjaChyKXtjYXNlXCJpbnB1dFwiOi9yZXNldHxidXR0b258aW1hZ2V8ZmlsZS9pLnRlc3QoZS50eXBlKXx8KHM9L2NoZWNrYm94L2kudGVzdChlLnR5cGUpLG89L3JhZGlvL2kudGVzdChlLnR5cGUpLHU9ZS52YWx1ZSwoIXMmJiFvfHxlLmNoZWNrZWQpJiZ0KG4sbm9ybWFsaXplKHMmJnU9PT1cIlwiP1wib25cIjp1KSkpO2JyZWFrO2Nhc2VcInRleHRhcmVhXCI6dChuLG5vcm1hbGl6ZShlLnZhbHVlKSk7YnJlYWs7Y2FzZVwic2VsZWN0XCI6aWYoZS50eXBlLnRvTG93ZXJDYXNlKCk9PT1cInNlbGVjdC1vbmVcIilpKGUuc2VsZWN0ZWRJbmRleD49MD9lLm9wdGlvbnNbZS5zZWxlY3RlZEluZGV4XTpudWxsKTtlbHNlIGZvcihhPTA7ZS5sZW5ndGgmJmE8ZS5sZW5ndGg7YSsrKWUub3B0aW9uc1thXS5zZWxlY3RlZCYmaShlLm9wdGlvbnNbYV0pfX1mdW5jdGlvbiBlYWNoRm9ybUVsZW1lbnQoKXt2YXIgZT10aGlzLHQsbixyPWZ1bmN0aW9uKHQsbil7dmFyIHIsaSxzO2ZvcihyPTA7cjxuLmxlbmd0aDtyKyspe3M9dFtieVRhZ10obltyXSk7Zm9yKGk9MDtpPHMubGVuZ3RoO2krKylzZXJpYWwoc1tpXSxlKX19O2ZvcihuPTA7bjxhcmd1bWVudHMubGVuZ3RoO24rKyl0PWFyZ3VtZW50c1tuXSwvaW5wdXR8c2VsZWN0fHRleHRhcmVhL2kudGVzdCh0LnRhZ05hbWUpJiZzZXJpYWwodCxlKSxyKHQsW1wiaW5wdXRcIixcInNlbGVjdFwiLFwidGV4dGFyZWFcIl0pfWZ1bmN0aW9uIHNlcmlhbGl6ZVF1ZXJ5U3RyaW5nKCl7cmV0dXJuIHJlcXdlc3QudG9RdWVyeVN0cmluZyhyZXF3ZXN0LnNlcmlhbGl6ZUFycmF5LmFwcGx5KG51bGwsYXJndW1lbnRzKSl9ZnVuY3Rpb24gc2VyaWFsaXplSGFzaCgpe3ZhciBlPXt9O3JldHVybiBlYWNoRm9ybUVsZW1lbnQuYXBwbHkoZnVuY3Rpb24odCxuKXt0IGluIGU/KGVbdF0mJiFpc0FycmF5KGVbdF0pJiYoZVt0XT1bZVt0XV0pLGVbdF0ucHVzaChuKSk6ZVt0XT1ufSxhcmd1bWVudHMpLGV9ZnVuY3Rpb24gYnVpbGRQYXJhbXMoZSx0LG4scil7dmFyIGkscyxvLHU9L1xcW1xcXSQvO2lmKGlzQXJyYXkodCkpZm9yKHM9MDt0JiZzPHQubGVuZ3RoO3MrKylvPXRbc10sbnx8dS50ZXN0KGUpP3IoZSxvKTpidWlsZFBhcmFtcyhlK1wiW1wiKyh0eXBlb2Ygbz09XCJvYmplY3RcIj9zOlwiXCIpK1wiXVwiLG8sbixyKTtlbHNlIGlmKHQmJnQudG9TdHJpbmcoKT09PVwiW29iamVjdCBPYmplY3RdXCIpZm9yKGkgaW4gdClidWlsZFBhcmFtcyhlK1wiW1wiK2krXCJdXCIsdFtpXSxuLHIpO2Vsc2UgcihlLHQpfXZhciB3aW49d2luZG93LGRvYz1kb2N1bWVudCxodHRwc1JlPS9eaHR0cC8sdHdvSHVuZG89L14oMjBcXGR8MTIyMykkLyxieVRhZz1cImdldEVsZW1lbnRzQnlUYWdOYW1lXCIscmVhZHlTdGF0ZT1cInJlYWR5U3RhdGVcIixjb250ZW50VHlwZT1cIkNvbnRlbnQtVHlwZVwiLHJlcXVlc3RlZFdpdGg9XCJYLVJlcXVlc3RlZC1XaXRoXCIsaGVhZD1kb2NbYnlUYWddKFwiaGVhZFwiKVswXSx1bmlxaWQ9MCxjYWxsYmFja1ByZWZpeD1cInJlcXdlc3RfXCIrICsobmV3IERhdGUpLGxhc3RWYWx1ZSx4bWxIdHRwUmVxdWVzdD1cIlhNTEh0dHBSZXF1ZXN0XCIseERvbWFpblJlcXVlc3Q9XCJYRG9tYWluUmVxdWVzdFwiLG5vb3A9ZnVuY3Rpb24oKXt9LGlzQXJyYXk9dHlwZW9mIEFycmF5LmlzQXJyYXk9PVwiZnVuY3Rpb25cIj9BcnJheS5pc0FycmF5OmZ1bmN0aW9uKGUpe3JldHVybiBlIGluc3RhbmNlb2YgQXJyYXl9LGRlZmF1bHRIZWFkZXJzPXtjb250ZW50VHlwZTpcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiLHJlcXVlc3RlZFdpdGg6eG1sSHR0cFJlcXVlc3QsYWNjZXB0OntcIipcIjpcInRleHQvamF2YXNjcmlwdCwgdGV4dC9odG1sLCBhcHBsaWNhdGlvbi94bWwsIHRleHQveG1sLCAqLypcIix4bWw6XCJhcHBsaWNhdGlvbi94bWwsIHRleHQveG1sXCIsaHRtbDpcInRleHQvaHRtbFwiLHRleHQ6XCJ0ZXh0L3BsYWluXCIsanNvbjpcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvamF2YXNjcmlwdFwiLGpzOlwiYXBwbGljYXRpb24vamF2YXNjcmlwdCwgdGV4dC9qYXZhc2NyaXB0XCJ9fSx4aHI9ZnVuY3Rpb24oZSl7aWYoZS5jcm9zc09yaWdpbj09PSEwKXt2YXIgdD13aW5beG1sSHR0cFJlcXVlc3RdP25ldyBYTUxIdHRwUmVxdWVzdDpudWxsO2lmKHQmJlwid2l0aENyZWRlbnRpYWxzXCJpbiB0KXJldHVybiB0O2lmKHdpblt4RG9tYWluUmVxdWVzdF0pcmV0dXJuIG5ldyBYRG9tYWluUmVxdWVzdDt0aHJvdyBuZXcgRXJyb3IoXCJCcm93c2VyIGRvZXMgbm90IHN1cHBvcnQgY3Jvc3Mtb3JpZ2luIHJlcXVlc3RzXCIpfXJldHVybiB3aW5beG1sSHR0cFJlcXVlc3RdP25ldyBYTUxIdHRwUmVxdWVzdDpuZXcgQWN0aXZlWE9iamVjdChcIk1pY3Jvc29mdC5YTUxIVFRQXCIpfSxnbG9iYWxTZXR1cE9wdGlvbnM9e2RhdGFGaWx0ZXI6ZnVuY3Rpb24oZSl7cmV0dXJuIGV9fTtyZXR1cm4gUmVxd2VzdC5wcm90b3R5cGU9e2Fib3J0OmZ1bmN0aW9uKCl7dGhpcy5fYWJvcnRlZD0hMCx0aGlzLnJlcXVlc3QuYWJvcnQoKX0scmV0cnk6ZnVuY3Rpb24oKXtpbml0LmNhbGwodGhpcyx0aGlzLm8sdGhpcy5mbil9LHRoZW46ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZT1lfHxmdW5jdGlvbigpe30sdD10fHxmdW5jdGlvbigpe30sdGhpcy5fZnVsZmlsbGVkP3RoaXMuX3Jlc3BvbnNlQXJncy5yZXNwPWUodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3ApOnRoaXMuX2VycmVkP3QodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AsdGhpcy5fcmVzcG9uc2VBcmdzLm1zZyx0aGlzLl9yZXNwb25zZUFyZ3MudCk6KHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcnMucHVzaChlKSx0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2godCkpLHRoaXN9LGFsd2F5czpmdW5jdGlvbihlKXtyZXR1cm4gdGhpcy5fZnVsZmlsbGVkfHx0aGlzLl9lcnJlZD9lKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwKTp0aGlzLl9jb21wbGV0ZUhhbmRsZXJzLnB1c2goZSksdGhpc30sZmFpbDpmdW5jdGlvbihlKXtyZXR1cm4gdGhpcy5fZXJyZWQ/ZSh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCx0aGlzLl9yZXNwb25zZUFyZ3MubXNnLHRoaXMuX3Jlc3BvbnNlQXJncy50KTp0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZSksdGhpc30sXCJjYXRjaFwiOmZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLmZhaWwoZSl9fSxyZXF3ZXN0LnNlcmlhbGl6ZUFycmF5PWZ1bmN0aW9uKCl7dmFyIGU9W107cmV0dXJuIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbih0LG4pe2UucHVzaCh7bmFtZTp0LHZhbHVlOm59KX0sYXJndW1lbnRzKSxlfSxyZXF3ZXN0LnNlcmlhbGl6ZT1mdW5jdGlvbigpe2lmKGFyZ3VtZW50cy5sZW5ndGg9PT0wKXJldHVyblwiXCI7dmFyIGUsdCxuPUFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywwKTtyZXR1cm4gZT1uLnBvcCgpLGUmJmUubm9kZVR5cGUmJm4ucHVzaChlKSYmKGU9bnVsbCksZSYmKGU9ZS50eXBlKSxlPT1cIm1hcFwiP3Q9c2VyaWFsaXplSGFzaDplPT1cImFycmF5XCI/dD1yZXF3ZXN0LnNlcmlhbGl6ZUFycmF5OnQ9c2VyaWFsaXplUXVlcnlTdHJpbmcsdC5hcHBseShudWxsLG4pfSxyZXF3ZXN0LnRvUXVlcnlTdHJpbmc9ZnVuY3Rpb24oZSx0KXt2YXIgbixyLGk9dHx8ITEscz1bXSxvPWVuY29kZVVSSUNvbXBvbmVudCx1PWZ1bmN0aW9uKGUsdCl7dD1cImZ1bmN0aW9uXCI9PXR5cGVvZiB0P3QoKTp0PT1udWxsP1wiXCI6dCxzW3MubGVuZ3RoXT1vKGUpK1wiPVwiK28odCl9O2lmKGlzQXJyYXkoZSkpZm9yKHI9MDtlJiZyPGUubGVuZ3RoO3IrKyl1KGVbcl0ubmFtZSxlW3JdLnZhbHVlKTtlbHNlIGZvcihuIGluIGUpZS5oYXNPd25Qcm9wZXJ0eShuKSYmYnVpbGRQYXJhbXMobixlW25dLGksdSk7cmV0dXJuIHMuam9pbihcIiZcIikucmVwbGFjZSgvJTIwL2csXCIrXCIpfSxyZXF3ZXN0LmdldGNhbGxiYWNrUHJlZml4PWZ1bmN0aW9uKCl7cmV0dXJuIGNhbGxiYWNrUHJlZml4fSxyZXF3ZXN0LmNvbXBhdD1mdW5jdGlvbihlLHQpe3JldHVybiBlJiYoZS50eXBlJiYoZS5tZXRob2Q9ZS50eXBlKSYmZGVsZXRlIGUudHlwZSxlLmRhdGFUeXBlJiYoZS50eXBlPWUuZGF0YVR5cGUpLGUuanNvbnBDYWxsYmFjayYmKGUuanNvbnBDYWxsYmFja05hbWU9ZS5qc29ucENhbGxiYWNrKSYmZGVsZXRlIGUuanNvbnBDYWxsYmFjayxlLmpzb25wJiYoZS5qc29ucENhbGxiYWNrPWUuanNvbnApKSxuZXcgUmVxd2VzdChlLHQpfSxyZXF3ZXN0LmFqYXhTZXR1cD1mdW5jdGlvbihlKXtlPWV8fHt9O2Zvcih2YXIgdCBpbiBlKWdsb2JhbFNldHVwT3B0aW9uc1t0XT1lW3RdfSxyZXF3ZXN0fSkiLCIvKiFcbiAgKiBSZXF3ZXN0ISBBIGdlbmVyYWwgcHVycG9zZSBYSFIgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICogbGljZW5zZSBNSVQgKGMpIER1c3RpbiBEaWF6IDIwMTRcbiAgKiBodHRwczovL2dpdGh1Yi5jb20vZGVkL3JlcXdlc3RcbiAgKi9cblxuIWZ1bmN0aW9uIChuYW1lLCBjb250ZXh0LCBkZWZpbml0aW9uKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKVxuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGRlZmluaXRpb24pXG4gIGVsc2UgY29udGV4dFtuYW1lXSA9IGRlZmluaXRpb24oKVxufSgncmVxd2VzdCcsIHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuICB2YXIgd2luID0gd2luZG93XG4gICAgLCBkb2MgPSBkb2N1bWVudFxuICAgICwgaHR0cHNSZSA9IC9eaHR0cC9cbiAgICAsIHByb3RvY29sUmUgPSAvKF5cXHcrKTpcXC9cXC8vXG4gICAgLCB0d29IdW5kbyA9IC9eKDIwXFxkfDEyMjMpJC8gLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMDQ2OTcyL21zaWUtcmV0dXJucy1zdGF0dXMtY29kZS1vZi0xMjIzLWZvci1hamF4LXJlcXVlc3RcbiAgICAsIGJ5VGFnID0gJ2dldEVsZW1lbnRzQnlUYWdOYW1lJ1xuICAgICwgcmVhZHlTdGF0ZSA9ICdyZWFkeVN0YXRlJ1xuICAgICwgY29udGVudFR5cGUgPSAnQ29udGVudC1UeXBlJ1xuICAgICwgcmVxdWVzdGVkV2l0aCA9ICdYLVJlcXVlc3RlZC1XaXRoJ1xuICAgICwgaGVhZCA9IGRvY1tieVRhZ10oJ2hlYWQnKVswXVxuICAgICwgdW5pcWlkID0gMFxuICAgICwgY2FsbGJhY2tQcmVmaXggPSAncmVxd2VzdF8nICsgKCtuZXcgRGF0ZSgpKVxuICAgICwgbGFzdFZhbHVlIC8vIGRhdGEgc3RvcmVkIGJ5IHRoZSBtb3N0IHJlY2VudCBKU09OUCBjYWxsYmFja1xuICAgICwgeG1sSHR0cFJlcXVlc3QgPSAnWE1MSHR0cFJlcXVlc3QnXG4gICAgLCB4RG9tYWluUmVxdWVzdCA9ICdYRG9tYWluUmVxdWVzdCdcbiAgICAsIG5vb3AgPSBmdW5jdGlvbiAoKSB7fVxuXG4gICAgLCBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICA/IEFycmF5LmlzQXJyYXlcbiAgICAgICAgOiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgcmV0dXJuIGEgaW5zdGFuY2VvZiBBcnJheVxuICAgICAgICAgIH1cblxuICAgICwgZGVmYXVsdEhlYWRlcnMgPSB7XG4gICAgICAgICAgJ2NvbnRlbnRUeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbiAgICAgICAgLCAncmVxdWVzdGVkV2l0aCc6IHhtbEh0dHBSZXF1ZXN0XG4gICAgICAgICwgJ2FjY2VwdCc6IHtcbiAgICAgICAgICAgICAgJyonOiAgJ3RleHQvamF2YXNjcmlwdCwgdGV4dC9odG1sLCBhcHBsaWNhdGlvbi94bWwsIHRleHQveG1sLCAqLyonXG4gICAgICAgICAgICAsICd4bWwnOiAgJ2FwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwnXG4gICAgICAgICAgICAsICdodG1sJzogJ3RleHQvaHRtbCdcbiAgICAgICAgICAgICwgJ3RleHQnOiAndGV4dC9wbGFpbidcbiAgICAgICAgICAgICwgJ2pzb24nOiAnYXBwbGljYXRpb24vanNvbiwgdGV4dC9qYXZhc2NyaXB0J1xuICAgICAgICAgICAgLCAnanMnOiAgICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0LCB0ZXh0L2phdmFzY3JpcHQnXG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgLCB4aHIgPSBmdW5jdGlvbihvKSB7XG4gICAgICAgIC8vIGlzIGl0IHgtZG9tYWluXG4gICAgICAgIGlmIChvWydjcm9zc09yaWdpbiddID09PSB0cnVlKSB7XG4gICAgICAgICAgdmFyIHhociA9IHdpblt4bWxIdHRwUmVxdWVzdF0gPyBuZXcgWE1MSHR0cFJlcXVlc3QoKSA6IG51bGxcbiAgICAgICAgICBpZiAoeGhyICYmICd3aXRoQ3JlZGVudGlhbHMnIGluIHhocikge1xuICAgICAgICAgICAgcmV0dXJuIHhoclxuICAgICAgICAgIH0gZWxzZSBpZiAod2luW3hEb21haW5SZXF1ZXN0XSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRG9tYWluUmVxdWVzdCgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGNyb3NzLW9yaWdpbiByZXF1ZXN0cycpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHdpblt4bWxIdHRwUmVxdWVzdF0pIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFhNTEh0dHBSZXF1ZXN0KClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICwgZ2xvYmFsU2V0dXBPcHRpb25zID0ge1xuICAgICAgICBkYXRhRmlsdGVyOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgIH1cbiAgICAgIH1cblxuICBmdW5jdGlvbiBzdWNjZWVkKHIpIHtcbiAgICB2YXIgcHJvdG9jb2wgPSBwcm90b2NvbFJlLmV4ZWMoci51cmwpO1xuICAgIHByb3RvY29sID0gKHByb3RvY29sICYmIHByb3RvY29sWzFdKSB8fCB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2w7XG4gICAgcmV0dXJuIGh0dHBzUmUudGVzdChwcm90b2NvbCkgPyB0d29IdW5kby50ZXN0KHIucmVxdWVzdC5zdGF0dXMpIDogISFyLnJlcXVlc3QucmVzcG9uc2U7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVSZWFkeVN0YXRlKHIsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIHVzZSBfYWJvcnRlZCB0byBtaXRpZ2F0ZSBhZ2FpbnN0IElFIGVyciBjMDBjMDIzZlxuICAgICAgLy8gKGNhbid0IHJlYWQgcHJvcHMgb24gYWJvcnRlZCByZXF1ZXN0IG9iamVjdHMpXG4gICAgICBpZiAoci5fYWJvcnRlZCkgcmV0dXJuIGVycm9yKHIucmVxdWVzdClcbiAgICAgIGlmIChyLnJlcXVlc3QgJiYgci5yZXF1ZXN0W3JlYWR5U3RhdGVdID09IDQpIHtcbiAgICAgICAgci5yZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG5vb3BcbiAgICAgICAgaWYgKHN1Y2NlZWQocikpIHN1Y2Nlc3Moci5yZXF1ZXN0KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXJyb3Ioci5yZXF1ZXN0KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEhlYWRlcnMoaHR0cCwgbykge1xuICAgIHZhciBoZWFkZXJzID0gb1snaGVhZGVycyddIHx8IHt9XG4gICAgICAsIGhcblxuICAgIGhlYWRlcnNbJ0FjY2VwdCddID0gaGVhZGVyc1snQWNjZXB0J11cbiAgICAgIHx8IGRlZmF1bHRIZWFkZXJzWydhY2NlcHQnXVtvWyd0eXBlJ11dXG4gICAgICB8fCBkZWZhdWx0SGVhZGVyc1snYWNjZXB0J11bJyonXVxuXG4gICAgdmFyIGlzQUZvcm1EYXRhID0gdHlwZW9mIEZvcm1EYXRhID09PSAnZnVuY3Rpb24nICYmIChvWydkYXRhJ10gaW5zdGFuY2VvZiBGb3JtRGF0YSk7XG4gICAgLy8gYnJlYWtzIGNyb3NzLW9yaWdpbiByZXF1ZXN0cyB3aXRoIGxlZ2FjeSBicm93c2Vyc1xuICAgIGlmICghb1snY3Jvc3NPcmlnaW4nXSAmJiAhaGVhZGVyc1tyZXF1ZXN0ZWRXaXRoXSkgaGVhZGVyc1tyZXF1ZXN0ZWRXaXRoXSA9IGRlZmF1bHRIZWFkZXJzWydyZXF1ZXN0ZWRXaXRoJ11cbiAgICBpZiAoIWhlYWRlcnNbY29udGVudFR5cGVdICYmICFpc0FGb3JtRGF0YSkgaGVhZGVyc1tjb250ZW50VHlwZV0gPSBvWydjb250ZW50VHlwZSddIHx8IGRlZmF1bHRIZWFkZXJzWydjb250ZW50VHlwZSddXG4gICAgZm9yIChoIGluIGhlYWRlcnMpXG4gICAgICBoZWFkZXJzLmhhc093blByb3BlcnR5KGgpICYmICdzZXRSZXF1ZXN0SGVhZGVyJyBpbiBodHRwICYmIGh0dHAuc2V0UmVxdWVzdEhlYWRlcihoLCBoZWFkZXJzW2hdKVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0Q3JlZGVudGlhbHMoaHR0cCwgbykge1xuICAgIGlmICh0eXBlb2Ygb1snd2l0aENyZWRlbnRpYWxzJ10gIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBodHRwLndpdGhDcmVkZW50aWFscyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGh0dHAud2l0aENyZWRlbnRpYWxzID0gISFvWyd3aXRoQ3JlZGVudGlhbHMnXVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYWxDYWxsYmFjayhkYXRhKSB7XG4gICAgbGFzdFZhbHVlID0gZGF0YVxuICB9XG5cbiAgZnVuY3Rpb24gdXJsYXBwZW5kICh1cmwsIHMpIHtcbiAgICByZXR1cm4gdXJsICsgKC9cXD8vLnRlc3QodXJsKSA/ICcmJyA6ICc/JykgKyBzXG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVKc29ucChvLCBmbiwgZXJyLCB1cmwpIHtcbiAgICB2YXIgcmVxSWQgPSB1bmlxaWQrK1xuICAgICAgLCBjYmtleSA9IG9bJ2pzb25wQ2FsbGJhY2snXSB8fCAnY2FsbGJhY2snIC8vIHRoZSAnY2FsbGJhY2snIGtleVxuICAgICAgLCBjYnZhbCA9IG9bJ2pzb25wQ2FsbGJhY2tOYW1lJ10gfHwgcmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeChyZXFJZClcbiAgICAgICwgY2JyZWcgPSBuZXcgUmVnRXhwKCcoKF58XFxcXD98JiknICsgY2JrZXkgKyAnKT0oW14mXSspJylcbiAgICAgICwgbWF0Y2ggPSB1cmwubWF0Y2goY2JyZWcpXG4gICAgICAsIHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgICAgLCBsb2FkZWQgPSAwXG4gICAgICAsIGlzSUUxMCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignTVNJRSAxMC4wJykgIT09IC0xXG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGlmIChtYXRjaFszXSA9PT0gJz8nKSB7XG4gICAgICAgIHVybCA9IHVybC5yZXBsYWNlKGNicmVnLCAnJDE9JyArIGNidmFsKSAvLyB3aWxkY2FyZCBjYWxsYmFjayBmdW5jIG5hbWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNidmFsID0gbWF0Y2hbM10gLy8gcHJvdmlkZWQgY2FsbGJhY2sgZnVuYyBuYW1lXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybCA9IHVybGFwcGVuZCh1cmwsIGNia2V5ICsgJz0nICsgY2J2YWwpIC8vIG5vIGNhbGxiYWNrIGRldGFpbHMsIGFkZCAnZW1cbiAgICB9XG5cbiAgICB3aW5bY2J2YWxdID0gZ2VuZXJhbENhbGxiYWNrXG5cbiAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnXG4gICAgc2NyaXB0LnNyYyA9IHVybFxuICAgIHNjcmlwdC5hc3luYyA9IHRydWVcbiAgICBpZiAodHlwZW9mIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgIT09ICd1bmRlZmluZWQnICYmICFpc0lFMTApIHtcbiAgICAgIC8vIG5lZWQgdGhpcyBmb3IgSUUgZHVlIHRvIG91dC1vZi1vcmRlciBvbnJlYWR5c3RhdGVjaGFuZ2UoKSwgYmluZGluZyBzY3JpcHRcbiAgICAgIC8vIGV4ZWN1dGlvbiB0byBhbiBldmVudCBsaXN0ZW5lciBnaXZlcyB1cyBjb250cm9sIG92ZXIgd2hlbiB0aGUgc2NyaXB0XG4gICAgICAvLyBpcyBleGVjdXRlZC4gU2VlIGh0dHA6Ly9qYXVib3VyZy5uZXQvMjAxMC8wNy9sb2FkaW5nLXNjcmlwdC1hcy1vbmNsaWNrLWhhbmRsZXItb2YuaHRtbFxuICAgICAgc2NyaXB0Lmh0bWxGb3IgPSBzY3JpcHQuaWQgPSAnX3JlcXdlc3RfJyArIHJlcUlkXG4gICAgfVxuXG4gICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoKHNjcmlwdFtyZWFkeVN0YXRlXSAmJiBzY3JpcHRbcmVhZHlTdGF0ZV0gIT09ICdjb21wbGV0ZScgJiYgc2NyaXB0W3JlYWR5U3RhdGVdICE9PSAnbG9hZGVkJykgfHwgbG9hZGVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsXG4gICAgICBzY3JpcHQub25jbGljayAmJiBzY3JpcHQub25jbGljaygpXG4gICAgICAvLyBDYWxsIHRoZSB1c2VyIGNhbGxiYWNrIHdpdGggdGhlIGxhc3QgdmFsdWUgc3RvcmVkIGFuZCBjbGVhbiB1cCB2YWx1ZXMgYW5kIHNjcmlwdHMuXG4gICAgICBmbihsYXN0VmFsdWUpXG4gICAgICBsYXN0VmFsdWUgPSB1bmRlZmluZWRcbiAgICAgIGhlYWQucmVtb3ZlQ2hpbGQoc2NyaXB0KVxuICAgICAgbG9hZGVkID0gMVxuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgc2NyaXB0IHRvIHRoZSBET00gaGVhZFxuICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuXG4gICAgLy8gRW5hYmxlIEpTT05QIHRpbWVvdXRcbiAgICByZXR1cm4ge1xuICAgICAgYWJvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsXG4gICAgICAgIGVycih7fSwgJ1JlcXVlc3QgaXMgYWJvcnRlZDogdGltZW91dCcsIHt9KVxuICAgICAgICBsYXN0VmFsdWUgPSB1bmRlZmluZWRcbiAgICAgICAgaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICAgIGxvYWRlZCA9IDFcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRSZXF1ZXN0KGZuLCBlcnIpIHtcbiAgICB2YXIgbyA9IHRoaXMub1xuICAgICAgLCBtZXRob2QgPSAob1snbWV0aG9kJ10gfHwgJ0dFVCcpLnRvVXBwZXJDYXNlKClcbiAgICAgICwgdXJsID0gdHlwZW9mIG8gPT09ICdzdHJpbmcnID8gbyA6IG9bJ3VybCddXG4gICAgICAvLyBjb252ZXJ0IG5vbi1zdHJpbmcgb2JqZWN0cyB0byBxdWVyeS1zdHJpbmcgZm9ybSB1bmxlc3Mgb1sncHJvY2Vzc0RhdGEnXSBpcyBmYWxzZVxuICAgICAgLCBkYXRhID0gKG9bJ3Byb2Nlc3NEYXRhJ10gIT09IGZhbHNlICYmIG9bJ2RhdGEnXSAmJiB0eXBlb2Ygb1snZGF0YSddICE9PSAnc3RyaW5nJylcbiAgICAgICAgPyByZXF3ZXN0LnRvUXVlcnlTdHJpbmcob1snZGF0YSddKVxuICAgICAgICA6IChvWydkYXRhJ10gfHwgbnVsbClcbiAgICAgICwgaHR0cFxuICAgICAgLCBzZW5kV2FpdCA9IGZhbHNlXG5cbiAgICAvLyBpZiB3ZSdyZSB3b3JraW5nIG9uIGEgR0VUIHJlcXVlc3QgYW5kIHdlIGhhdmUgZGF0YSB0aGVuIHdlIHNob3VsZCBhcHBlbmRcbiAgICAvLyBxdWVyeSBzdHJpbmcgdG8gZW5kIG9mIFVSTCBhbmQgbm90IHBvc3QgZGF0YVxuICAgIGlmICgob1sndHlwZSddID09ICdqc29ucCcgfHwgbWV0aG9kID09ICdHRVQnKSAmJiBkYXRhKSB7XG4gICAgICB1cmwgPSB1cmxhcHBlbmQodXJsLCBkYXRhKVxuICAgICAgZGF0YSA9IG51bGxcbiAgICB9XG5cbiAgICBpZiAob1sndHlwZSddID09ICdqc29ucCcpIHJldHVybiBoYW5kbGVKc29ucChvLCBmbiwgZXJyLCB1cmwpXG5cbiAgICAvLyBnZXQgdGhlIHhociBmcm9tIHRoZSBmYWN0b3J5IGlmIHBhc3NlZFxuICAgIC8vIGlmIHRoZSBmYWN0b3J5IHJldHVybnMgbnVsbCwgZmFsbC1iYWNrIHRvIG91cnNcbiAgICBodHRwID0gKG8ueGhyICYmIG8ueGhyKG8pKSB8fCB4aHIobylcblxuICAgIGh0dHAub3BlbihtZXRob2QsIHVybCwgb1snYXN5bmMnXSA9PT0gZmFsc2UgPyBmYWxzZSA6IHRydWUpXG4gICAgc2V0SGVhZGVycyhodHRwLCBvKVxuICAgIHNldENyZWRlbnRpYWxzKGh0dHAsIG8pXG4gICAgaWYgKHdpblt4RG9tYWluUmVxdWVzdF0gJiYgaHR0cCBpbnN0YW5jZW9mIHdpblt4RG9tYWluUmVxdWVzdF0pIHtcbiAgICAgICAgaHR0cC5vbmxvYWQgPSBmblxuICAgICAgICBodHRwLm9uZXJyb3IgPSBlcnJcbiAgICAgICAgLy8gTk9URTogc2VlXG4gICAgICAgIC8vIGh0dHA6Ly9zb2NpYWwubXNkbi5taWNyb3NvZnQuY29tL0ZvcnVtcy9lbi1VUy9pZXdlYmRldmVsb3BtZW50L3RocmVhZC8zMGVmM2FkZC03NjdjLTQ0MzYtYjhhOS1mMWNhMTliNDgxMmVcbiAgICAgICAgaHR0cC5vbnByb2dyZXNzID0gZnVuY3Rpb24oKSB7fVxuICAgICAgICBzZW5kV2FpdCA9IHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgaHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBoYW5kbGVSZWFkeVN0YXRlKHRoaXMsIGZuLCBlcnIpXG4gICAgfVxuICAgIG9bJ2JlZm9yZSddICYmIG9bJ2JlZm9yZSddKGh0dHApXG4gICAgaWYgKHNlbmRXYWl0KSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaHR0cC5zZW5kKGRhdGEpXG4gICAgICB9LCAyMDApXG4gICAgfSBlbHNlIHtcbiAgICAgIGh0dHAuc2VuZChkYXRhKVxuICAgIH1cbiAgICByZXR1cm4gaHR0cFxuICB9XG5cbiAgZnVuY3Rpb24gUmVxd2VzdChvLCBmbikge1xuICAgIHRoaXMubyA9IG9cbiAgICB0aGlzLmZuID0gZm5cblxuICAgIGluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0VHlwZShoZWFkZXIpIHtcbiAgICAvLyBqc29uLCBqYXZhc2NyaXB0LCB0ZXh0L3BsYWluLCB0ZXh0L2h0bWwsIHhtbFxuICAgIGlmIChoZWFkZXIubWF0Y2goJ2pzb24nKSkgcmV0dXJuICdqc29uJ1xuICAgIGlmIChoZWFkZXIubWF0Y2goJ2phdmFzY3JpcHQnKSkgcmV0dXJuICdqcydcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCd0ZXh0JykpIHJldHVybiAnaHRtbCdcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCd4bWwnKSkgcmV0dXJuICd4bWwnXG4gIH1cblxuICBmdW5jdGlvbiBpbml0KG8sIGZuKSB7XG5cbiAgICB0aGlzLnVybCA9IHR5cGVvZiBvID09ICdzdHJpbmcnID8gbyA6IG9bJ3VybCddXG4gICAgdGhpcy50aW1lb3V0ID0gbnVsbFxuXG4gICAgLy8gd2hldGhlciByZXF1ZXN0IGhhcyBiZWVuIGZ1bGZpbGxlZCBmb3IgcHVycG9zZVxuICAgIC8vIG9mIHRyYWNraW5nIHRoZSBQcm9taXNlc1xuICAgIHRoaXMuX2Z1bGZpbGxlZCA9IGZhbHNlXG4gICAgLy8gc3VjY2VzcyBoYW5kbGVyc1xuICAgIHRoaXMuX3N1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24oKXt9XG4gICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycyA9IFtdXG4gICAgLy8gZXJyb3IgaGFuZGxlcnNcbiAgICB0aGlzLl9lcnJvckhhbmRsZXJzID0gW11cbiAgICAvLyBjb21wbGV0ZSAoYm90aCBzdWNjZXNzIGFuZCBmYWlsKSBoYW5kbGVyc1xuICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMgPSBbXVxuICAgIHRoaXMuX2VycmVkID0gZmFsc2VcbiAgICB0aGlzLl9yZXNwb25zZUFyZ3MgPSB7fVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgICBmbiA9IGZuIHx8IGZ1bmN0aW9uICgpIHt9XG5cbiAgICBpZiAob1sndGltZW91dCddKSB7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5hYm9ydCgpXG4gICAgICB9LCBvWyd0aW1lb3V0J10pXG4gICAgfVxuXG4gICAgaWYgKG9bJ3N1Y2Nlc3MnXSkge1xuICAgICAgdGhpcy5fc3VjY2Vzc0hhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9bJ3N1Y2Nlc3MnXS5hcHBseShvLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9bJ2Vycm9yJ10pIHtcbiAgICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9bJ2Vycm9yJ10uYXBwbHkobywgYXJndW1lbnRzKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAob1snY29tcGxldGUnXSkge1xuICAgICAgdGhpcy5fY29tcGxldGVIYW5kbGVycy5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb1snY29tcGxldGUnXS5hcHBseShvLCBhcmd1bWVudHMpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXBsZXRlIChyZXNwKSB7XG4gICAgICBvWyd0aW1lb3V0J10gJiYgY2xlYXJUaW1lb3V0KHNlbGYudGltZW91dClcbiAgICAgIHNlbGYudGltZW91dCA9IG51bGxcbiAgICAgIHdoaWxlIChzZWxmLl9jb21wbGV0ZUhhbmRsZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2VsZi5fY29tcGxldGVIYW5kbGVycy5zaGlmdCgpKHJlc3ApXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyAocmVzcCkge1xuICAgICAgdmFyIHR5cGUgPSBvWyd0eXBlJ10gfHwgcmVzcCAmJiBzZXRUeXBlKHJlc3AuZ2V0UmVzcG9uc2VIZWFkZXIoJ0NvbnRlbnQtVHlwZScpKSAvLyByZXNwIGNhbiBiZSB1bmRlZmluZWQgaW4gSUVcbiAgICAgIHJlc3AgPSAodHlwZSAhPT0gJ2pzb25wJykgPyBzZWxmLnJlcXVlc3QgOiByZXNwXG4gICAgICAvLyB1c2UgZ2xvYmFsIGRhdGEgZmlsdGVyIG9uIHJlc3BvbnNlIHRleHRcbiAgICAgIHZhciBmaWx0ZXJlZFJlc3BvbnNlID0gZ2xvYmFsU2V0dXBPcHRpb25zLmRhdGFGaWx0ZXIocmVzcC5yZXNwb25zZVRleHQsIHR5cGUpXG4gICAgICAgICwgciA9IGZpbHRlcmVkUmVzcG9uc2VcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3AucmVzcG9uc2VUZXh0ID0gclxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBjYW4ndCBhc3NpZ24gdGhpcyBpbiBJRTw9OCwganVzdCBpZ25vcmVcbiAgICAgIH1cbiAgICAgIGlmIChyKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdqc29uJzpcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzcCA9IHdpbi5KU09OID8gd2luLkpTT04ucGFyc2UocikgOiBldmFsKCcoJyArIHIgKyAnKScpXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3IocmVzcCwgJ0NvdWxkIG5vdCBwYXJzZSBKU09OIGluIHJlc3BvbnNlJywgZXJyKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdqcyc6XG4gICAgICAgICAgcmVzcCA9IGV2YWwocilcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdodG1sJzpcbiAgICAgICAgICByZXNwID0gclxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3htbCc6XG4gICAgICAgICAgcmVzcCA9IHJlc3AucmVzcG9uc2VYTUxcbiAgICAgICAgICAgICAgJiYgcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yIC8vIElFIHRyb2xvbG9cbiAgICAgICAgICAgICAgJiYgcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yLmVycm9yQ29kZVxuICAgICAgICAgICAgICAmJiByZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IucmVhc29uXG4gICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgIDogcmVzcC5yZXNwb25zZVhNTFxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLnJlc3AgPSByZXNwXG4gICAgICBzZWxmLl9mdWxmaWxsZWQgPSB0cnVlXG4gICAgICBmbihyZXNwKVxuICAgICAgc2VsZi5fc3VjY2Vzc0hhbmRsZXIocmVzcClcbiAgICAgIHdoaWxlIChzZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzcCA9IHNlbGYuX2Z1bGZpbGxtZW50SGFuZGxlcnMuc2hpZnQoKShyZXNwKVxuICAgICAgfVxuXG4gICAgICBjb21wbGV0ZShyZXNwKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKHJlc3AsIG1zZywgdCkge1xuICAgICAgcmVzcCA9IHNlbGYucmVxdWVzdFxuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLnJlc3AgPSByZXNwXG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MubXNnID0gbXNnXG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MudCA9IHRcbiAgICAgIHNlbGYuX2VycmVkID0gdHJ1ZVxuICAgICAgd2hpbGUgKHNlbGYuX2Vycm9ySGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBzZWxmLl9lcnJvckhhbmRsZXJzLnNoaWZ0KCkocmVzcCwgbXNnLCB0KVxuICAgICAgfVxuICAgICAgY29tcGxldGUocmVzcClcbiAgICB9XG5cbiAgICB0aGlzLnJlcXVlc3QgPSBnZXRSZXF1ZXN0LmNhbGwodGhpcywgc3VjY2VzcywgZXJyb3IpXG4gIH1cblxuICBSZXF3ZXN0LnByb3RvdHlwZSA9IHtcbiAgICBhYm9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5fYWJvcnRlZCA9IHRydWVcbiAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpXG4gICAgfVxuXG4gICwgcmV0cnk6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGluaXQuY2FsbCh0aGlzLCB0aGlzLm8sIHRoaXMuZm4pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU21hbGwgZGV2aWF0aW9uIGZyb20gdGhlIFByb21pc2VzIEEgQ29tbW9uSnMgc3BlY2lmaWNhdGlvblxuICAgICAqIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1Byb21pc2VzL0FcbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIGB0aGVuYCB3aWxsIGV4ZWN1dGUgdXBvbiBzdWNjZXNzZnVsIHJlcXVlc3RzXG4gICAgICovXG4gICwgdGhlbjogZnVuY3Rpb24gKHN1Y2Nlc3MsIGZhaWwpIHtcbiAgICAgIHN1Y2Nlc3MgPSBzdWNjZXNzIHx8IGZ1bmN0aW9uICgpIHt9XG4gICAgICBmYWlsID0gZmFpbCB8fCBmdW5jdGlvbiAoKSB7fVxuICAgICAgaWYgKHRoaXMuX2Z1bGZpbGxlZCkge1xuICAgICAgICB0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCA9IHN1Y2Nlc3ModGhpcy5fcmVzcG9uc2VBcmdzLnJlc3ApXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2VycmVkKSB7XG4gICAgICAgIGZhaWwodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AsIHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csIHRoaXMuX3Jlc3BvbnNlQXJncy50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycy5wdXNoKHN1Y2Nlc3MpXG4gICAgICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChmYWlsKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBgYWx3YXlzYCB3aWxsIGV4ZWN1dGUgd2hldGhlciB0aGUgcmVxdWVzdCBzdWNjZWVkcyBvciBmYWlsc1xuICAgICAqL1xuICAsIGFsd2F5czogZnVuY3Rpb24gKGZuKSB7XG4gICAgICBpZiAodGhpcy5fZnVsZmlsbGVkIHx8IHRoaXMuX2VycmVkKSB7XG4gICAgICAgIGZuKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY29tcGxldGVIYW5kbGVycy5wdXNoKGZuKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBgZmFpbGAgd2lsbCBleGVjdXRlIHdoZW4gdGhlIHJlcXVlc3QgZmFpbHNcbiAgICAgKi9cbiAgLCBmYWlsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIGlmICh0aGlzLl9lcnJlZCkge1xuICAgICAgICBmbih0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCwgdGhpcy5fcmVzcG9uc2VBcmdzLm1zZywgdGhpcy5fcmVzcG9uc2VBcmdzLnQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZm4pXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgLCAnY2F0Y2gnOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiB0aGlzLmZhaWwoZm4pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVxd2VzdChvLCBmbikge1xuICAgIHJldHVybiBuZXcgUmVxd2VzdChvLCBmbilcbiAgfVxuXG4gIC8vIG5vcm1hbGl6ZSBuZXdsaW5lIHZhcmlhbnRzIGFjY29yZGluZyB0byBzcGVjIC0+IENSTEZcbiAgZnVuY3Rpb24gbm9ybWFsaXplKHMpIHtcbiAgICByZXR1cm4gcyA/IHMucmVwbGFjZSgvXFxyP1xcbi9nLCAnXFxyXFxuJykgOiAnJ1xuICB9XG5cbiAgZnVuY3Rpb24gc2VyaWFsKGVsLCBjYikge1xuICAgIHZhciBuID0gZWwubmFtZVxuICAgICAgLCB0ID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAsIG9wdENiID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAvLyBJRSBnaXZlcyB2YWx1ZT1cIlwiIGV2ZW4gd2hlcmUgdGhlcmUgaXMgbm8gdmFsdWUgYXR0cmlidXRlXG4gICAgICAgICAgLy8gJ3NwZWNpZmllZCcgcmVmOiBodHRwOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMy1Db3JlL2NvcmUuaHRtbCNJRC04NjI1MjkyNzNcbiAgICAgICAgICBpZiAobyAmJiAhb1snZGlzYWJsZWQnXSlcbiAgICAgICAgICAgIGNiKG4sIG5vcm1hbGl6ZShvWydhdHRyaWJ1dGVzJ11bJ3ZhbHVlJ10gJiYgb1snYXR0cmlidXRlcyddWyd2YWx1ZSddWydzcGVjaWZpZWQnXSA/IG9bJ3ZhbHVlJ10gOiBvWyd0ZXh0J10pKVxuICAgICAgICB9XG4gICAgICAsIGNoLCByYSwgdmFsLCBpXG5cbiAgICAvLyBkb24ndCBzZXJpYWxpemUgZWxlbWVudHMgdGhhdCBhcmUgZGlzYWJsZWQgb3Igd2l0aG91dCBhIG5hbWVcbiAgICBpZiAoZWwuZGlzYWJsZWQgfHwgIW4pIHJldHVyblxuXG4gICAgc3dpdGNoICh0KSB7XG4gICAgY2FzZSAnaW5wdXQnOlxuICAgICAgaWYgKCEvcmVzZXR8YnV0dG9ufGltYWdlfGZpbGUvaS50ZXN0KGVsLnR5cGUpKSB7XG4gICAgICAgIGNoID0gL2NoZWNrYm94L2kudGVzdChlbC50eXBlKVxuICAgICAgICByYSA9IC9yYWRpby9pLnRlc3QoZWwudHlwZSlcbiAgICAgICAgdmFsID0gZWwudmFsdWVcbiAgICAgICAgLy8gV2ViS2l0IGdpdmVzIHVzIFwiXCIgaW5zdGVhZCBvZiBcIm9uXCIgaWYgYSBjaGVja2JveCBoYXMgbm8gdmFsdWUsIHNvIGNvcnJlY3QgaXQgaGVyZVxuICAgICAgICA7KCEoY2ggfHwgcmEpIHx8IGVsLmNoZWNrZWQpICYmIGNiKG4sIG5vcm1hbGl6ZShjaCAmJiB2YWwgPT09ICcnID8gJ29uJyA6IHZhbCkpXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGNhc2UgJ3RleHRhcmVhJzpcbiAgICAgIGNiKG4sIG5vcm1hbGl6ZShlbC52YWx1ZSkpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBpZiAoZWwudHlwZS50b0xvd2VyQ2FzZSgpID09PSAnc2VsZWN0LW9uZScpIHtcbiAgICAgICAgb3B0Q2IoZWwuc2VsZWN0ZWRJbmRleCA+PSAwID8gZWwub3B0aW9uc1tlbC5zZWxlY3RlZEluZGV4XSA6IG51bGwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwOyBlbC5sZW5ndGggJiYgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZWwub3B0aW9uc1tpXS5zZWxlY3RlZCAmJiBvcHRDYihlbC5vcHRpb25zW2ldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIC8vIGNvbGxlY3QgdXAgYWxsIGZvcm0gZWxlbWVudHMgZm91bmQgZnJvbSB0aGUgcGFzc2VkIGFyZ3VtZW50IGVsZW1lbnRzIGFsbFxuICAvLyB0aGUgd2F5IGRvd24gdG8gY2hpbGQgZWxlbWVudHM7IHBhc3MgYSAnPGZvcm0+JyBvciBmb3JtIGZpZWxkcy5cbiAgLy8gY2FsbGVkIHdpdGggJ3RoaXMnPWNhbGxiYWNrIHRvIHVzZSBmb3Igc2VyaWFsKCkgb24gZWFjaCBlbGVtZW50XG4gIGZ1bmN0aW9uIGVhY2hGb3JtRWxlbWVudCgpIHtcbiAgICB2YXIgY2IgPSB0aGlzXG4gICAgICAsIGUsIGlcbiAgICAgICwgc2VyaWFsaXplU3VidGFncyA9IGZ1bmN0aW9uIChlLCB0YWdzKSB7XG4gICAgICAgICAgdmFyIGksIGosIGZhXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZhID0gZVtieVRhZ10odGFnc1tpXSlcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBmYS5sZW5ndGg7IGorKykgc2VyaWFsKGZhW2pdLCBjYilcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGUgPSBhcmd1bWVudHNbaV1cbiAgICAgIGlmICgvaW5wdXR8c2VsZWN0fHRleHRhcmVhL2kudGVzdChlLnRhZ05hbWUpKSBzZXJpYWwoZSwgY2IpXG4gICAgICBzZXJpYWxpemVTdWJ0YWdzKGUsIFsgJ2lucHV0JywgJ3NlbGVjdCcsICd0ZXh0YXJlYScgXSlcbiAgICB9XG4gIH1cblxuICAvLyBzdGFuZGFyZCBxdWVyeSBzdHJpbmcgc3R5bGUgc2VyaWFsaXphdGlvblxuICBmdW5jdGlvbiBzZXJpYWxpemVRdWVyeVN0cmluZygpIHtcbiAgICByZXR1cm4gcmVxd2VzdC50b1F1ZXJ5U3RyaW5nKHJlcXdlc3Quc2VyaWFsaXplQXJyYXkuYXBwbHkobnVsbCwgYXJndW1lbnRzKSlcbiAgfVxuXG4gIC8vIHsgJ25hbWUnOiAndmFsdWUnLCAuLi4gfSBzdHlsZSBzZXJpYWxpemF0aW9uXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZUhhc2goKSB7XG4gICAgdmFyIGhhc2ggPSB7fVxuICAgIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgIGlmIChuYW1lIGluIGhhc2gpIHtcbiAgICAgICAgaGFzaFtuYW1lXSAmJiAhaXNBcnJheShoYXNoW25hbWVdKSAmJiAoaGFzaFtuYW1lXSA9IFtoYXNoW25hbWVdXSlcbiAgICAgICAgaGFzaFtuYW1lXS5wdXNoKHZhbHVlKVxuICAgICAgfSBlbHNlIGhhc2hbbmFtZV0gPSB2YWx1ZVxuICAgIH0sIGFyZ3VtZW50cylcbiAgICByZXR1cm4gaGFzaFxuICB9XG5cbiAgLy8gWyB7IG5hbWU6ICduYW1lJywgdmFsdWU6ICd2YWx1ZScgfSwgLi4uIF0gc3R5bGUgc2VyaWFsaXphdGlvblxuICByZXF3ZXN0LnNlcmlhbGl6ZUFycmF5ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcnIgPSBbXVxuICAgIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgIGFyci5wdXNoKHtuYW1lOiBuYW1lLCB2YWx1ZTogdmFsdWV9KVxuICAgIH0sIGFyZ3VtZW50cylcbiAgICByZXR1cm4gYXJyXG4gIH1cblxuICByZXF3ZXN0LnNlcmlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gICAgdmFyIG9wdCwgZm5cbiAgICAgICwgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMClcblxuICAgIG9wdCA9IGFyZ3MucG9wKClcbiAgICBvcHQgJiYgb3B0Lm5vZGVUeXBlICYmIGFyZ3MucHVzaChvcHQpICYmIChvcHQgPSBudWxsKVxuICAgIG9wdCAmJiAob3B0ID0gb3B0LnR5cGUpXG5cbiAgICBpZiAob3B0ID09ICdtYXAnKSBmbiA9IHNlcmlhbGl6ZUhhc2hcbiAgICBlbHNlIGlmIChvcHQgPT0gJ2FycmF5JykgZm4gPSByZXF3ZXN0LnNlcmlhbGl6ZUFycmF5XG4gICAgZWxzZSBmbiA9IHNlcmlhbGl6ZVF1ZXJ5U3RyaW5nXG5cbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxuXG4gIHJlcXdlc3QudG9RdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvLCB0cmFkKSB7XG4gICAgdmFyIHByZWZpeCwgaVxuICAgICAgLCB0cmFkaXRpb25hbCA9IHRyYWQgfHwgZmFsc2VcbiAgICAgICwgcyA9IFtdXG4gICAgICAsIGVuYyA9IGVuY29kZVVSSUNvbXBvbmVudFxuICAgICAgLCBhZGQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgIC8vIElmIHZhbHVlIGlzIGEgZnVuY3Rpb24sIGludm9rZSBpdCBhbmQgcmV0dXJuIGl0cyB2YWx1ZVxuICAgICAgICAgIHZhbHVlID0gKCdmdW5jdGlvbicgPT09IHR5cGVvZiB2YWx1ZSkgPyB2YWx1ZSgpIDogKHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlKVxuICAgICAgICAgIHNbcy5sZW5ndGhdID0gZW5jKGtleSkgKyAnPScgKyBlbmModmFsdWUpXG4gICAgICAgIH1cbiAgICAvLyBJZiBhbiBhcnJheSB3YXMgcGFzc2VkIGluLCBhc3N1bWUgdGhhdCBpdCBpcyBhbiBhcnJheSBvZiBmb3JtIGVsZW1lbnRzLlxuICAgIGlmIChpc0FycmF5KG8pKSB7XG4gICAgICBmb3IgKGkgPSAwOyBvICYmIGkgPCBvLmxlbmd0aDsgaSsrKSBhZGQob1tpXVsnbmFtZSddLCBvW2ldWyd2YWx1ZSddKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0cmFkaXRpb25hbCwgZW5jb2RlIHRoZSBcIm9sZFwiIHdheSAodGhlIHdheSAxLjMuMiBvciBvbGRlclxuICAgICAgLy8gZGlkIGl0KSwgb3RoZXJ3aXNlIGVuY29kZSBwYXJhbXMgcmVjdXJzaXZlbHkuXG4gICAgICBmb3IgKHByZWZpeCBpbiBvKSB7XG4gICAgICAgIGlmIChvLmhhc093blByb3BlcnR5KHByZWZpeCkpIGJ1aWxkUGFyYW1zKHByZWZpeCwgb1twcmVmaXhdLCB0cmFkaXRpb25hbCwgYWRkKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNwYWNlcyBzaG91bGQgYmUgKyBhY2NvcmRpbmcgdG8gc3BlY1xuICAgIHJldHVybiBzLmpvaW4oJyYnKS5yZXBsYWNlKC8lMjAvZywgJysnKVxuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRQYXJhbXMocHJlZml4LCBvYmosIHRyYWRpdGlvbmFsLCBhZGQpIHtcbiAgICB2YXIgbmFtZSwgaSwgdlxuICAgICAgLCByYnJhY2tldCA9IC9cXFtcXF0kL1xuXG4gICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgLy8gU2VyaWFsaXplIGFycmF5IGl0ZW0uXG4gICAgICBmb3IgKGkgPSAwOyBvYmogJiYgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgICB2ID0gb2JqW2ldXG4gICAgICAgIGlmICh0cmFkaXRpb25hbCB8fCByYnJhY2tldC50ZXN0KHByZWZpeCkpIHtcbiAgICAgICAgICAvLyBUcmVhdCBlYWNoIGFycmF5IGl0ZW0gYXMgYSBzY2FsYXIuXG4gICAgICAgICAgYWRkKHByZWZpeCwgdilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBidWlsZFBhcmFtcyhwcmVmaXggKyAnWycgKyAodHlwZW9mIHYgPT09ICdvYmplY3QnID8gaSA6ICcnKSArICddJywgdiwgdHJhZGl0aW9uYWwsIGFkZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob2JqICYmIG9iai50b1N0cmluZygpID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgLy8gU2VyaWFsaXplIG9iamVjdCBpdGVtLlxuICAgICAgZm9yIChuYW1lIGluIG9iaikge1xuICAgICAgICBidWlsZFBhcmFtcyhwcmVmaXggKyAnWycgKyBuYW1lICsgJ10nLCBvYmpbbmFtZV0sIHRyYWRpdGlvbmFsLCBhZGQpXG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU2VyaWFsaXplIHNjYWxhciBpdGVtLlxuICAgICAgYWRkKHByZWZpeCwgb2JqKVxuICAgIH1cbiAgfVxuXG4gIHJlcXdlc3QuZ2V0Y2FsbGJhY2tQcmVmaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrUHJlZml4XG4gIH1cblxuICAvLyBqUXVlcnkgYW5kIFplcHRvIGNvbXBhdGliaWxpdHksIGRpZmZlcmVuY2VzIGNhbiBiZSByZW1hcHBlZCBoZXJlIHNvIHlvdSBjYW4gY2FsbFxuICAvLyAuYWpheC5jb21wYXQob3B0aW9ucywgY2FsbGJhY2spXG4gIHJlcXdlc3QuY29tcGF0ID0gZnVuY3Rpb24gKG8sIGZuKSB7XG4gICAgaWYgKG8pIHtcbiAgICAgIG9bJ3R5cGUnXSAmJiAob1snbWV0aG9kJ10gPSBvWyd0eXBlJ10pICYmIGRlbGV0ZSBvWyd0eXBlJ11cbiAgICAgIG9bJ2RhdGFUeXBlJ10gJiYgKG9bJ3R5cGUnXSA9IG9bJ2RhdGFUeXBlJ10pXG4gICAgICBvWydqc29ucENhbGxiYWNrJ10gJiYgKG9bJ2pzb25wQ2FsbGJhY2tOYW1lJ10gPSBvWydqc29ucENhbGxiYWNrJ10pICYmIGRlbGV0ZSBvWydqc29ucENhbGxiYWNrJ11cbiAgICAgIG9bJ2pzb25wJ10gJiYgKG9bJ2pzb25wQ2FsbGJhY2snXSA9IG9bJ2pzb25wJ10pXG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVxd2VzdChvLCBmbilcbiAgfVxuXG4gIHJlcXdlc3QuYWpheFNldHVwID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIGZvciAodmFyIGsgaW4gb3B0aW9ucykge1xuICAgICAgZ2xvYmFsU2V0dXBPcHRpb25zW2tdID0gb3B0aW9uc1trXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXF3ZXN0XG59KTtcbiIsInZhciBoZWFkZXIgPSByZXF1aXJlKFwiLi8uLi9ib3dlcl9jb21wb25lbnRzL25leHQtaGVhZGVyL21haW4uanNcIik7XG4iXX0=
