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

},{"./../dom-delegate/lib/delegate.js":1,"./../next-user-preferences/src/main.js":7,"./../reqwest/reqwest.js":10,"./src/js/Notify":3}],3:[function(require,module,exports){
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
/*! Raven.js 1.1.16 (463f68f) | github.com/getsentry/raven-js */

/*
 * Includes TraceKit
 * https://github.com/getsentry/TraceKit
 *
 * Copyright 2014 Matt Robenolt and other contributors
 * Released under the BSD license
 * https://github.com/getsentry/raven-js/blob/master/LICENSE
 *
 */
;(function(window, undefined){
'use strict';

/*
 TraceKit - Cross brower stack traces - github.com/occ/TraceKit
 MIT license
*/

var TraceKit = {
    remoteFetching: false,
    collectWindowErrors: true,
    // 3 lines before, the offending line, 3 lines after
    linesOfContext: 7
};

// global reference to slice
var _slice = [].slice;
var UNKNOWN_FUNCTION = '?';


/**
 * TraceKit.wrap: Wrap any function in a TraceKit reporter
 * Example: func = TraceKit.wrap(func);
 *
 * @param {Function} func Function to be wrapped
 * @return {Function} The wrapped func
 */
TraceKit.wrap = function traceKitWrapper(func) {
    function wrapped() {
        try {
            return func.apply(this, arguments);
        } catch (e) {
            TraceKit.report(e);
            throw e;
        }
    }
    return wrapped;
};

/**
 * TraceKit.report: cross-browser processing of unhandled exceptions
 *
 * Syntax:
 *   TraceKit.report.subscribe(function(stackInfo) { ... })
 *   TraceKit.report.unsubscribe(function(stackInfo) { ... })
 *   TraceKit.report(exception)
 *   try { ...code... } catch(ex) { TraceKit.report(ex); }
 *
 * Supports:
 *   - Firefox: full stack trace with line numbers, plus column number
 *              on top frame; column number is not guaranteed
 *   - Opera:   full stack trace with line and column numbers
 *   - Chrome:  full stack trace with line and column numbers
 *   - Safari:  line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *   - IE:      line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *
 * In theory, TraceKit should work on all of the following versions:
 *   - IE5.5+ (only 8.0 tested)
 *   - Firefox 0.9+ (only 3.5+ tested)
 *   - Opera 7+ (only 10.50 tested; versions 9 and earlier may require
 *     Exceptions Have Stacktrace to be enabled in opera:config)
 *   - Safari 3+ (only 4+ tested)
 *   - Chrome 1+ (only 5+ tested)
 *   - Konqueror 3.5+ (untested)
 *
 * Requires TraceKit.computeStackTrace.
 *
 * Tries to catch all unhandled exceptions and report them to the
 * subscribed handlers. Please note that TraceKit.report will rethrow the
 * exception. This is REQUIRED in order to get a useful stack trace in IE.
 * If the exception does not reach the top of the browser, you will only
 * get a stack trace from the point where TraceKit.report was called.
 *
 * Handlers receive a stackInfo object as described in the
 * TraceKit.computeStackTrace docs.
 */
TraceKit.report = (function reportModuleWrapper() {
    var handlers = [],
        lastArgs = null,
        lastException = null,
        lastExceptionStack = null;

    /**
     * Add a crash handler.
     * @param {Function} handler
     */
    function subscribe(handler) {
        installGlobalHandler();
        handlers.push(handler);
    }

    /**
     * Remove a crash handler.
     * @param {Function} handler
     */
    function unsubscribe(handler) {
        for (var i = handlers.length - 1; i >= 0; --i) {
            if (handlers[i] === handler) {
                handlers.splice(i, 1);
            }
        }
    }

    /**
     * Remove all crash handlers.
     */
    function unsubscribeAll() {
        uninstallGlobalHandler();
        handlers = [];
    }

    /**
     * Dispatch stack information to all handlers.
     * @param {Object.<string, *>} stack
     */
    function notifyHandlers(stack, isWindowError) {
        var exception = null;
        if (isWindowError && !TraceKit.collectWindowErrors) {
          return;
        }
        for (var i in handlers) {
            if (hasKey(handlers, i)) {
                try {
                    handlers[i].apply(null, [stack].concat(_slice.call(arguments, 2)));
                } catch (inner) {
                    exception = inner;
                }
            }
        }

        if (exception) {
            throw exception;
        }
    }

    var _oldOnerrorHandler, _onErrorHandlerInstalled;

    /**
     * Ensures all global unhandled exceptions are recorded.
     * Supported by Gecko and IE.
     * @param {string} message Error message.
     * @param {string} url URL of script that generated the exception.
     * @param {(number|string)} lineNo The line number at which the error
     * occurred.
     * @param {?(number|string)} colNo The column number at which the error
     * occurred.
     * @param {?Error} ex The actual Error object.
     */
    function traceKitWindowOnError(message, url, lineNo, colNo, ex) {
        var stack = null;

        if (lastExceptionStack) {
            TraceKit.computeStackTrace.augmentStackTraceWithInitialElement(lastExceptionStack, url, lineNo, message);
            processLastException();
        } else if (ex) {
            // New chrome and blink send along a real error object
            // Let's just report that like a normal error.
            // See: https://mikewest.org/2013/08/debugging-runtime-errors-with-window-onerror
            stack = TraceKit.computeStackTrace(ex);
            notifyHandlers(stack, true);
        } else {
            var location = {
                'url': url,
                'line': lineNo,
                'column': colNo
            };
            location.func = TraceKit.computeStackTrace.guessFunctionName(location.url, location.line);
            location.context = TraceKit.computeStackTrace.gatherContext(location.url, location.line);
            stack = {
                'message': message,
                'url': document.location.href,
                'stack': [location]
            };
            notifyHandlers(stack, true);
        }

        if (_oldOnerrorHandler) {
            return _oldOnerrorHandler.apply(this, arguments);
        }

        return false;
    }

    function installGlobalHandler ()
    {
        if (_onErrorHandlerInstalled) {
            return;
        }
        _oldOnerrorHandler = window.onerror;
        window.onerror = traceKitWindowOnError;
        _onErrorHandlerInstalled = true;
    }

    function uninstallGlobalHandler ()
    {
        if (!_onErrorHandlerInstalled) {
            return;
        }
        window.onerror = _oldOnerrorHandler;
        _onErrorHandlerInstalled = false;
        _oldOnerrorHandler = undefined;
    }

    function processLastException() {
        var _lastExceptionStack = lastExceptionStack,
            _lastArgs = lastArgs;
        lastArgs = null;
        lastExceptionStack = null;
        lastException = null;
        notifyHandlers.apply(null, [_lastExceptionStack, false].concat(_lastArgs));
    }

    /**
     * Reports an unhandled Error to TraceKit.
     * @param {Error} ex
     * @param {?boolean} rethrow If false, do not re-throw the exception.
     * Only used for window.onerror to not cause an infinite loop of
     * rethrowing.
     */
    function report(ex, rethrow) {
        var args = _slice.call(arguments, 1);
        if (lastExceptionStack) {
            if (lastException === ex) {
                return; // already caught by an inner catch block, ignore
            } else {
              processLastException();
            }
        }

        var stack = TraceKit.computeStackTrace(ex);
        lastExceptionStack = stack;
        lastException = ex;
        lastArgs = args;

        // If the stack trace is incomplete, wait for 2 seconds for
        // slow slow IE to see if onerror occurs or not before reporting
        // this exception; otherwise, we will end up with an incomplete
        // stack trace
        window.setTimeout(function () {
            if (lastException === ex) {
                processLastException();
            }
        }, (stack.incomplete ? 2000 : 0));

        if (rethrow !== false) {
            throw ex; // re-throw to propagate to the top level (and cause window.onerror)
        }
    }

    report.subscribe = subscribe;
    report.unsubscribe = unsubscribe;
    report.uninstall = unsubscribeAll;
    return report;
}());

/**
 * TraceKit.computeStackTrace: cross-browser stack traces in JavaScript
 *
 * Syntax:
 *   s = TraceKit.computeStackTrace.ofCaller([depth])
 *   s = TraceKit.computeStackTrace(exception) // consider using TraceKit.report instead (see below)
 * Returns:
 *   s.name              - exception name
 *   s.message           - exception message
 *   s.stack[i].url      - JavaScript or HTML file URL
 *   s.stack[i].func     - function name, or empty for anonymous functions (if guessing did not work)
 *   s.stack[i].args     - arguments passed to the function, if known
 *   s.stack[i].line     - line number, if known
 *   s.stack[i].column   - column number, if known
 *   s.stack[i].context  - an array of source code lines; the middle element corresponds to the correct line#
 *
 * Supports:
 *   - Firefox:  full stack trace with line numbers and unreliable column
 *               number on top frame
 *   - Opera 10: full stack trace with line and column numbers
 *   - Opera 9-: full stack trace with line numbers
 *   - Chrome:   full stack trace with line and column numbers
 *   - Safari:   line and column number for the topmost stacktrace element
 *               only
 *   - IE:       no line numbers whatsoever
 *
 * Tries to guess names of anonymous functions by looking for assignments
 * in the source code. In IE and Safari, we have to guess source file names
 * by searching for function bodies inside all page scripts. This will not
 * work for scripts that are loaded cross-domain.
 * Here be dragons: some function names may be guessed incorrectly, and
 * duplicate functions may be mismatched.
 *
 * TraceKit.computeStackTrace should only be used for tracing purposes.
 * Logging of unhandled exceptions should be done with TraceKit.report,
 * which builds on top of TraceKit.computeStackTrace and provides better
 * IE support by utilizing the window.onerror event to retrieve information
 * about the top of the stack.
 *
 * Note: In IE and Safari, no stack trace is recorded on the Error object,
 * so computeStackTrace instead walks its *own* chain of callers.
 * This means that:
 *  * in Safari, some methods may be missing from the stack trace;
 *  * in IE, the topmost function in the stack trace will always be the
 *    caller of computeStackTrace.
 *
 * This is okay for tracing (because you are likely to be calling
 * computeStackTrace from the function you want to be the topmost element
 * of the stack trace anyway), but not okay for logging unhandled
 * exceptions (because your catch block will likely be far away from the
 * inner function that actually caused the exception).
 *
 * Tracing example:
 *     function trace(message) {
 *         var stackInfo = TraceKit.computeStackTrace.ofCaller();
 *         var data = message + "\n";
 *         for(var i in stackInfo.stack) {
 *             var item = stackInfo.stack[i];
 *             data += (item.func || '[anonymous]') + "() in " + item.url + ":" + (item.line || '0') + "\n";
 *         }
 *         if (window.console)
 *             console.info(data);
 *         else
 *             alert(data);
 *     }
 */
TraceKit.computeStackTrace = (function computeStackTraceWrapper() {
    var debug = false,
        sourceCache = {};

    /**
     * Attempts to retrieve source code via XMLHttpRequest, which is used
     * to look up anonymous function names.
     * @param {string} url URL of source code.
     * @return {string} Source contents.
     */
    function loadSource(url) {
        if (!TraceKit.remoteFetching) { //Only attempt request if remoteFetching is on.
            return '';
        }
        try {
            var getXHR = function() {
                try {
                    return new window.XMLHttpRequest();
                } catch (e) {
                    // explicitly bubble up the exception if not found
                    return new window.ActiveXObject('Microsoft.XMLHTTP');
                }
            };

            var request = getXHR();
            request.open('GET', url, false);
            request.send('');
            return request.responseText;
        } catch (e) {
            return '';
        }
    }

    /**
     * Retrieves source code from the source code cache.
     * @param {string} url URL of source code.
     * @return {Array.<string>} Source contents.
     */
    function getSource(url) {
        if (!isString(url)) return [];
        if (!hasKey(sourceCache, url)) {
            // URL needs to be able to fetched within the acceptable domain.  Otherwise,
            // cross-domain errors will be triggered.
            var source = '';
            if (url.indexOf(document.domain) !== -1) {
                source = loadSource(url);
            }
            sourceCache[url] = source ? source.split('\n') : [];
        }

        return sourceCache[url];
    }

    /**
     * Tries to use an externally loaded copy of source code to determine
     * the name of a function by looking at the name of the variable it was
     * assigned to, if any.
     * @param {string} url URL of source code.
     * @param {(string|number)} lineNo Line number in source code.
     * @return {string} The function name, if discoverable.
     */
    function guessFunctionName(url, lineNo) {
        var reFunctionArgNames = /function ([^(]*)\(([^)]*)\)/,
            reGuessFunction = /['"]?([0-9A-Za-z$_]+)['"]?\s*[:=]\s*(function|eval|new Function)/,
            line = '',
            maxLines = 10,
            source = getSource(url),
            m;

        if (!source.length) {
            return UNKNOWN_FUNCTION;
        }

        // Walk backwards from the first line in the function until we find the line which
        // matches the pattern above, which is the function definition
        for (var i = 0; i < maxLines; ++i) {
            line = source[lineNo - i] + line;

            if (!isUndefined(line)) {
                if ((m = reGuessFunction.exec(line))) {
                    return m[1];
                } else if ((m = reFunctionArgNames.exec(line))) {
                    return m[1];
                }
            }
        }

        return UNKNOWN_FUNCTION;
    }

    /**
     * Retrieves the surrounding lines from where an exception occurred.
     * @param {string} url URL of source code.
     * @param {(string|number)} line Line number in source code to centre
     * around for context.
     * @return {?Array.<string>} Lines of source code.
     */
    function gatherContext(url, line) {
        var source = getSource(url);

        if (!source.length) {
            return null;
        }

        var context = [],
            // linesBefore & linesAfter are inclusive with the offending line.
            // if linesOfContext is even, there will be one extra line
            //   *before* the offending line.
            linesBefore = Math.floor(TraceKit.linesOfContext / 2),
            // Add one extra line if linesOfContext is odd
            linesAfter = linesBefore + (TraceKit.linesOfContext % 2),
            start = Math.max(0, line - linesBefore - 1),
            end = Math.min(source.length, line + linesAfter - 1);

        line -= 1; // convert to 0-based index

        for (var i = start; i < end; ++i) {
            if (!isUndefined(source[i])) {
                context.push(source[i]);
            }
        }

        return context.length > 0 ? context : null;
    }

    /**
     * Escapes special characters, except for whitespace, in a string to be
     * used inside a regular expression as a string literal.
     * @param {string} text The string.
     * @return {string} The escaped string literal.
     */
    function escapeRegExp(text) {
        return text.replace(/[\-\[\]{}()*+?.,\\\^$|#]/g, '\\$&');
    }

    /**
     * Escapes special characters in a string to be used inside a regular
     * expression as a string literal. Also ensures that HTML entities will
     * be matched the same as their literal friends.
     * @param {string} body The string.
     * @return {string} The escaped string.
     */
    function escapeCodeAsRegExpForMatchingInsideHTML(body) {
        return escapeRegExp(body).replace('<', '(?:<|&lt;)').replace('>', '(?:>|&gt;)').replace('&', '(?:&|&amp;)').replace('"', '(?:"|&quot;)').replace(/\s+/g, '\\s+');
    }

    /**
     * Determines where a code fragment occurs in the source code.
     * @param {RegExp} re The function definition.
     * @param {Array.<string>} urls A list of URLs to search.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceInUrls(re, urls) {
        var source, m;
        for (var i = 0, j = urls.length; i < j; ++i) {
            // console.log('searching', urls[i]);
            if ((source = getSource(urls[i])).length) {
                source = source.join('\n');
                if ((m = re.exec(source))) {
                    // console.log('Found function in ' + urls[i]);

                    return {
                        'url': urls[i],
                        'line': source.substring(0, m.index).split('\n').length,
                        'column': m.index - source.lastIndexOf('\n', m.index) - 1
                    };
                }
            }
        }

        // console.log('no match');

        return null;
    }

    /**
     * Determines at which column a code fragment occurs on a line of the
     * source code.
     * @param {string} fragment The code fragment.
     * @param {string} url The URL to search.
     * @param {(string|number)} line The line number to examine.
     * @return {?number} The column number.
     */
    function findSourceInLine(fragment, url, line) {
        var source = getSource(url),
            re = new RegExp('\\b' + escapeRegExp(fragment) + '\\b'),
            m;

        line -= 1;

        if (source && source.length > line && (m = re.exec(source[line]))) {
            return m.index;
        }

        return null;
    }

    /**
     * Determines where a function was defined within the source code.
     * @param {(Function|string)} func A function reference or serialized
     * function definition.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceByFunctionBody(func) {
        var urls = [window.location.href],
            scripts = document.getElementsByTagName('script'),
            body,
            code = '' + func,
            codeRE = /^function(?:\s+([\w$]+))?\s*\(([\w\s,]*)\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            eventRE = /^function on([\w$]+)\s*\(event\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            re,
            parts,
            result;

        for (var i = 0; i < scripts.length; ++i) {
            var script = scripts[i];
            if (script.src) {
                urls.push(script.src);
            }
        }

        if (!(parts = codeRE.exec(code))) {
            re = new RegExp(escapeRegExp(code).replace(/\s+/g, '\\s+'));
        }

        // not sure if this is really necessary, but I don’t have a test
        // corpus large enough to confirm that and it was in the original.
        else {
            var name = parts[1] ? '\\s+' + parts[1] : '',
                args = parts[2].split(',').join('\\s*,\\s*');

            body = escapeRegExp(parts[3]).replace(/;$/, ';?'); // semicolon is inserted if the function ends with a comment.replace(/\s+/g, '\\s+');
            re = new RegExp('function' + name + '\\s*\\(\\s*' + args + '\\s*\\)\\s*{\\s*' + body + '\\s*}');
        }

        // look for a normal function definition
        if ((result = findSourceInUrls(re, urls))) {
            return result;
        }

        // look for an old-school event handler function
        if ((parts = eventRE.exec(code))) {
            var event = parts[1];
            body = escapeCodeAsRegExpForMatchingInsideHTML(parts[2]);

            // look for a function defined in HTML as an onXXX handler
            re = new RegExp('on' + event + '=[\\\'"]\\s*' + body + '\\s*[\\\'"]', 'i');

            if ((result = findSourceInUrls(re, urls[0]))) {
                return result;
            }

            // look for ???
            re = new RegExp(body);

            if ((result = findSourceInUrls(re, urls))) {
                return result;
            }
        }

        return null;
    }

    // Contents of Exception in various browsers.
    //
    // SAFARI:
    // ex.message = Can't find variable: qq
    // ex.line = 59
    // ex.sourceId = 580238192
    // ex.sourceURL = http://...
    // ex.expressionBeginOffset = 96
    // ex.expressionCaretOffset = 98
    // ex.expressionEndOffset = 98
    // ex.name = ReferenceError
    //
    // FIREFOX:
    // ex.message = qq is not defined
    // ex.fileName = http://...
    // ex.lineNumber = 59
    // ex.columnNumber = 69
    // ex.stack = ...stack trace... (see the example below)
    // ex.name = ReferenceError
    //
    // CHROME:
    // ex.message = qq is not defined
    // ex.name = ReferenceError
    // ex.type = not_defined
    // ex.arguments = ['aa']
    // ex.stack = ...stack trace...
    //
    // INTERNET EXPLORER:
    // ex.message = ...
    // ex.name = ReferenceError
    //
    // OPERA:
    // ex.message = ...message... (see the example below)
    // ex.name = ReferenceError
    // ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
    // ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'

    /**
     * Computes stack trace information from the stack property.
     * Chrome and Gecko use this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStackProp(ex) {
        if (!ex.stack) {
            return null;
        }

        var chrome = /^\s*at (?:((?:\[object object\])?\S+(?: \[as \S+\])?) )?\(?((?:file|https?|chrome-extension):.*?):(\d+)(?::(\d+))?\)?\s*$/i,
            gecko = /^\s*(\S*)(?:\((.*?)\))?@((?:file|https?|chrome).*?):(\d+)(?::(\d+))?\s*$/i,
            lines = ex.stack.split('\n'),
            stack = [],
            parts,
            element,
            reference = /^(.*) is undefined$/.exec(ex.message);

        for (var i = 0, j = lines.length; i < j; ++i) {
            if ((parts = gecko.exec(lines[i]))) {
                element = {
                    'url': parts[3],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'args': parts[2] ? parts[2].split(',') : '',
                    'line': +parts[4],
                    'column': parts[5] ? +parts[5] : null
                };
            } else if ((parts = chrome.exec(lines[i]))) {
                element = {
                    'url': parts[2],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'line': +parts[3],
                    'column': parts[4] ? +parts[4] : null
                };
            } else {
                continue;
            }

            if (!element.func && element.line) {
                element.func = guessFunctionName(element.url, element.line);
            }

            if (element.line) {
                element.context = gatherContext(element.url, element.line);
            }

            stack.push(element);
        }

        if (!stack.length) {
            return null;
        }

        if (stack[0].line && !stack[0].column && reference) {
            stack[0].column = findSourceInLine(reference[1], stack[0].url, stack[0].line);
        } else if (!stack[0].column && !isUndefined(ex.columnNumber)) {
            // FireFox uses this awesome columnNumber property for its top frame
            // Also note, Firefox's column number is 0-based and everything else expects 1-based,
            // so adding 1
            stack[0].column = ex.columnNumber + 1;
        }

        return {
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack
        };
    }

    /**
     * Computes stack trace information from the stacktrace property.
     * Opera 10 uses this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStacktraceProp(ex) {
        // Access and store the stacktrace property before doing ANYTHING
        // else to it because Opera is not very good at providing it
        // reliably in other circumstances.
        var stacktrace = ex.stacktrace;

        var testRE = / line (\d+), column (\d+) in (?:<anonymous function: ([^>]+)>|([^\)]+))\((.*)\) in (.*):\s*$/i,
            lines = stacktrace.split('\n'),
            stack = [],
            parts;

        for (var i = 0, j = lines.length; i < j; i += 2) {
            if ((parts = testRE.exec(lines[i]))) {
                var element = {
                    'line': +parts[1],
                    'column': +parts[2],
                    'func': parts[3] || parts[4],
                    'args': parts[5] ? parts[5].split(',') : [],
                    'url': parts[6]
                };

                if (!element.func && element.line) {
                    element.func = guessFunctionName(element.url, element.line);
                }
                if (element.line) {
                    try {
                        element.context = gatherContext(element.url, element.line);
                    } catch (exc) {}
                }

                if (!element.context) {
                    element.context = [lines[i + 1]];
                }

                stack.push(element);
            }
        }

        if (!stack.length) {
            return null;
        }

        return {
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack
        };
    }

    /**
     * NOT TESTED.
     * Computes stack trace information from an error message that includes
     * the stack trace.
     * Opera 9 and earlier use this method if the option to show stack
     * traces is turned on in opera:config.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack information.
     */
    function computeStackTraceFromOperaMultiLineMessage(ex) {
        // Opera includes a stack trace into the exception message. An example is:
        //
        // Statement on line 3: Undefined variable: undefinedFunc
        // Backtrace:
        //   Line 3 of linked script file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.js: In function zzz
        //         undefinedFunc(a);
        //   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function yyy
        //           zzz(x, y, z);
        //   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function xxx
        //           yyy(a, a, a);
        //   Line 1 of function script
        //     try { xxx('hi'); return false; } catch(ex) { TraceKit.report(ex); }
        //   ...

        var lines = ex.message.split('\n');
        if (lines.length < 4) {
            return null;
        }

        var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|https?)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|https?)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE3 = /^\s*Line (\d+) of function script\s*$/i,
            stack = [],
            scripts = document.getElementsByTagName('script'),
            inlineScriptBlocks = [],
            parts,
            i,
            len,
            source;

        for (i in scripts) {
            if (hasKey(scripts, i) && !scripts[i].src) {
                inlineScriptBlocks.push(scripts[i]);
            }
        }

        for (i = 2, len = lines.length; i < len; i += 2) {
            var item = null;
            if ((parts = lineRE1.exec(lines[i]))) {
                item = {
                    'url': parts[2],
                    'func': parts[3],
                    'line': +parts[1]
                };
            } else if ((parts = lineRE2.exec(lines[i]))) {
                item = {
                    'url': parts[3],
                    'func': parts[4]
                };
                var relativeLine = (+parts[1]); // relative to the start of the <SCRIPT> block
                var script = inlineScriptBlocks[parts[2] - 1];
                if (script) {
                    source = getSource(item.url);
                    if (source) {
                        source = source.join('\n');
                        var pos = source.indexOf(script.innerText);
                        if (pos >= 0) {
                            item.line = relativeLine + source.substring(0, pos).split('\n').length;
                        }
                    }
                }
            } else if ((parts = lineRE3.exec(lines[i]))) {
                var url = window.location.href.replace(/#.*$/, ''),
                    line = parts[1];
                var re = new RegExp(escapeCodeAsRegExpForMatchingInsideHTML(lines[i + 1]));
                source = findSourceInUrls(re, [url]);
                item = {
                    'url': url,
                    'line': source ? source.line : line,
                    'func': ''
                };
            }

            if (item) {
                if (!item.func) {
                    item.func = guessFunctionName(item.url, item.line);
                }
                var context = gatherContext(item.url, item.line);
                var midline = (context ? context[Math.floor(context.length / 2)] : null);
                if (context && midline.replace(/^\s*/, '') === lines[i + 1].replace(/^\s*/, '')) {
                    item.context = context;
                } else {
                    // if (context) alert("Context mismatch. Correct midline:\n" + lines[i+1] + "\n\nMidline:\n" + midline + "\n\nContext:\n" + context.join("\n") + "\n\nURL:\n" + item.url);
                    item.context = [lines[i + 1]];
                }
                stack.push(item);
            }
        }
        if (!stack.length) {
            return null; // could not parse multiline exception message as Opera stack trace
        }

        return {
            'name': ex.name,
            'message': lines[0],
            'url': document.location.href,
            'stack': stack
        };
    }

    /**
     * Adds information about the first frame to incomplete stack traces.
     * Safari and IE require this to get complete data on the first frame.
     * @param {Object.<string, *>} stackInfo Stack trace information from
     * one of the compute* methods.
     * @param {string} url The URL of the script that caused an error.
     * @param {(number|string)} lineNo The line number of the script that
     * caused an error.
     * @param {string=} message The error generated by the browser, which
     * hopefully contains the name of the object that caused the error.
     * @return {boolean} Whether or not the stack information was
     * augmented.
     */
    function augmentStackTraceWithInitialElement(stackInfo, url, lineNo, message) {
        var initial = {
            'url': url,
            'line': lineNo
        };

        if (initial.url && initial.line) {
            stackInfo.incomplete = false;

            if (!initial.func) {
                initial.func = guessFunctionName(initial.url, initial.line);
            }

            if (!initial.context) {
                initial.context = gatherContext(initial.url, initial.line);
            }

            var reference = / '([^']+)' /.exec(message);
            if (reference) {
                initial.column = findSourceInLine(reference[1], initial.url, initial.line);
            }

            if (stackInfo.stack.length > 0) {
                if (stackInfo.stack[0].url === initial.url) {
                    if (stackInfo.stack[0].line === initial.line) {
                        return false; // already in stack trace
                    } else if (!stackInfo.stack[0].line && stackInfo.stack[0].func === initial.func) {
                        stackInfo.stack[0].line = initial.line;
                        stackInfo.stack[0].context = initial.context;
                        return false;
                    }
                }
            }

            stackInfo.stack.unshift(initial);
            stackInfo.partial = true;
            return true;
        } else {
            stackInfo.incomplete = true;
        }

        return false;
    }

    /**
     * Computes stack trace information by walking the arguments.caller
     * chain at the time the exception occurred. This will cause earlier
     * frames to be missed but is the only way to get any stack trace in
     * Safari and IE. The top frame is restored by
     * {@link augmentStackTraceWithInitialElement}.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceByWalkingCallerChain(ex, depth) {
        var functionName = /function\s+([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)?\s*\(/i,
            stack = [],
            funcs = {},
            recursion = false,
            parts,
            item,
            source;

        for (var curr = computeStackTraceByWalkingCallerChain.caller; curr && !recursion; curr = curr.caller) {
            if (curr === computeStackTrace || curr === TraceKit.report) {
                // console.log('skipping internal function');
                continue;
            }

            item = {
                'url': null,
                'func': UNKNOWN_FUNCTION,
                'line': null,
                'column': null
            };

            if (curr.name) {
                item.func = curr.name;
            } else if ((parts = functionName.exec(curr.toString()))) {
                item.func = parts[1];
            }

            if ((source = findSourceByFunctionBody(curr))) {
                item.url = source.url;
                item.line = source.line;

                if (item.func === UNKNOWN_FUNCTION) {
                    item.func = guessFunctionName(item.url, item.line);
                }

                var reference = / '([^']+)' /.exec(ex.message || ex.description);
                if (reference) {
                    item.column = findSourceInLine(reference[1], source.url, source.line);
                }
            }

            if (funcs['' + curr]) {
                recursion = true;
            }else{
                funcs['' + curr] = true;
            }

            stack.push(item);
        }

        if (depth) {
            // console.log('depth is ' + depth);
            // console.log('stack is ' + stack.length);
            stack.splice(0, depth);
        }

        var result = {
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack
        };
        augmentStackTraceWithInitialElement(result, ex.sourceURL || ex.fileName, ex.line || ex.lineNumber, ex.message || ex.description);
        return result;
    }

    /**
     * Computes a stack trace for an exception.
     * @param {Error} ex
     * @param {(string|number)=} depth
     */
    function computeStackTrace(ex, depth) {
        var stack = null;
        depth = (depth == null ? 0 : +depth);

        try {
            // This must be tried first because Opera 10 *destroys*
            // its stacktrace property if you try to access the stack
            // property first!!
            stack = computeStackTraceFromStacktraceProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromStackProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromOperaMultiLineMessage(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceByWalkingCallerChain(ex, depth + 1);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        return {};
    }

    /**
     * Logs a stacktrace starting from the previous call and working down.
     * @param {(number|string)=} depth How many frames deep to trace.
     * @return {Object.<string, *>} Stack trace information.
     */
    function computeStackTraceOfCaller(depth) {
        depth = (depth == null ? 0 : +depth) + 1; // "+ 1" because "ofCaller" should drop one frame
        try {
            throw new Error();
        } catch (ex) {
            return computeStackTrace(ex, depth + 1);
        }
    }

    computeStackTrace.augmentStackTraceWithInitialElement = augmentStackTraceWithInitialElement;
    computeStackTrace.guessFunctionName = guessFunctionName;
    computeStackTrace.gatherContext = gatherContext;
    computeStackTrace.ofCaller = computeStackTraceOfCaller;

    return computeStackTrace;
}());

'use strict';

// First, check for JSON support
// If there is no JSON, we no-op the core features of Raven
// since JSON is required to encode the payload
var _Raven = window.Raven,
    hasJSON = !!(window.JSON && window.JSON.stringify),
    lastCapturedException,
    lastEventId,
    globalServer,
    globalUser,
    globalKey,
    globalProject,
    globalOptions = {
        logger: 'javascript',
        ignoreErrors: [],
        ignoreUrls: [],
        whitelistUrls: [],
        includePaths: [],
        collectWindowErrors: true,
        tags: {},
        extra: {}
    },
    authQueryString,
    isRavenInstalled = false;

/*
 * The core Raven singleton
 *
 * @this {Raven}
 */
var Raven = {
    VERSION: '1.1.16',

    debug: true,

    /*
     * Allow multiple versions of Raven to be installed.
     * Strip Raven from the global context and returns the instance.
     *
     * @return {Raven}
     */
    noConflict: function() {
        window.Raven = _Raven;
        return Raven;
    },

    /*
     * Configure Raven with a DSN and extra options
     *
     * @param {string} dsn The public Sentry DSN
     * @param {object} options Optional set of of global options [optional]
     * @return {Raven}
     */
    config: function(dsn, options) {
        if (globalServer) {
            logDebug('error', 'Error: Raven has already been configured');
            return Raven;
        }
        if (!dsn) return Raven;

        var uri = parseDSN(dsn),
            lastSlash = uri.path.lastIndexOf('/'),
            path = uri.path.substr(1, lastSlash);

        // merge in options
        if (options) {
            each(options, function(key, value){
                globalOptions[key] = value;
            });
        }

        // "Script error." is hard coded into browsers for errors that it can't read.
        // this is the result of a script being pulled in from an external domain and CORS.
        globalOptions.ignoreErrors.push('Script error.');
        globalOptions.ignoreErrors.push('Script error');

        // Other variants of external script errors:
        globalOptions.ignoreErrors.push('Javascript error: Script error on line 0');
        globalOptions.ignoreErrors.push('Javascript error: Script error. on line 0');

        // join regexp rules into one big rule
        globalOptions.ignoreErrors = joinRegExp(globalOptions.ignoreErrors);
        globalOptions.ignoreUrls = globalOptions.ignoreUrls.length ? joinRegExp(globalOptions.ignoreUrls) : false;
        globalOptions.whitelistUrls = globalOptions.whitelistUrls.length ? joinRegExp(globalOptions.whitelistUrls) : false;
        globalOptions.includePaths = joinRegExp(globalOptions.includePaths);

        globalKey = uri.user;
        globalProject = uri.path.substr(lastSlash + 1);

        // assemble the endpoint from the uri pieces
        globalServer = '//' + uri.host +
                      (uri.port ? ':' + uri.port : '') +
                      '/' + path + 'api/' + globalProject + '/store/';

        if (uri.protocol) {
            globalServer = uri.protocol + ':' + globalServer;
        }

        if (globalOptions.fetchContext) {
            TraceKit.remoteFetching = true;
        }

        if (globalOptions.linesOfContext) {
            TraceKit.linesOfContext = globalOptions.linesOfContext;
        }

        TraceKit.collectWindowErrors = !!globalOptions.collectWindowErrors;

        setAuthQueryString();

        // return for chaining
        return Raven;
    },

    /*
     * Installs a global window.onerror error handler
     * to capture and report uncaught exceptions.
     * At this point, install() is required to be called due
     * to the way TraceKit is set up.
     *
     * @return {Raven}
     */
    install: function() {
        if (isSetup() && !isRavenInstalled) {
            TraceKit.report.subscribe(handleStackInfo);
            isRavenInstalled = true;
        }

        return Raven;
    },

    /*
     * Wrap code within a context so Raven can capture errors
     * reliably across domains that is executed immediately.
     *
     * @param {object} options A specific set of options for this context [optional]
     * @param {function} func The callback to be immediately executed within the context
     * @param {array} args An array of arguments to be called with the callback [optional]
     */
    context: function(options, func, args) {
        if (isFunction(options)) {
            args = func || [];
            func = options;
            options = undefined;
        }

        return Raven.wrap(options, func).apply(this, args);
    },

    /*
     * Wrap code within a context and returns back a new function to be executed
     *
     * @param {object} options A specific set of options for this context [optional]
     * @param {function} func The function to be wrapped in a new context
     * @return {function} The newly wrapped functions with a context
     */
    wrap: function(options, func) {
        // 1 argument has been passed, and it's not a function
        // so just return it
        if (isUndefined(func) && !isFunction(options)) {
            return options;
        }

        // options is optional
        if (isFunction(options)) {
            func = options;
            options = undefined;
        }

        // At this point, we've passed along 2 arguments, and the second one
        // is not a function either, so we'll just return the second argument.
        if (!isFunction(func)) {
            return func;
        }

        // We don't wanna wrap it twice!
        if (func.__raven__) {
            return func;
        }

        function wrapped() {
            var args = [], i = arguments.length,
                deep = !options || options && options.deep !== false;
            // Recursively wrap all of a function's arguments that are
            // functions themselves.

            while(i--) args[i] = deep ? Raven.wrap(options, arguments[i]) : arguments[i];

            try {
                /*jshint -W040*/
                return func.apply(this, args);
            } catch(e) {
                Raven.captureException(e, options);
                throw e;
            }
        }

        // copy over properties of the old function
        for (var property in func) {
            if (hasKey(func, property)) {
                wrapped[property] = func[property];
            }
        }

        // Signal that this function has been wrapped already
        // for both debugging and to prevent it to being wrapped twice
        wrapped.__raven__ = true;
        wrapped.__inner__ = func;

        return wrapped;
    },

    /*
     * Uninstalls the global error handler.
     *
     * @return {Raven}
     */
    uninstall: function() {
        TraceKit.report.uninstall();
        isRavenInstalled = false;

        return Raven;
    },

    /*
     * Manually capture an exception and send it over to Sentry
     *
     * @param {error} ex An exception to be logged
     * @param {object} options A specific set of options for this error [optional]
     * @return {Raven}
     */
    captureException: function(ex, options) {
        // If not an Error is passed through, recall as a message instead
        if (!(ex instanceof Error)) return Raven.captureMessage(ex, options);

        // Store the raw exception object for potential debugging and introspection
        lastCapturedException = ex;

        // TraceKit.report will re-raise any exception passed to it,
        // which means you have to wrap it in try/catch. Instead, we
        // can wrap it here and only re-raise if TraceKit.report
        // raises an exception different from the one we asked to
        // report on.
        try {
            TraceKit.report(ex, options);
        } catch(ex1) {
            if(ex !== ex1) {
                throw ex1;
            }
        }

        return Raven;
    },

    /*
     * Manually send a message to Sentry
     *
     * @param {string} msg A plain message to be captured in Sentry
     * @param {object} options A specific set of options for this message [optional]
     * @return {Raven}
     */
    captureMessage: function(msg, options) {
        // Fire away!
        send(
            objectMerge({
                message: msg + ''  // Make sure it's actually a string
            }, options)
        );

        return Raven;
    },

    /*
     * Set/clear a user to be sent along with the payload.
     *
     * @param {object} user An object representing user data [optional]
     * @return {Raven}
     */
    setUserContext: function(user) {
       globalUser = user;

       return Raven;
    },

    /*
     * Set extra attributes to be sent along with the payload.
     *
     * @param {object} extra An object representing extra data [optional]
     * @return {Raven}
     */
    setExtraContext: function(extra) {
       globalOptions.extra = extra || {};

       return Raven;
    },

    /*
     * Set tags to be sent along with the payload.
     *
     * @param {object} tags An object representing tags [optional]
     * @return {Raven}
     */
    setTagsContext: function(tags) {
       globalOptions.tags = tags || {};

       return Raven;
    },

    /*
     * Get the latest raw exception that was captured by Raven.
     *
     * @return {error}
     */
    lastException: function() {
        return lastCapturedException;
    },

    /*
     * Get the last event id
     *
     * @return {string}
     */
    lastEventId: function() {
        return lastEventId;
    }
};

Raven.setUser = Raven.setUserContext; // To be deprecated

function triggerEvent(eventType, options) {
    var event, key;

    options = options || {};

    eventType = 'raven' + eventType.substr(0,1).toUpperCase() + eventType.substr(1);

    if (document.createEvent) {
        event = document.createEvent('HTMLEvents');
        event.initEvent(eventType, true, true);
    } else {
        event = document.createEventObject();
        event.eventType = eventType;
    }

    for (key in options) if (hasKey(options, key)) {
        event[key] = options[key];
    }

    if (document.createEvent) {
        // IE9 if standards
        document.dispatchEvent(event);
    } else {
        // IE8 regardless of Quirks or Standards
        // IE9 if quirks
        try {
            document.fireEvent('on' + event.eventType.toLowerCase(), event);
        } catch(e) {}
    }
}

var dsnKeys = 'source protocol user pass host port path'.split(' '),
    dsnPattern = /^(?:(\w+):)?\/\/(\w+)(:\w+)?@([\w\.-]+)(?::(\d+))?(\/.*)/;

function RavenConfigError(message) {
    this.name = 'RavenConfigError';
    this.message = message;
}
RavenConfigError.prototype = new Error();
RavenConfigError.prototype.constructor = RavenConfigError;

/**** Private functions ****/
function parseDSN(str) {
    var m = dsnPattern.exec(str),
        dsn = {},
        i = 7;

    try {
        while (i--) dsn[dsnKeys[i]] = m[i] || '';
    } catch(e) {
        throw new RavenConfigError('Invalid DSN: ' + str);
    }

    if (dsn.pass)
        throw new RavenConfigError('Do not specify your private key in the DSN!');

    return dsn;
}

function isUndefined(what) {
    return typeof what === 'undefined';
}

function isFunction(what) {
    return typeof what === 'function';
}

function isString(what) {
    return typeof what === 'string';
}

function isEmptyObject(what) {
    for (var k in what) return false;
    return true;
}

/**
 * hasKey, a better form of hasOwnProperty
 * Example: hasKey(MainHostObject, property) === true/false
 *
 * @param {Object} host object to check property
 * @param {string} key to check
 */
function hasKey(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function each(obj, callback) {
    var i, j;

    if (isUndefined(obj.length)) {
        for (i in obj) {
            if (hasKey(obj, i)) {
                callback.call(null, i, obj[i]);
            }
        }
    } else {
        j = obj.length;
        if (j) {
            for (i = 0; i < j; i++) {
                callback.call(null, i, obj[i]);
            }
        }
    }
}


function setAuthQueryString() {
    authQueryString =
        '?sentry_version=4' +
        '&sentry_client=raven-js/' + Raven.VERSION +
        '&sentry_key=' + globalKey;
}


function handleStackInfo(stackInfo, options) {
    var frames = [];

    if (stackInfo.stack && stackInfo.stack.length) {
        each(stackInfo.stack, function(i, stack) {
            var frame = normalizeFrame(stack);
            if (frame) {
                frames.push(frame);
            }
        });
    }

    triggerEvent('handle', {
        stackInfo: stackInfo,
        options: options
    });

    processException(
        stackInfo.name,
        stackInfo.message,
        stackInfo.url,
        stackInfo.lineno,
        frames,
        options
    );
}

function normalizeFrame(frame) {
    if (!frame.url) return;

    // normalize the frames data
    var normalized = {
        filename:   frame.url,
        lineno:     frame.line,
        colno:      frame.column,
        'function': frame.func || '?'
    }, context = extractContextFromFrame(frame), i;

    if (context) {
        var keys = ['pre_context', 'context_line', 'post_context'];
        i = 3;
        while (i--) normalized[keys[i]] = context[i];
    }

    normalized.in_app = !( // determine if an exception came from outside of our app
        // first we check the global includePaths list.
        !globalOptions.includePaths.test(normalized.filename) ||
        // Now we check for fun, if the function name is Raven or TraceKit
        /(Raven|TraceKit)\./.test(normalized['function']) ||
        // finally, we do a last ditch effort and check for raven.min.js
        /raven\.(min\.)?js$/.test(normalized.filename)
    );

    return normalized;
}

function extractContextFromFrame(frame) {
    // immediately check if we should even attempt to parse a context
    if (!frame.context || !globalOptions.fetchContext) return;

    var context = frame.context,
        pivot = ~~(context.length / 2),
        i = context.length, isMinified = false;

    while (i--) {
        // We're making a guess to see if the source is minified or not.
        // To do that, we make the assumption if *any* of the lines passed
        // in are greater than 300 characters long, we bail.
        // Sentry will see that there isn't a context
        if (context[i].length > 300) {
            isMinified = true;
            break;
        }
    }

    if (isMinified) {
        // The source is minified and we don't know which column. Fuck it.
        if (isUndefined(frame.column)) return;

        // If the source is minified and has a frame column
        // we take a chunk of the offending line to hopefully shed some light
        return [
            [],  // no pre_context
            context[pivot].substr(frame.column, 50), // grab 50 characters, starting at the offending column
            []   // no post_context
        ];
    }

    return [
        context.slice(0, pivot),    // pre_context
        context[pivot],             // context_line
        context.slice(pivot + 1)    // post_context
    ];
}

function processException(type, message, fileurl, lineno, frames, options) {
    var stacktrace, label, i;

    // In some instances message is not actually a string, no idea why,
    // so we want to always coerce it to one.
    message += '';

    // Sometimes an exception is getting logged in Sentry as
    // <no message value>
    // This can only mean that the message was falsey since this value
    // is hardcoded into Sentry itself.
    // At this point, if the message is falsey, we bail since it's useless
    if (type === 'Error' && !message) return;

    if (globalOptions.ignoreErrors.test(message)) return;

    if (frames && frames.length) {
        fileurl = frames[0].filename || fileurl;
        // Sentry expects frames oldest to newest
        // and JS sends them as newest to oldest
        frames.reverse();
        stacktrace = {frames: frames};
    } else if (fileurl) {
        stacktrace = {
            frames: [{
                filename: fileurl,
                lineno: lineno,
                in_app: true
            }]
        };
    }

    // Truncate the message to a max of characters
    message = truncate(message, 100);

    if (globalOptions.ignoreUrls && globalOptions.ignoreUrls.test(fileurl)) return;
    if (globalOptions.whitelistUrls && !globalOptions.whitelistUrls.test(fileurl)) return;

    label = lineno ? message + ' at ' + lineno : message;

    // Fire away!
    send(
        objectMerge({
            // sentry.interfaces.Exception
            exception: {
                type: type,
                value: message
            },
            // sentry.interfaces.Stacktrace
            stacktrace: stacktrace,
            culprit: fileurl,
            message: label
        }, options)
    );
}

function objectMerge(obj1, obj2) {
    if (!obj2) {
        return obj1;
    }
    each(obj2, function(key, value){
        obj1[key] = value;
    });
    return obj1;
}

function truncate(str, max) {
    return str.length <= max ? str : str.substr(0, max) + '\u2026';
}

function getHttpData() {
    var http = {
        url: document.location.href,
        headers: {
            'User-Agent': navigator.userAgent
        }
    };

    if (document.referrer) {
        http.headers.Referer = document.referrer;
    }

    return http;
}

function send(data) {
    if (!isSetup()) return;

    data = objectMerge({
        project: globalProject,
        logger: globalOptions.logger,
        site: globalOptions.site,
        platform: 'javascript',
        // sentry.interfaces.Http
        request: getHttpData()
    }, data);

    // Merge in the tags and extra separately since objectMerge doesn't handle a deep merge
    data.tags = objectMerge(globalOptions.tags, data.tags);
    data.extra = objectMerge(globalOptions.extra, data.extra);

    // If there are no tags/extra, strip the key from the payload alltogther.
    if (isEmptyObject(data.tags)) delete data.tags;
    if (isEmptyObject(data.extra)) delete data.extra;

    if (globalUser) {
        // sentry.interfaces.User
        data.user = globalUser;
    }

    if (isFunction(globalOptions.dataCallback)) {
        data = globalOptions.dataCallback(data);
    }

    // Check if the request should be filtered or not
    if (isFunction(globalOptions.shouldSendCallback) && !globalOptions.shouldSendCallback(data)) {
        return;
    }

    // Send along an event_id if not explicitly passed.
    // This event_id can be used to reference the error within Sentry itself.
    // Set lastEventId after we know the error should actually be sent
    lastEventId = data.event_id || (data.event_id = uuid4());

    makeRequest(data);
}


function makeRequest(data) {
    var img = new Image(),
        src = globalServer + authQueryString + '&sentry_data=' + encodeURIComponent(JSON.stringify(data));

    img.onload = function success() {
        triggerEvent('success', {
            data: data,
            src: src
        });
    };
    img.onerror = img.onabort = function failure() {
        triggerEvent('failure', {
            data: data,
            src: src
        });
    };
    img.src = src;
}

function isSetup() {
    if (!hasJSON) return false;  // needs JSON support
    if (!globalServer) {
        logDebug('error', 'Error: Raven has not been configured.');
        return false;
    }
    return true;
}

function joinRegExp(patterns) {
    // Combine an array of regular expressions and strings into one large regexp
    // Be mad.
    var sources = [],
        i = 0, len = patterns.length,
        pattern;

    for (; i < len; i++) {
        pattern = patterns[i];
        if (isString(pattern)) {
            // If it's a string, we need to escape it
            // Taken from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
            sources.push(pattern.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"));
        } else if (pattern && pattern.source) {
            // If it's a regexp already, we want to extract the source
            sources.push(pattern.source);
        }
        // Intentionally skip other cases
    }
    return new RegExp(sources.join('|'), 'i');
}

// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
function uuid4() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0,
            v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function logDebug(level, message) {
    if (window.console && console[level] && Raven.debug) {
        console[level](message);
    }
}

function afterLoad() {
    // Attempt to initialize Raven on load
    var RavenConfig = window.RavenConfig;
    if (RavenConfig) {
        Raven.config(RavenConfig.dsn, RavenConfig.config).install();
    }
}
afterLoad();

// Expose Raven to the world
window.Raven = Raven;

// AMD
if (typeof define === 'function' && define.amd) {
    define('raven', [], function() { return Raven; });
}

})(this);

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
var reqwest = require('../vendor/reqwest.min');

// "http://localhost:3001/search?q=authors:%22Richard%20McGregor%22"

function setContext(path, display) {
    localStorage.setItem(contextKey, path);
    localStorage.setItem(contextTitleKey, display);
}

var onArticle = function (path) {
    return /^\/[a-f0-9]+-(.*)/.test(path); // '27a5e286-4314-11e4-8a43-00144feabdc0'; 
};

var $ = function (selector) {
    return [].slice.call(document.querySelectorAll(selector));
};

var emit = function(name, data) {
    console.log('emitting', name, data);
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

var contextKey = 'ft.stream.context.url';
var contextTitleKey = 'ft.stream.context.display';
var display, context;

/* 1. in stream mode store the context URL and content display name */
if (!onArticle(location.pathname)) {
    // Every time you hit a new stream, you enter a new context
    context = extractSearchTerm(location.search);
    display = document.getElementsByClassName('js-context')[0].textContent.trim();
    setContext(context, display);
    localStorage.setItem(contextTitleKey, display);
    emit('stream:open', {id: context});
} else {
    context = localStorage.getItem(contextKey);
    display = localStorage.getItem(contextTitleKey);
    if(!context) { 
        //If they come directly to an article with no history, use the first theme for this article
        context = extractSearchTerm(document.querySelector('.article-card__themes a').getAttribute('href'));
        display = document.querySelector('.article-card__themes a').textContent.trim();
        setContext(context, display);
    }
}

/* 2. in article view render the context menu full mode */    
if (onArticle(location.pathname) && context) {
    $('.js-context').map(function (el) {
        el.innerHTML = localStorage.getItem(contextTitleKey);
    });

}

/* 3. request and render the context navigation */
reqwest({
    url: '/context/search?q=' + context, 
    crossOrigin: true, 
    success: function (res) {
        $('.js-context__container').map(function (el) {
            var myTag = document.createElement('div');
            myTag.innerHTML = res;
            el.appendChild(myTag); 
            //scripts wont execute, so grab them and append to head
            var scripts = myTag.querySelectorAll('script');
            [].slice.call(scripts).map(function(script) {
                var s = document.createElement('script');
                s.src = script.src;
                document.head.appendChild(s);
            });

            document.documentElement.classList.add('has-context');
        });
    }
});


},{"../vendor/reqwest.min":18}],12:[function(require,module,exports){

var reqwest = require('../../vendor/reqwest.min');

// Enhances any ticker symbol found on the page with live pricing data
function init () {


    console.log('prog enhance ticker');

    var host = 'http://next-companies-et-al.herokuapp.com/v1/mouseover/company/';
    var symbols = document.querySelectorAll('.article-card__ticker-symbols__item');

    [].slice.call(symbols).forEach(function (symbol) {
        var code = symbol.getAttribute('data-ticker-symbols');
        reqwest(host + code, function (resp) {
            // did the market price go up?
            var isUp = (parseFloat(resp.data.latest_change.percentage) >= 0) ? 'up' : 'down'; 
            var price = resp.data.latest_price.amount;
            var change = resp.data.latest_change.percentage;
            symbol.innerHTML = '<span class="article-card__ticker-symbols__item-' + isUp + '">' + resp.data.returned_symbol + ' ' + price + ' (' + change  + ')</span>';
        });
    });

}

init();

},{"../../vendor/reqwest.min":18}],13:[function(require,module,exports){
var reqwest = require('../../vendor/reqwest.min');
    
var $ = function (selector) {
    return [].slice.call(document.querySelectorAll(selector));
};

$('.js-more-on').forEach(function (el) {
    reqwest('/more-on/ ' + el.getAttribute('data-article-id'))
        .then(function (resp) {
            el.innerHTML = resp;
            if (window.Origami) {
                window.Origami['o-date'].init(el);
            }
        }, function() {
            el.parentNode.removeChild(el);
        });
});




},{"../../vendor/reqwest.min":18}],14:[function(require,module,exports){

// THIS WHOLE THING IS A CAR CRASH AND NEEDS TO BE SORTED OUT

window.addEventListener('DOMContentLoaded', function (evt) {

    var $ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    };

    var onArticle = function (path) {
        return /^\/[a-f0-9]+-(.*)/.test(path); // '27a5e286-4314-11e4-8a43-00144feabdc0'; 
    };

    var emit = function(name, data) {
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
        if (data) {
            event.detail = data;
        }
        top.document.dispatchEvent(event);
    };


    var contextKey = 'ft.stream.context.url';
    var contextTitleKey = 'ft.stream.context.display';

    var streamPath = localStorage.getItem(contextKey);
    var streamName = localStorage.getItem(contextTitleKey);


    function toggle(key, data, saveBtn) {
        var isSaved = (saveBtn.getAttribute('data-is-saved') === "true");
        if(isSaved) {
            emit(key + ':remove', data);
        } else {
            emit(key + ':add', data);
        }
        toggleButtonState(saveBtn);
    }

    function toggleButtonState(saveBtn) {
        var isSaved = (saveBtn.getAttribute('data-is-saved') === "true");
        var existingText = saveBtn.textContent.trim();
        saveBtn.textContent = saveBtn.getAttribute('data-toggle-text');
        saveBtn.setAttribute('data-toggle-text', existingText);
        saveBtn.setAttribute('data-is-saved', isSaved ? 'false' : 'true');
    }

    function stripLeadingSlash(path) {
        return path.replace(/^\/|\/$/g, '');
    }

    //On click of save buttons, trigger the add/remove event and update the UI of the button
    $('.js-save__button[data-save-target="favourites"]').map(function (el) {
        el.addEventListener('click', function (evt) {
            var data = { 'uuidv3': streamPath, 'displayText': streamName, 'resourceType': 'stream'};
            toggle('favourites', data, el);

        });
    });

    $('.js-save__button[data-save-target="forlaters"]').map(function (el) {
        el.addEventListener('click', function (evt) {
            var headline = this.parentElement.getElementsByClassName('article-card__link')[0];
            var data = {
                'uuidv3': stripLeadingSlash(headline.getAttribute('href')), //remove leading slash 
                'displayText': headline.textContent.trim(), 
                'resourceType': 'article' //Fix to article for now
            };
            toggle('forlaters', data, el);
        });
    });


    //On page load, just update the UI of the button
    document.addEventListener('favourites:load', function(evt) {
        $('.js-save__button[data-save-target="favourites"]').map(function (el) {
            var isSaved = evt.detail.exists(streamPath);
            if(isSaved) {
                toggleButtonState(el);
            }
        });
    });
    document.addEventListener('forlaters:load', function(evt) {
        $('.js-save__button[data-save-target="forlaters"]').map(function (el) {
            var headline = el.parentElement.getElementsByClassName('article-card__link')[0];
            var isSaved = evt.detail.exists(stripLeadingSlash(headline.getAttribute('href')));
            if(isSaved) {
                toggleButtonState(el);
            }
        });
    });

    function saveHistory() {
        var data, headline;
        if(onArticle(location.pathname)) {
            headline = document.querySelector('.article-card__headline .article-card__link');
            data = {
                'uuidv3': stripLeadingSlash(headline.getAttribute('href')), //remove leading slash 
                'displayText': headline.textContent.trim(), 
                'resourceType': 'article' //Fix to article for now
            };
        } else {
            data = { 'uuidv3': streamPath, 'displayText': streamName, 'resourceType': 'stream'};
        }
        emit('history:add', data);
    }

    document.addEventListener('history:load', saveHistory);

});



},{}],15:[function(require,module,exports){


(function () {

    var emit = function(name, data) {
        // console.log('emitting', name, data);
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
        if (data) {
            event.detail = data;
        }
        top.document.dispatchEvent(event);
    };

    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    function findAncestorByClassName (el, cls) {
        while ((el = el.parentNode) && !hasClass(el, cls)) {
            return el;    
        };
    }

    var $ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    };

    // Reload the stream when an index:open event is fired
    document.addEventListener('index:open', function (e) {
        location.href = '/stream/' + e.detail.stream;
    });

    document.addEventListener('index:capi', function (e) {
        window.location.hash = '#capi-' + e.detail.capi;
    });

    function hasClass(el, name) {
        return new RegExp('(\\s|^)'+name+'(\\s|$)').test(el.className);
    }

    function addClass(el, name) {
        if (!hasClass(el, name)) { el.className += (el.className ? ' ' : '') +name; }
    }

    function removeClass(el, name) {
        if (hasClass(el, name)) {
            el.className=el.className.replace(new RegExp('(\\s|^)'+name+'(\\s|$)'),' ').replace(/^\s+|\s+$/g, '');
        }
    }

    function toggleClass(el, name) {
        if (hasClass(el, name)) removeClass(el, name);
        else addClass(el, name);
    }

    /* Allow all articles to be opened inline */
    //TODO: this will interact with single-article toggle below;
    //needs a refactor when re-implemented
    $('.article-card__more.js-toggle').map(function (el) {
        el.addEventListener('click', function (evt) {
            toggleClass(el, 'js-active');
            el.textContent = hasClass(el, 'js-active') ? 'Close' : 'Open';
            var target = this.getAttribute('data-toggle');
            $(target).map(function (elm) {
                toggleClass(elm, 'js-show');
            });
        });
    });

    /* Allow single article to be opened inline */
    $('.article-card__expand.js-toggle').map(function (el) {
        el.addEventListener('click', function (evt) {
            evt.preventDefault();
            var target = this.getAttribute('data-toggle'),
                article = findAncestorByClassName(el, target),
                icon = el.querySelector('i')
                ;
            toggleClass(icon, 'icon-arrow-up');
            toggleClass(icon, 'icon-arrow-down');
            toggleClass(article.querySelector(target), 'js-show');
        });
    });
    
    var tracks = $('.article-card__headline');

    function isElementInViewport (el) {
        var rect = el.getBoundingClientRect();
        return (

            // FIXME is 25% from the top
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
            );
    }

    var readable = function() {
        // Return the ID of the uppermost headline in the viewport
        var inView = tracks.filter(function (el) {
            return isElementInViewport(el);
        }).map(function (el) {
            return el.parentNode.id;
        })[0];

        if (inView && inView.length > 0) {
            emit('stream:inview', { capi: inView  } );
        }
    };

    window.onscroll = debounce(readable, 5, false);

})();

},{}],16:[function(require,module,exports){
'use strict';

var reqwest = require('../vendor/reqwest.min');


var $ = function (selector) {
    return [].slice.call(document.querySelectorAll(selector));
};


$('video').forEach(function (el) {


	reqwest('http://ft-next-brightcove-proxy-api.herokuapp.com/' + el.getAttribute('data-brightcove-ref'))
		.then(function (resp) {
			var data = JSON.parse(resp);
		  	el.src = data.renditions[0].url;
		}, function () {
		  	console.log('error: ', arguments);
		});
});



},{"../vendor/reqwest.min":18}],17:[function(require,module,exports){
var Raven = require("./../bower_components/raven-js/dist/raven.js").Raven;

Raven.config('https://1430704766a840b4b36133662324f489@app.getsentry.com/32283', {
    whitelistUrls: ['next.ft.com/dobi/']
}).install();

require("./../bower_components/next-header/main.js");
require('./components/context');
require('./components/save-button/main');
require('./components/more-on/main');
require('./components/live-prices/main');
require('./components/video');
require('./components/stream/main');


},{"./../bower_components/next-header/main.js":2,"./../bower_components/raven-js/dist/raven.js":9,"./components/context":11,"./components/live-prices/main":12,"./components/more-on/main":13,"./components/save-button/main":14,"./components/stream/main":15,"./components/video":16}],18:[function(require,module,exports){
module.exports=require(8)
},{}]},{},[17])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL25vZGVfbW9kdWxlcy9vcmlnYW1pLWJ1aWxkLXRvb2xzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL2RvbS1kZWxlZ2F0ZS9saWIvZGVsZWdhdGUuanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtaGVhZGVyL21haW4uanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtaGVhZGVyL3NyYy9qcy9Ob3RpZnkuanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbGliL01lLmpzIiwiL1VzZXJzL2xlYW5uZS50aXRlL0RvY3VtZW50cy9Qcm9qZWN0cy9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL2xpYi9Ob3RpZmljYXRpb25Qb2xsZXIuanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbGliL1VzZXJQcmVmZXJlbmNlTGlzdC5qcyIsIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC11c2VyLXByZWZlcmVuY2VzL3NyYy9tYWluLmpzIiwiL1VzZXJzL2xlYW5uZS50aXRlL0RvY3VtZW50cy9Qcm9qZWN0cy9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL3ZlbmRvci9yZXF3ZXN0Lm1pbi5qcyIsIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvcmF2ZW4tanMvZGlzdC9yYXZlbi5qcyIsIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvcmVxd2VzdC9yZXF3ZXN0LmpzIiwiL1VzZXJzL2xlYW5uZS50aXRlL0RvY3VtZW50cy9Qcm9qZWN0cy9uZXh0LWRvYmkvY2xpZW50L2NvbXBvbmVudHMvY29udGV4dC5qcyIsIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL2NsaWVudC9jb21wb25lbnRzL2xpdmUtcHJpY2VzL21haW4uanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9jbGllbnQvY29tcG9uZW50cy9tb3JlLW9uL21haW4uanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9jbGllbnQvY29tcG9uZW50cy9zYXZlLWJ1dHRvbi9tYWluLmpzIiwiL1VzZXJzL2xlYW5uZS50aXRlL0RvY3VtZW50cy9Qcm9qZWN0cy9uZXh0LWRvYmkvY2xpZW50L2NvbXBvbmVudHMvc3RyZWFtL21haW4uanMiLCIvVXNlcnMvbGVhbm5lLnRpdGUvRG9jdW1lbnRzL1Byb2plY3RzL25leHQtZG9iaS9jbGllbnQvY29tcG9uZW50cy92aWRlby5qcyIsIi9Vc2Vycy9sZWFubmUudGl0ZS9Eb2N1bWVudHMvUHJvamVjdHMvbmV4dC1kb2JpL2NsaWVudC9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOXlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqbUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlbGVnYXRlO1xuXG4vKipcbiAqIERPTSBldmVudCBkZWxlZ2F0b3JcbiAqXG4gKiBUaGUgZGVsZWdhdG9yIHdpbGwgbGlzdGVuXG4gKiBmb3IgZXZlbnRzIHRoYXQgYnViYmxlIHVwXG4gKiB0byB0aGUgcm9vdCBub2RlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtOb2RlfHN0cmluZ30gW3Jvb3RdIFRoZSByb290IG5vZGUgb3IgYSBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmcgdGhlIHJvb3Qgbm9kZVxuICovXG5mdW5jdGlvbiBEZWxlZ2F0ZShyb290KSB7XG5cbiAgLyoqXG4gICAqIE1haW50YWluIGEgbWFwIG9mIGxpc3RlbmVyXG4gICAqIGxpc3RzLCBrZXllZCBieSBldmVudCBuYW1lLlxuICAgKlxuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG4gIHRoaXMubGlzdGVuZXJNYXAgPSBbe30sIHt9XTtcbiAgaWYgKHJvb3QpIHtcbiAgICB0aGlzLnJvb3Qocm9vdCk7XG4gIH1cblxuICAvKiogQHR5cGUgZnVuY3Rpb24oKSAqL1xuICB0aGlzLmhhbmRsZSA9IERlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUuYmluZCh0aGlzKTtcbn1cblxuLyoqXG4gKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50c1xuICogb24gdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5yb290ID0gZnVuY3Rpb24ocm9vdCkge1xuICB2YXIgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwO1xuICB2YXIgZXZlbnRUeXBlO1xuXG4gIC8vIFJlbW92ZSBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMV0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcFswXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgbm8gcm9vdCBvciByb290IGlzIG5vdFxuICAvLyBhIGRvbSBub2RlLCB0aGVuIHJlbW92ZSBpbnRlcm5hbFxuICAvLyByb290IHJlZmVyZW5jZSBhbmQgZXhpdCBoZXJlXG4gIGlmICghcm9vdCB8fCAhcm9vdC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnJvb3RFbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgcm9vdCBub2RlIGF0IHdoaWNoXG4gICAqIGxpc3RlbmVycyBhcmUgYXR0YWNoZWQuXG4gICAqXG4gICAqIEB0eXBlIE5vZGVcbiAgICovXG4gIHRoaXMucm9vdEVsZW1lbnQgPSByb290O1xuXG4gIC8vIFNldCB1cCBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzFdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0cnVlKTtcbiAgICB9XG4gIH1cbiAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMF0pIHtcbiAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuY2FwdHVyZUZvclR5cGUgPSBmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgcmV0dXJuIFsnYmx1cicsICdlcnJvcicsICdmb2N1cycsICdsb2FkJywgJ3Jlc2l6ZScsICdzY3JvbGwnXS5pbmRleE9mKGV2ZW50VHlwZSkgIT09IC0xO1xufTtcblxuLyoqXG4gKiBBdHRhY2ggYSBoYW5kbGVyIHRvIG9uZVxuICogZXZlbnQgZm9yIGFsbCBlbGVtZW50c1xuICogdGhhdCBtYXRjaCB0aGUgc2VsZWN0b3IsXG4gKiBub3cgb3IgaW4gdGhlIGZ1dHVyZVxuICpcbiAqIFRoZSBoYW5kbGVyIGZ1bmN0aW9uIHJlY2VpdmVzXG4gKiB0aHJlZSBhcmd1bWVudHM6IHRoZSBET00gZXZlbnRcbiAqIG9iamVjdCwgdGhlIG5vZGUgdGhhdCBtYXRjaGVkXG4gKiB0aGUgc2VsZWN0b3Igd2hpbGUgdGhlIGV2ZW50XG4gKiB3YXMgYnViYmxpbmcgYW5kIGEgcmVmZXJlbmNlXG4gKiB0byBpdHNlbGYuIFdpdGhpbiB0aGUgaGFuZGxlcixcbiAqICd0aGlzJyBpcyBlcXVhbCB0byB0aGUgc2Vjb25kXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBUaGUgbm9kZSB0aGF0IGFjdHVhbGx5IHJlY2VpdmVkXG4gKiB0aGUgZXZlbnQgY2FuIGJlIGFjY2Vzc2VkIHZpYVxuICogJ2V2ZW50LnRhcmdldCcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBMaXN0ZW4gZm9yIHRoZXNlIGV2ZW50c1xuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzZWxlY3RvciBPbmx5IGhhbmRsZSBldmVudHMgb24gZWxlbWVudHMgbWF0Y2hpbmcgdGhpcyBzZWxlY3RvciwgaWYgdW5kZWZpbmVkIG1hdGNoIHJvb3QgZWxlbWVudFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBoYW5kbGVyIEhhbmRsZXIgZnVuY3Rpb24gLSBldmVudCBkYXRhIHBhc3NlZCBoZXJlIHdpbGwgYmUgaW4gZXZlbnQuZGF0YVxuICogQHBhcmFtIHtPYmplY3R9IFtldmVudERhdGFdIERhdGEgdG8gcGFzcyBpbiBldmVudC5kYXRhXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciByb290LCBsaXN0ZW5lck1hcCwgbWF0Y2hlciwgbWF0Y2hlclBhcmFtO1xuXG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBldmVudCB0eXBlOiAnICsgZXZlbnRUeXBlKTtcbiAgfVxuXG4gIC8vIGhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gRmFsbGJhY2sgdG8gc2Vuc2libGUgZGVmYXVsdHNcbiAgLy8gaWYgdXNlQ2FwdHVyZSBub3Qgc2V0XG4gIGlmICh1c2VDYXB0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICB1c2VDYXB0dXJlID0gdGhpcy5jYXB0dXJlRm9yVHlwZShldmVudFR5cGUpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSGFuZGxlciBtdXN0IGJlIGEgdHlwZSBvZiBGdW5jdGlvbicpO1xuICB9XG5cbiAgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuXG4gIC8vIEFkZCBtYXN0ZXIgaGFuZGxlciBmb3IgdHlwZSBpZiBub3QgY3JlYXRlZCB5ZXRcbiAgaWYgKCFsaXN0ZW5lck1hcFtldmVudFR5cGVdKSB7XG4gICAgaWYgKHJvb3QpIHtcbiAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gICAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSA9IFtdO1xuICB9XG5cbiAgaWYgKCFzZWxlY3Rvcikge1xuICAgIG1hdGNoZXJQYXJhbSA9IG51bGw7XG5cbiAgICAvLyBDT01QTEVYIC0gbWF0Y2hlc1Jvb3QgbmVlZHMgdG8gaGF2ZSBhY2Nlc3MgdG9cbiAgICAvLyB0aGlzLnJvb3RFbGVtZW50LCBzbyBiaW5kIHRoZSBmdW5jdGlvbiB0byB0aGlzLlxuICAgIG1hdGNoZXIgPSBtYXRjaGVzUm9vdC5iaW5kKHRoaXMpO1xuXG4gIC8vIENvbXBpbGUgYSBtYXRjaGVyIGZvciB0aGUgZ2l2ZW4gc2VsZWN0b3JcbiAgfSBlbHNlIGlmICgvXlthLXpdKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzVGFnO1xuICB9IGVsc2UgaWYgKC9eI1thLXowLTlcXC1fXSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3Rvci5zbGljZSgxKTtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc0lkO1xuICB9IGVsc2Uge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzO1xuICB9XG5cbiAgLy8gQWRkIHRvIHRoZSBsaXN0IG9mIGxpc3RlbmVyc1xuICBsaXN0ZW5lck1hcFtldmVudFR5cGVdLnB1c2goe1xuICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIG1hdGNoZXI6IG1hdGNoZXIsXG4gICAgbWF0Y2hlclBhcmFtOiBtYXRjaGVyUGFyYW1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyXG4gKiBmb3IgZWxlbWVudHMgdGhhdCBtYXRjaFxuICogdGhlIHNlbGVjdG9yLCBmb3JldmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtldmVudFR5cGVdIFJlbW92ZSBoYW5kbGVycyBmb3IgZXZlbnRzIG1hdGNoaW5nIHRoaXMgdHlwZSwgY29uc2lkZXJpbmcgdGhlIG90aGVyIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc2VsZWN0b3JdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIG90aGVyIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gW2hhbmRsZXJdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIHByZXZpb3VzIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB1c2VDYXB0dXJlKSB7XG4gIHZhciBpLCBsaXN0ZW5lciwgbGlzdGVuZXJNYXAsIGxpc3RlbmVyTGlzdCwgc2luZ2xlRXZlbnRUeXBlO1xuXG4gIC8vIEhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VDYXB0dXJlID0gaGFuZGxlcjtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgLy8gSWYgdXNlQ2FwdHVyZSBub3Qgc2V0LCByZW1vdmVcbiAgLy8gYWxsIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdHJ1ZSk7XG4gICAgdGhpcy5vZmYoZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgZmFsc2UpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwW3VzZUNhcHR1cmUgPyAxIDogMF07XG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgZm9yIChzaW5nbGVFdmVudFR5cGUgaW4gbGlzdGVuZXJNYXApIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShzaW5nbGVFdmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMub2ZmKHNpbmdsZUV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcbiAgaWYgKCFsaXN0ZW5lckxpc3QgfHwgIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFJlbW92ZSBvbmx5IHBhcmFtZXRlciBtYXRjaGVzXG4gIC8vIGlmIHNwZWNpZmllZFxuICBmb3IgKGkgPSBsaXN0ZW5lckxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgIGlmICgoIXNlbGVjdG9yIHx8IHNlbGVjdG9yID09PSBsaXN0ZW5lci5zZWxlY3RvcikgJiYgKCFoYW5kbGVyIHx8IGhhbmRsZXIgPT09IGxpc3RlbmVyLmhhbmRsZXIpKSB7XG4gICAgICBsaXN0ZW5lckxpc3Quc3BsaWNlKGksIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFsbCBsaXN0ZW5lcnMgcmVtb3ZlZFxuICBpZiAoIWxpc3RlbmVyTGlzdC5sZW5ndGgpIHtcbiAgICBkZWxldGUgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXTtcblxuICAgIC8vIFJlbW92ZSB0aGUgbWFpbiBoYW5kbGVyXG4gICAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBIYW5kbGUgYW4gYXJiaXRyYXJ5IGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbihldmVudCkge1xuICB2YXIgaSwgbCwgdHlwZSA9IGV2ZW50LnR5cGUsIHJvb3QsIHBoYXNlLCBsaXN0ZW5lciwgcmV0dXJuZWQsIGxpc3RlbmVyTGlzdCA9IFtdLCB0YXJnZXQsIC8qKiBAY29uc3QgKi8gRVZFTlRJR05PUkUgPSAnZnRMYWJzRGVsZWdhdGVJZ25vcmUnO1xuXG4gIGlmIChldmVudFtFVkVOVElHTk9SRV0gPT09IHRydWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cbiAgLy8gSGFyZGNvZGUgdmFsdWUgb2YgTm9kZS5URVhUX05PREVcbiAgLy8gYXMgbm90IGRlZmluZWQgaW4gSUU4XG4gIGlmICh0YXJnZXQubm9kZVR5cGUgPT09IDMpIHtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuXG4gIHBoYXNlID0gZXZlbnQuZXZlbnRQaGFzZSB8fCAoIGV2ZW50LnRhcmdldCAhPT0gZXZlbnQuY3VycmVudFRhcmdldCA/IDMgOiAyICk7XG4gIFxuICBzd2l0Y2ggKHBoYXNlKSB7XG4gICAgY2FzZSAxOiAvL0V2ZW50LkNBUFRVUklOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV07XG4gICAgYnJlYWs7XG4gICAgY2FzZSAyOiAvL0V2ZW50LkFUX1RBUkdFVDpcbiAgICAgIGlmICh0aGlzLmxpc3RlbmVyTWFwWzBdICYmIHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTGlzdC5jb25jYXQodGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXSk7XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFsxXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV0pO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMzogLy9FdmVudC5CVUJCTElOR19QSEFTRTpcbiAgICAgIGxpc3RlbmVyTGlzdCA9IHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV07XG4gICAgYnJlYWs7XG4gIH1cblxuICAvLyBOZWVkIHRvIGNvbnRpbnVvdXNseSBjaGVja1xuICAvLyB0aGF0IHRoZSBzcGVjaWZpYyBsaXN0IGlzXG4gIC8vIHN0aWxsIHBvcHVsYXRlZCBpbiBjYXNlIG9uZVxuICAvLyBvZiB0aGUgY2FsbGJhY2tzIGFjdHVhbGx5XG4gIC8vIGNhdXNlcyB0aGUgbGlzdCB0byBiZSBkZXN0cm95ZWQuXG4gIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICB3aGlsZSAodGFyZ2V0ICYmIGwpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgICAgLy8gQmFpbCBmcm9tIHRoaXMgbG9vcCBpZlxuICAgICAgLy8gdGhlIGxlbmd0aCBjaGFuZ2VkIGFuZFxuICAgICAgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgYXJlXG4gICAgICAvLyBkZWZpbmVkIGJldHdlZW4gaSBhbmQgbC5cbiAgICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGZvciBtYXRjaCBhbmQgZmlyZVxuICAgICAgLy8gdGhlIGV2ZW50IGlmIHRoZXJlJ3Mgb25lXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXlcbiAgICAgIC8vIHRvIGNoZWNrIGlmIGV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvblxuICAgICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGJvdGggbG9vcHMuXG4gICAgICBpZiAobGlzdGVuZXIubWF0Y2hlci5jYWxsKHRhcmdldCwgbGlzdGVuZXIubWF0Y2hlclBhcmFtLCB0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybmVkID0gdGhpcy5maXJlKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RvcCBwcm9wYWdhdGlvbiB0byBzdWJzZXF1ZW50XG4gICAgICAvLyBjYWxsYmFja3MgaWYgdGhlIGNhbGxiYWNrIHJldHVybmVkXG4gICAgICAvLyBmYWxzZVxuICAgICAgaWYgKHJldHVybmVkID09PSBmYWxzZSkge1xuICAgICAgICBldmVudFtFVkVOVElHTk9SRV0gPSB0cnVlO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXkgdG9cbiAgICAvLyBjaGVjayBpZiBldmVudCNzdG9wUHJvcGFnYXRpb25cbiAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgbG9vcGluZ1xuICAgIC8vIHRocm91Z2ggdGhlIERPTS4gU3RvcCBpZiB0aGVcbiAgICAvLyBkZWxlZ2F0aW9uIHJvb3QgaGFzIGJlZW4gcmVhY2hlZFxuICAgIGlmICh0YXJnZXQgPT09IHJvb3QpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnRFbGVtZW50O1xuICB9XG59O1xuXG4vKipcbiAqIEZpcmUgYSBsaXN0ZW5lciBvbiBhIHRhcmdldC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBsaXN0ZW5lclxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgcmV0dXJuIGxpc3RlbmVyLmhhbmRsZXIuY2FsbCh0YXJnZXQsIGV2ZW50LCB0YXJnZXQpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSBnZW5lcmljIHNlbGVjdG9yLlxuICpcbiAqIEB0eXBlIGZ1bmN0aW9uKClcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciBBIENTUyBzZWxlY3RvclxuICovXG52YXIgbWF0Y2hlcyA9IChmdW5jdGlvbihlbCkge1xuICBpZiAoIWVsKSByZXR1cm47XG4gIHZhciBwID0gZWwucHJvdG90eXBlO1xuICByZXR1cm4gKHAubWF0Y2hlcyB8fCBwLm1hdGNoZXNTZWxlY3RvciB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IHAub01hdGNoZXNTZWxlY3Rvcik7XG59KEVsZW1lbnQpKTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSB0YWcgc2VsZWN0b3IuXG4gKlxuICogVGFncyBhcmUgTk9UIGNhc2Utc2Vuc2l0aXZlLFxuICogZXhjZXB0IGluIFhNTCAoYW5kIFhNTC1iYXNlZFxuICogbGFuZ3VhZ2VzIHN1Y2ggYXMgWEhUTUwpLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIFRoZSB0YWcgbmFtZSB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1RhZyh0YWdOYW1lLCBlbGVtZW50KSB7XG4gIHJldHVybiB0YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyB0aGUgcm9vdC5cbiAqXG4gKiBAcGFyYW0gez9TdHJpbmd9IHNlbGVjdG9yIEluIHRoaXMgY2FzZSB0aGlzIGlzIGFsd2F5cyBwYXNzZWQgdGhyb3VnaCBhcyBudWxsIGFuZCBub3QgdXNlZFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzUm9vdChzZWxlY3RvciwgZWxlbWVudCkge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSovXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50ID09PSB3aW5kb3cpIHJldHVybiBlbGVtZW50ID09PSBkb2N1bWVudDtcbiAgcmV0dXJuIHRoaXMucm9vdEVsZW1lbnQgPT09IGVsZW1lbnQ7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgSUQgb2ZcbiAqIHRoZSBlbGVtZW50IGluICd0aGlzJ1xuICogbWF0Y2hlcyB0aGUgZ2l2ZW4gSUQuXG4gKlxuICogSURzIGFyZSBjYXNlLXNlbnNpdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIElEIHRvIHRlc3QgYWdhaW5zdFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzSWQoaWQsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIGlkID09PSBlbGVtZW50LmlkO1xufVxuXG4vKipcbiAqIFNob3J0IGhhbmQgZm9yIG9mZigpXG4gKiBhbmQgcm9vdCgpLCBpZSBib3RoXG4gKiB3aXRoIG5vIHBhcmFtZXRlcnNcbiAqXG4gKiBAcmV0dXJuIHZvaWRcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vZmYoKTtcbiAgdGhpcy5yb290KCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVxd2VzdCA9IHJlcXVpcmUoXCIuLy4uL3JlcXdlc3QvcmVxd2VzdC5qc1wiKTtcbnZhciBEZWxlZ2F0ZSA9IHJlcXVpcmUoXCIuLy4uL2RvbS1kZWxlZ2F0ZS9saWIvZGVsZWdhdGUuanNcIik7XG52YXIgaGVhZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm8taGVhZGVyJyk7XG52YXIgbXlGdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vLWhlYWRlcl9fc2Vjb25kYXJ5LS1teWZ0LWpzJyk7XG52YXIgbXlGVEJ1dHRvbiA9IGhlYWRlci5xdWVyeVNlbGVjdG9yKCcuby1oZWFkZXItYnV0dG9uLWpzW2RhdGEtdGFyZ2V0LXBhbmVsPVwibXlmdFwiXScpO1xudmFyIGRlZmF1bHRQYW5lbCA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoJ2RhdGEtZGVmYXVsdC1wYW5lbCcpO1xudmFyIGRlbGVnYXRlID0gbmV3IERlbGVnYXRlKGhlYWRlcik7XG52YXIgYm9keURlbGVnYXRlID0gbmV3IERlbGVnYXRlKCk7XG52YXIgTm90aWZ5ID0gcmVxdWlyZSgnLi9zcmMvanMvTm90aWZ5Jyk7XG52YXIgbmV4dFVzZXJQcmVmZXJlbmNlcyA9IHJlcXVpcmUoXCIuLy4uL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbWFpbi5qc1wiKTtcblxuZGVsZWdhdGUub24oJ2NsaWNrJywgJy5vLWhlYWRlci1idXR0b24tanMnLCBmdW5jdGlvbihldmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHQvLyBIQUNLXG5cdHZhciB0YXJnZXRQYW5lbCA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGFyZ2V0LXBhbmVsJylcblx0XHR8fCBldmVudC50YXJnZXQucGFyZW50Tm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGFyZ2V0LXBhbmVsJylcblx0XHR8fCBkZWZhdWx0UGFuZWw7XG5cdHZhciBjdXJyZW50UGFuZWwgPSBoZWFkZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXBhbmVsJyk7XG5cdGlmIChjdXJyZW50UGFuZWwgIT09IHRhcmdldFBhbmVsICYmIHRhcmdldFBhbmVsICE9PSBkZWZhdWx0UGFuZWwpIHtcblx0XHRib2R5RGVsZWdhdGUucm9vdChkb2N1bWVudC5ib2R5KTtcblx0XHRoZWFkZXIuc2V0QXR0cmlidXRlKCdkYXRhLXBhbmVsJywgdGFyZ2V0UGFuZWwpO1xuXHR9IGVsc2Uge1xuXHRcdGJvZHlEZWxlZ2F0ZS5yb290KCk7XG5cdFx0aWYgKGRlZmF1bHRQYW5lbCkge1xuXHRcdFx0aGVhZGVyLnNldEF0dHJpYnV0ZSgnZGF0YS1wYW5lbCcsIGRlZmF1bHRQYW5lbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGhlYWRlci5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5kZWxlZ2F0ZS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbn0pO1xuXG5ib2R5RGVsZWdhdGUub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdGlmIChkZWZhdWx0UGFuZWwpIHtcblx0XHRoZWFkZXIuc2V0QXR0cmlidXRlKCdkYXRhLXBhbmVsJywgZGVmYXVsdFBhbmVsKTtcblx0fSBlbHNlIHtcblx0XHRoZWFkZXIucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXBhbmVsJyk7XG5cdH1cbn0pO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdub3RpZmljYXRpb25zOmxvYWQnLCBmdW5jdGlvbihlKSB7XG5cdHZhciB0b3RhbCA9IDAsIFxuXHRcdFx0bm90aWZpY2F0aW9ucyA9IGUuZGV0YWlsO1xuXHRmb3IodmFyIHN0cmVhbSBpbiBub3RpZmljYXRpb25zKSB7XG5cdFx0aWYobm90aWZpY2F0aW9uc1tzdHJlYW1dKSB7XG5cdFx0XHR0b3RhbCArPSBub3RpZmljYXRpb25zW3N0cmVhbV0ubGVuZ3RoO1xuXHRcdH1cblx0fVxuXHRpZih0b3RhbCA+IDApIHtcblx0XHRpZihteUZUQnV0dG9uLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ25vdGlmeS1iYWRnZScpLmxlbmd0aCkge1xuXHRcdFx0bXlGVEJ1dHRvbi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdub3RpZnktYmFkZ2UnKVswXS50ZXh0Q29udGVudCA9IHRvdGFsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRteUZUQnV0dG9uLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgJzxzcGFuIGNsYXNzPVwibm90aWZ5LWJhZGdlXCI+Jyt0b3RhbCArICc8L3NwYW4+Jylcblx0XHR9XG5cdH1cbn0pO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdub3RpZmljYXRpb25zOm5ldycsIGZ1bmN0aW9uKGUpIHtcblx0dmFyIHRvdGFsID0gMCwgXG5cdFx0XHRkYXRhID0gZS5kZXRhaWw7XG5cdFxuXHR2YXIgaWQgPSBkYXRhLm5vdGlmaWNhdGlvbnNbMF0uaXRlbTtcblx0cmVxd2VzdCh7XG5cdFx0dXJsOiAnLycgKyBpZCxcblx0XHRoZWFkZXJzOiB7XG5cdFx0XHQnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0J0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdH1cblx0fSkudGhlbihmdW5jdGlvbihyZXMpIHtcblx0XHRuZXcgTm90aWZ5KHtcblx0XHRcdHRpdGxlOiAnTmV3IGFydGljbGUgaW4gJyArIGRhdGEuc3RyZWFtLmRpc3BsYXlUZXh0LFxuXHRcdFx0Ym9keTogcmVzLmhlYWRsaW5lLFxuXHRcdFx0bGlmZXNwYW46IDEwMDAgKiAxMCxcblx0XHRcdG9uY2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRsb2NhdGlvbi5ocmVmID0gJy8nICsgcmVzLmlkXG5cdFx0XHR9XG5cdFx0fSkuc2hvdygpO1xuXHR9KS5mYWlsKGZ1bmN0aW9uKGVycikge1xuXHRcdG5ldyBOb3RpZnkoe1xuXHRcdFx0dGl0bGU6ICdOZXcgYXJ0aWNsZSBpbiAnICsgZGF0YS5zdHJlYW0uZGlzcGxheVRleHQsXG5cdFx0XHRsaWZlc3BhbjogMTAwMCAqIDEwLFxuXHRcdFx0b25jbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSAnLycgKyBkYXRhLm5vdGlmaWNhdGlvbnNbMF0uaXRlbVxuXHRcdFx0fVxuXHRcdH0pLnNob3coKTtcblx0fSk7XG5cblxufSk7XG5cblxuXG5mdW5jdGlvbiB0cmFuc2l0aW9uTXlGVEJ1dHRvbiAodHlwZSkge1xuXG5cdGZ1bmN0aW9uIGxpc3RlbmVyKCkge1xuXHRcdG15RlRCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgndHJhbnNpdGlvbmluZycpO1xuXHRcdG15RlRCdXR0b24ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGxpc3RlbmVyKTtcblx0fTtcblxuXHRteUZUQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBsaXN0ZW5lcik7XG5cdG15RlRCdXR0b24uY2xhc3NMaXN0LmFkZCgndHJhbnNpdGlvbmluZycpO1xuXHRteUZUQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ215ZnQtLScgKyB0eXBlKTtcblx0bXlGVEJ1dHRvbi5vZmZzZXRXaWR0aDsgLy9mb3JjZXMgcmVwYWludFxuXG5cdG15RlRCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgnbXlmdC0tJyArIHR5cGUpO1xufVxuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmYXZvdXJpdGVzOmFkZCcsIGZ1bmN0aW9uIChlKSB7XG5cdHRyYW5zaXRpb25NeUZUQnV0dG9uKCdhZGQtZmF2b3VyaXRlJyk7XG59KTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZmF2b3VyaXRlczpyZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuXHR0cmFuc2l0aW9uTXlGVEJ1dHRvbigncmVtb3ZlLWZhdm91cml0ZScpO1xufSk7XG5cbnJlcXdlc3QoJ2h0dHA6Ly9uZXh0LWNvbXBhbmllcy1ldC1hbC5oZXJva3VhcHAuY29tL3YxL3ViZXJuYXYuanNvbicsIGZ1bmN0aW9uKHJlc3ApIHtcblx0dmFyIGRhdGEgPSByZXNwLmRhdGE7XG5cdGhlYWRlci5xdWVyeVNlbGVjdG9yKCcuby1oZWFkZXJfX3NlY29uZGFyeS0tbWVudS1qcycpLmlubmVySFRNTCA9ICc8dWwgY2xhc3M9XCJ1YmVyLWluZGV4XCI+J1xuXHRcdCsgZGF0YS5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdHJldHVybiAnPGxpIGNsYXNzPVwidWJlci1pbmRleF9fdGl0bGVcIiBkYXRhLW8tZ3JpZC1jb2xzcGFuPVwiNiBNNiBMMyBYTDNcIj4nXG5cdFx0XHQrICc8YSBocmVmPVwiJyArIGl0ZW0ubmV4dFVybCArICdcIj4nICsgaXRlbS50aXRsZSArICc8L2E+J1xuXHRcdFx0KyAnPHVsIGNsYXNzPVwidWJlci1pbmRleF9fY2hpbGRyZW5cIj4nXG5cdFx0XHQrIGl0ZW0ubmF2aWdhdGlvbkl0ZW1zLm1hcChmdW5jdGlvbihjaGlsZCkge1xuXHRcdFx0XHRyZXR1cm4gJzxsaSBjbGFzcz1cInViZXItaW5kZXhfX2NoaWxkXCI+PGEgaHJlZj1cIicgKyBjaGlsZC5uZXh0VXJsICsgJ1wiPicgKyBjaGlsZC50aXRsZSArICc8L2E+PC9saT4nO1xuXHRcdFx0fSkuam9pbignJylcblx0XHRcdCsgJzwvdWw+J1xuXHRcdFx0KyAnPC9saT4nO1xuXHRcdH0pLmpvaW4oJycpO1xuXHRcdCsgJzwvdWw+Jztcbn0pO1xuXG5pZiAobXlGdCkgbmV4dFVzZXJQcmVmZXJlbmNlcy5pbml0KG15RnQsIHsgbm90aWZ5OiB0cnVlIH0pO1xuIiwiLyoqXG4gKiBNZXNzYWdlIHRoZSB1c2VyXG4gKlxuICogPiBuZXcgTm90aWZ5KHsgaHRtbDogXCJZb3UndmUgZ290IG1haWxcIiwgbGlmZXNwYWNlOiAxMDAwMCB9KS5zaG93KCk7XG4gKlxuICogVE9ET1xuICpcbiAqICAtIFVYIHRvIGRlYWwgd2l0aCBtdWx0aXBsZSBtZXNzYWdlcy5cbiAqICAtIFczIC8gQ2hyb21lIGRlc2t0b3Agbm90aWZpY2F0aW9ucyBwZXJtaXNzaW9uLlxuICogIC0gQWNrbm93bGVkZ2VtZW50IFVYXG4gKlxuICovXG52YXIgTm90aWZ5ID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICB0aGlzLnRlbXBsYXRlID0gJzxoMyBjbGFzcz1cIm1lc3NhZ2VfX3RpdGxlXCI+JyArIG1lc3NhZ2UudGl0bGUgKyAnPGkgY2xhc3M9XCJtZXNzYWdlX19jbG9zZSBpY29uIGljb25fX2Nsb3NlXCI+PC9pPjwvaDM+PHNwYW4gY2xhc3M9XCJtZXNzYWdlX19ib2R5XCI+JyArIG1lc3NhZ2UuYm9keSArICc8L3NwYW4+JztcbiAgICB0aGlzLmxpZmVzcGFuID0gbWVzc2FnZS5saWZlc3BhbiB8fCA1MDAwO1xuICAgIHRoaXMuZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5kb20uY2xhc3NOYW1lID0gJ21lc3NhZ2VfX2NvbnRhaW5lcidcbiAgICB0aGlzLmRvbS5pbm5lckhUTUwgPSB0aGlzLnRlbXBsYXRlOyBcbiAgICB0aGlzLmhhc0Rlc2t0b3BQZXJtaXNzaW9uID0gZmFsc2U7XG4gICAgdGhpcy5yb290ID0gZG9jdW1lbnQuYm9keTtcbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xufTtcblxuZnVuY3Rpb24gY3JlYXRlTm90aWZpY2F0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgbm90aWZpY2F0aW9uID0gbmV3IE5vdGlmaWNhdGlvbihtZXNzYWdlLnRpdGxlLCB7Ym9keTogbWVzc2FnZS5ib2R5fSk7XG4gICAgbm90aWZpY2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgbWVzc2FnZS5vbmNsaWNrKTtcbiAgICByZXR1cm4gbm90aWZpY2F0aW9uO1xufVxuXG5Ob3RpZnkucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiAoKSB7XG4gICAgXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIGdyYW50ZWRcbiAgICAvL1RPRE8gLSBlbmFibGUgdGhpcyBhZ2FpbiBvbmNlIHdlJ3ZlIHRob3VnaHQgYWJvdXQgdGhlIFVYIVxuICAgIGlmIChmYWxzZSAmJiB3aW5kb3cuTm90aWZpY2F0aW9uICYmIE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICBjcmVhdGVOb3RpZmljYXRpb24oc2VsZi5tZXNzYWdlKTtcbiAgICB9IGVsc2UgaWYgKGZhbHNlICYmIHdpbmRvdy5Ob3RpZmljYXRpb24gJiYgTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09IFwiZGVuaWVkXCIpIHtcbiAgICAgIFxuICAgICAgICBOb3RpZmljYXRpb24ucmVxdWVzdFBlcm1pc3Npb24oZnVuY3Rpb24gKHN0YXR1cykge1xuICAgICAgICAgICAgaWYgKE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uICE9PSBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9IHN0YXR1cztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZ3JhbnRlZFxuICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgICAgICBjcmVhdGVOb3RpZmljYXRpb24oc2VsZi5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zaG93SHRtbE5vdGlmaWNhdGlvbigpOyAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgLy8gZGVuaWVkXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zaG93SHRtbE5vdGlmaWNhdGlvbigpOyAgICBcbiAgICB9XG59O1xuXG5Ob3RpZnkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gRklYTUUgZm9yZ2V0IGlmIEkgbmVlZCB0byByZW1vdmUgZXZlbnQgbGlzdGVuZXIgOilcbiAgICB0aGlzLmRvbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZG9tKTtcbn07XG5cbk5vdGlmeS5wcm90b3R5cGUuc2hvd0h0bWxOb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLnJvb3QuYXBwZW5kQ2hpbGQodGhpcy5kb20pO1xuXG4gICAgLy8gQXV0b21hdGljYWxseSBkZXN0cm95IHRoZSBib3ggYWZ0ZXIgYSBmZXcgc2Vjb25kc1xuICAgIHZhciBzZWxmRGVzdHJ1Y3QgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgfSwgdGhpcy5saWZlc3Bhbik7IFxuXG4gICAgLy8gQWNrbm93bGVkZ21lbnQgVUlcbiAgICB0aGlzLmRvbS5xdWVyeVNlbGVjdG9yKCcubWVzc2FnZV9fY2xvc2UnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIGNsZWFyVGltZW91dChzZWxmRGVzdHJ1Y3QpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5kb20uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZihlLnRhcmdldC5jbGFzc05hbWUuaW5kZXhPZignbWVzc2FnZV9fY2xvc2UnKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5tZXNzYWdlLm9uY2xpY2soKTtcbiAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIGNsZWFyVGltZW91dChzZWxmRGVzdHJ1Y3QpO1xuICAgIH0pO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGlmeTsiLCIvLyBTdG9yZXMgYSB1bmlxdWUgbGlzdCBvZiB0aGluZ3MgKEVnLCBzZWN0aW9ucywgZmF2b3VyaXRlcywgaGlzdG9yeSkgYWdhaW5zdCBhXG4vLyBrZXkgaW4gbG9jYWxTdG9yYWdlXG5cbnZhciByZXF3ZXN0ID0gcmVxdWlyZSgnLi4vdmVuZG9yL3JlcXdlc3QubWluJyk7XG5cbnZhciBBUElfVVJMID0gJ2h0dHA6Ly9mdC1uZXh0LWFwaS11c2VyLXByZWZzLmhlcm9rdWFwcC5jb20vdXNlci8nO1xuXG52YXIgZW1pdCA9IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcbiAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gIGV2ZW50LmluaXRFdmVudChuYW1lLCB0cnVlLCB0cnVlKTtcbiAgaWYgKGRhdGEpIHtcbiAgICBldmVudC5kZXRhaWwgPSBkYXRhO1xuICB9XG4gIHRvcC5kb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cblxudmFyIE1lID0gZnVuY3Rpb24gKGtleSwgdXNlcklkKSB7XG4gIGlmICgha2V5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbXVzdCBzdXBwbHkgYSBrZXkgL15bYS16XSskLycpO1xuICB9XG4gIHRoaXMua2V5ID0ga2V5O1xuXG4gIHRoaXMubG9jYWxTdG9yYWdlS2V5ID0gJ2Z0Lm5leHQudXNlci4nICsga2V5O1xuXG4gIGlmKHVzZXJJZCkge1xuICAgIHRoaXMuYXBpVVJMID0gQVBJX1VSTCArIGtleTtcbiAgICB0aGlzLnVzZXJJZCA9IHVzZXJJZDtcbiAgfSAgICAgIFxuICAgIC8vU3RhcnQgb2ZmIHdpdGggbG9jYWwgY29weS4uLlxuICAgIHRoaXMudmFsID0gdGhpcy5nZXRPckNyZWF0ZSgpO1xuICAgIC8vVGhlbiB0cnkgYW5kIGZldGNoIHNlcnZlciBjb3B5XG4gICAgdGhpcy5mZXRjaCgpO1xuXG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBrZXkgPSBrZXkgfHwgdGhpcy5sb2NhbFN0b3JhZ2VLZXk7XG4gICAgdmFyIGV4aXN0cyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgaWYgKGV4aXN0cykge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZXhpc3RzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfTtcblxuICBNZS5wcm90b3R5cGUuZ2V0T3JDcmVhdGUgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAga2V5ID0ga2V5IHx8IHRoaXMubG9jYWxTdG9yYWdlS2V5O1xuICAgIHZhciBzYXZlZCA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYoc2F2ZWQpIHtcbiAgICAgIHJldHVybiBzYXZlZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGVtcHR5ID0gW107XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KGVtcHR5KSk7XG4gICAgICByZXR1cm4gZW1wdHk7XG4gICAgfVxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5mZXRjaCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIC8vSWYgbm8gdXNlcklEIGRvbid0IGZldGNoIGZyb20gc2VydmVyXG4gICAgaWYoIXRoaXMudXNlcklkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmVxd2VzdCh7XG4gICAgICB1cmw6IHRoaXMuYXBpVVJMLFxuICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgbWV0aG9kOiAnZ2V0JyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1gtRlQtVUlEJzogdGhpcy51c2VySWRcbiAgICAgIH0sXG4gICAgICBjcm9zc09yaWdpbjogdHJ1ZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24oZmF2ZXMpIHtcbiAgICAgIGlmKGZhdmVzKSB7XG4gICAgICAgIG1lLnZhbCA9IGZhdmVzO1xuICAgICAgICAvL2FjY2VwdCB0aGUgc2VydmVyIGNvcHkgYXMgJ3RoZSB0cnV0aCcuLi5cbiAgICAgICAgbWUuc2F2ZShtZS52YWwpO1xuICAgICAgICAvL2J1dCB0aGVuIHByb2Nlc3MgYW55IGxlZnRvdmVyIHJlcXVlc3RzIGxvY2FsbHlcbiAgICAgICAgbWUucHJvY2Vzc1BlbmRpbmcoJ2FkZCcpO1xuICAgICAgICBtZS5wcm9jZXNzUGVuZGluZygncmVtb3ZlJyk7XG4gICAgICAgIG1lLnByb2Nlc3NQZW5kaW5nKCdjbGVhcicpO1xuICAgICAgfVxuICAgIH0pLmFsd2F5cyhmdW5jdGlvbihlcnIpIHtcbiAgICAgIC8vdHJpZ2dlciBsb2FkIGFuZCB1cGRhdGUgZXZlbnRzXG4gICAgICBlbWl0KG1lLmtleSArICc6bG9hZCcsIG1lKTtcbiAgICAgIGVtaXQobWUua2V5ICsgJzp1cGRhdGUnLCBtZSk7XG4gICAgfSk7ICBcbiAgfTtcblxuICBNZS5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uIChvYmosIGtleSkge1xuICAgIGtleSA9IGtleSB8fCB0aGlzLmxvY2FsU3RvcmFnZUtleTtcbiAgICBpZihvYmogJiYgb2JqLmxlbmd0aCkge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShvYmopKTsgXG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XG4gICAgfVxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5hZGRQZW5kaW5nID0gZnVuY3Rpb24ob2JqLCBhY3Rpb24pIHtcbiAgICB2YXIgcGVuZGluZyA9IHRoaXMuZ2V0T3JDcmVhdGUodGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLicgKyBhY3Rpb24pO1xuICAgIHBlbmRpbmcucHVzaChvYmopO1xuICAgIC8vaWYgd2UncmUgYWRkaW5nIHNvbWV0aGluZywgdGhlbiBnZXQgcmlkIG9mIGFueSBwZW5kaW5nIGNsZWFyIHJlcXVlc3RzXG4gICAgaWYoYWN0aW9uID09PSAnYWRkJykge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLmNsZWFyJyk7XG4gICAgfVxuICAgIHRoaXMuc2F2ZShwZW5kaW5nLCB0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuJyArIGFjdGlvbik7XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLnByb2Nlc3NQZW5kaW5nID0gZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB2YXIgcGVuZGluZyA9IHRoaXMuZ2V0KHRoaXMubG9jYWxTdG9yYWdlS2V5ICsgJy4nICsgYWN0aW9uKTtcbiAgICBpZihwZW5kaW5nICYmIHBlbmRpbmcubGVuZ3RoKSB7XG4gICAgICAvL0NsZWFyIGlzIGEgc3BlY2lhbCBjYXNlXG4gICAgICBpZihhY3Rpb24gPT09ICdjbGVhcicpIHtcbiAgICAgICAgaWYocGVuZGluZ1twZW5kaW5nLmxlbmd0aCAtIDFdID09PSB0cnVlKSB7XG4gICAgICAgICAgbWUuY2xlYXIoKTtcbiAgICAgICAgICBwZW5kaW5nID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGVuZGluZy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW1Ub0FkZCwgaW5kZXgpIHtcbiAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBpdGVtIGZyb20gdGhlIHRvZG8gbGlzdCBhbmQgZXhlY3V0ZSB0aGUgYWN0aW9uIFxuICAgICAgICAgICBwZW5kaW5nLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgIG1lW2FjdGlvbl0oaXRlbVRvQWRkKTtcbiAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhpcy5zYXZlKHBlbmRpbmcsIHRoaXMubG9jYWxTdG9yYWdlS2V5ICsgJy4nICsgYWN0aW9uKTtcbiAgICB9XG5cbiAgfTtcblxuICBNZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdGhpcy52YWwgPSB0aGlzLmdldE9yQ3JlYXRlKCk7XG4gICAgaWYgKCF0aGlzLmV4aXN0cyhvYmoudXVpZHYzKSkge1xuICAgICAgdGhpcy52YWwucHVzaChvYmopO1xuICAgICAgdGhpcy5zYXZlKHRoaXMudmFsKTtcbiAgICAgIGVtaXQobWUua2V5ICsgJzp1cGRhdGUnLCBtZSk7IC8vdHJpZ2dlciBldmVudCB0byByZW5kZXIgVUlcblxuICAgICAgLy9TZW5kIGEgcmVxdWVzdCB0byBhZGQgdG8gc2VydmVyXG4gICAgICBpZih0aGlzLmFwaVVSTCkge1xuICAgICAgICByZXF3ZXN0KHtcbiAgICAgICAgICB1cmw6IHRoaXMuYXBpVVJMLFxuICAgICAgICAgIG1ldGhvZDogJ3B1dCcsXG4gICAgICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkob2JqKSxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnWC1GVC1VSUQnOiB0aGlzLnVzZXJJZFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgICBtZS5hZGRQZW5kaW5nKG9iaiwgJ2FkZCcpOyAvL3NlcnZlciByZXF1ZXN0IGZhaWxlZCBzbyBwdXNoIGl0IHRvIHRoZSBsaXN0IG9mIHBlbmRpbmdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIHRoaXMudmFsID0gdGhpcy5nZXRPckNyZWF0ZSgpO1xuICAgIHRoaXMudmFsID0gdGhpcy52YWwuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiAoaXRlbS51dWlkdjMgIT09IG9iai51dWlkdjMpO1xuICAgIH0pO1xuICAgIHRoaXMuc2F2ZSh0aGlzLnZhbCk7XG5cbiAgICBlbWl0KG1lLmtleSArICc6dXBkYXRlJywgbWUpOyAvL3RyaWdnZXIgZXZlbnQgdG8gcmVuZGVyIFVJXG5cbiAgICAvL1NlbmQgYSByZXF1ZXN0IHRvIGRlbGV0ZSBmcm9tIHNlcnZlclxuICAgIGlmKHRoaXMuYXBpVVJMKSB7XG5cbiAgICAgIHJlcXdlc3Qoe1xuICAgICAgICB1cmw6IHRoaXMuYXBpVVJMICsgJy8nICsgZW5jb2RlVVJJKGRlY29kZVVSSShvYmoudXVpZHYzKSksXG4gICAgICAgIHR5cGU6ICdqc29uJyxcbiAgICAgICAgbWV0aG9kOiAnZGVsZXRlJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdYLUZULVVJRCc6IHRoaXMudXNlcklkXG4gICAgICAgIH0sXG4gICAgICAgIGNyb3NzT3JpZ2luOiB0cnVlXG4gICAgICB9KS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICBtZS5hZGRQZW5kaW5nKG9iaiwgJ3JlbW92ZScpOyAgLy9zZXJ2ZXIgcmVxdWVzdCBmYWlsZWQgc28gcHVzaCBpdCB0byB0aGUgbGlzdCBvZiBwZW5kaW5nXG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cblxuICBNZS5wcm90b3R5cGUuZXhpc3RzID0gZnVuY3Rpb24gKHV1aWQpIHtcbiAgICB0aGlzLnZhbCA9IHRoaXMuZ2V0T3JDcmVhdGUoKTtcbiAgICByZXR1cm4gdGhpcy52YWwuc29tZShmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgcmV0dXJuIGl0ZW0udXVpZHYzID09PSB1dWlkO1xuICAgIH0pO1xuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciBzdGF0dXMgPSBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLmxvY2FsU3RvcmFnZUtleSk7XG4gICAgdGhpcy52YWwgPSBbXTtcblxuICAgIGVtaXQobWUua2V5ICsgJzp1cGRhdGUnLCBtZSk7IC8vdHJpZ2dlciBldmVudCB0byByZW5kZXIgVUlcblxuICAgICAgLy9TZW5kIGEgcmVxdWVzdCB0byBkZWxldGUgQUxMIGZyb20gc2VydmVyXG4gICAgICBpZih0aGlzLmFwaVVSTCkge1xuXG4gICAgICAgIHJlcXdlc3Qoe1xuICAgICAgICAgIHVybDogdGhpcy5hcGlVUkwsXG4gICAgICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgICAgIG1ldGhvZDogJ2RlbGV0ZScsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ1gtRlQtVUlEJzogdGhpcy51c2VySWRcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNyb3NzT3JpZ2luOiB0cnVlXG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbWUuYWRkUGVuZGluZyh0cnVlLCAnY2xlYXInKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfTtcblxuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBNZTtcblxuIiwidmFyIHJlcXdlc3QgPSByZXF1aXJlKCcuLi92ZW5kb3IvcmVxd2VzdC5taW4nKTtcblxuXG52YXIgTk9USUZJQ0FUSU9OU19VUkwgPSAnaHR0cDovL2Z0LW5leHQtYXBpLXVzZXItcHJlZnMuaGVyb2t1YXBwLmNvbS91c2VyL25vdGlmaWNhdGlvbnMvJztcbnZhciBlbWl0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuXHR2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcblx0ZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuXHRpZiAoZGF0YSkge1xuXHRcdGV2ZW50LmRldGFpbCA9IGRhdGE7XG5cdH1cblx0dG9wLmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxuXG5mdW5jdGlvbiBleHRyYWN0U2VhcmNoVGVybShxdWVyeVN0cmluZykge1xuICAgIHJldHVybiBxdWVyeVN0cmluZy5tYXRjaCgvcT0oW14mXSopLylbMV07XG59XG5cbnZhciBnZXRDdXJyZW50U3RyZWFtID0gZnVuY3Rpb24oKSB7XG4gIHZhciBvbkFydGljbGUgPSAvXlxcL1thLWYwLTldKy0oLiopLy50ZXN0KGxvY2F0aW9uLnBhdGhuYW1lKTsgLy8gJzI3YTVlMjg2LTQzMTQtMTFlNC04YTQzLTAwMTQ0ZmVhYmRjMCc7IFxuICBpZihvbkFydGljbGUgfHwgbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZignL3NlYXJjaCcpICE9PSAwKSB7IC8vaGFja3kgd2F5IHRvIGV4Y2x1ZGUgaG9tZXBhZ2UhXG4gIFx0cmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICBcdHJldHVybiBleHRyYWN0U2VhcmNoVGVybShsb2NhdGlvbi5zZWFyY2gpO1xuICB9XG59O1xuXG5cbmZ1bmN0aW9uIE5vdGlmaWNhdGlvblBvbGxlcih1c2VyUHJlZmVyZW5jZUxpc3QpIHtcblx0dGhpcy51c2VyUHJlZmVyZW5jZUxpc3QgPSB1c2VyUHJlZmVyZW5jZUxpc3Q7XG5cdHNldEludGVydmFsKHRoaXMucG9sbC5iaW5kKHRoaXMpLCAxMDAwICogNjAgKiAwLjIpOyAvLzMwIHNlY29uZCBwb2xsaW5nXG5cdHRoaXMubm90aWZpY2F0aW9ucyA9IHt9O1xuXG5cdC8vQ2xlYXIgbm90aWZpY2F0aW9ucyBpZiBhIHN0cmVhbSBoYXMgYmVlbiBvcGVuZW5kXG5cdHRoaXMuY3VycmVudFN0cmVhbSA9IGdldEN1cnJlbnRTdHJlYW0oKTtcblx0aWYobG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZignL2Zhdm91cml0ZXMnKSA+PSAwKSB7XG5cdFx0dGhpcy5jbGVhcigpXG5cdH0gZWxzZSBpZih0aGlzLmN1cnJlbnRTdHJlYW0pIHtcblx0XHR0aGlzLmNsZWFyKHRoaXMuY3VycmVudFN0cmVhbSk7XG5cdH1cblxuXHR0aGlzLnBvbGwodHJ1ZSk7IC8vcGFzcyBmbGFnIHRvIGluZGljYXRlIHRoaXMgaXMgdGhlIGZpcnN0IGxvYWRcblxufVxuXG5Ob3RpZmljYXRpb25Qb2xsZXIucHJvdG90eXBlLnBvbGwgPSBmdW5jdGlvbihmaXJzdExvYWQpIHtcblx0dmFyIHBvbGxlciA9IHRoaXM7XG5cdHZhciBub3RpZmljYXRpb25Qcm9taXNlcyA9IFtdO1xuXHR2YXIgbmV3Tm90aWZpY2F0aW9ucztcblx0dGhpcy51c2VyUHJlZmVyZW5jZUxpc3QubGlzdC5nZXQoKS5mb3JFYWNoKGZ1bmN0aW9uKHN0cmVhbSkge1xuXHRcdC8vZG9uJ3QgYm90aGVyIGZldGNoaW5nIGlmIHlvdSBhcmUgb24gdGhhdCBzdHJlYW0gY3VycmVudGx5XG5cdFx0KGZ1bmN0aW9uKHN0cmVhbSkge1xuXHRcdFx0aWYoc3RyZWFtLnJlc291cmNlVHlwZSAhPT0gJ3N0cmVhbScpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0bm90aWZpY2F0aW9uUHJvbWlzZXMucHVzaChyZXF3ZXN0KHtcblx0XHRcdFx0dXJsOiBOT1RJRklDQVRJT05TX1VSTCArIHN0cmVhbS51dWlkdjMsXG5cdFx0XHRcdHR5cGU6ICdqc29uJyxcblx0XHRcdFx0bWV0aG9kOiAnZ2V0Jyxcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdCdYLUZULVVJRCc6IHBvbGxlci51c2VyUHJlZmVyZW5jZUxpc3QudXNlcklkXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNyb3NzT3JpZ2luOiB0cnVlXG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKG5vdGlmaWNhdGlvbnMpIHtcblx0XHRcdFx0aWYobm90aWZpY2F0aW9ucyAmJiBub3RpZmljYXRpb25zLmxlbmd0aCkge1xuXG5cdFx0XHRcdFx0Ly9JZiB0aGUgc3RyZWFtIGlzIGN1cnJlbnRseSBvcGVuLCBlbWl0IGFuIGV2ZW50IHdpdGggdGhlIG5vdGlmaWNhdGlvbnMsIGFuZCB0aGVuIGNsZWFyIHRoZW1cblx0XHRcdFx0XHQvLyAoYnV0IG9ubHkgZG8gdGhpcyBvbmNlKVxuXHRcdFx0XHRcdGlmKGZpcnN0TG9hZCAmJiBzdHJlYW0udXVpZHYzID09PSBwb2xsZXIuY3VycmVudFN0cmVhbSkge1xuXHRcdFx0XHRcdFx0ZW1pdCgnbm90aWZpY2F0aW9uczpvcGVuZWQnLCB7IHV1aWR2Mzogc3RyZWFtLnV1aWR2Mywgbm90aWZpY2F0aW9uczogbm90aWZpY2F0aW9ucyB9KTtcblx0XHRcdFx0XHRcdHBvbGxlci5jbGVhcihzdHJlYW0udXVpZHYzKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRuZXdOb3RpZmljYXRpb25zID0gZmlsdGVyTmV3KHBvbGxlci5ub3RpZmljYXRpb25zW3N0cmVhbS51dWlkdjNdLCBub3RpZmljYXRpb25zKTtcblxuXHRcdFx0XHRcdGlmKCFmaXJzdExvYWQgJiYgbmV3Tm90aWZpY2F0aW9ucy5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdGVtaXQoJ25vdGlmaWNhdGlvbnM6bmV3JywgeyBzdHJlYW06IHN0cmVhbSwgbm90aWZpY2F0aW9uczogbmV3Tm90aWZpY2F0aW9ucyB9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cG9sbGVyLm5vdGlmaWNhdGlvbnNbc3RyZWFtLnV1aWR2M10gPSBub3RpZmljYXRpb25zO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZGVsZXRlIHBvbGxlci5ub3RpZmljYXRpb25zW3N0cmVhbS51dWlkdjNdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHBvbGxlci5yZW5kZXIoKTtcblx0XHRcdH0pKTtcblxuXHRcdH0oc3RyZWFtKSlcblx0XHRcblx0fSk7XG5cblx0UHJvbWlzZS5hbGwobm90aWZpY2F0aW9uUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oc3RyZWFtTm90aWZpY2F0aW9ucykge1xuXHRcdGlmKHBvbGxlci5ub3RpZmljYXRpb25zKSB7XG5cdFx0XHRlbWl0KCdub3RpZmljYXRpb25zOmxvYWQnLCBwb2xsZXIubm90aWZpY2F0aW9ucyk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlck5ldyhvcmlnaW5hbExpc3QsIG5ld0xpc3QpIHtcblx0b3JpZ2luYWxMaXN0ID0gb3JpZ2luYWxMaXN0IHx8IFtdO1xuXHRuZXdMaXN0ID0gbmV3TGlzdCB8fCBbXTtcblx0dmFyIG9yaWdpbmFsSWRzID0gb3JpZ2luYWxMaXN0Lm1hcChmdW5jdGlvbihpdGVtKSB7IHJldHVybiBpdGVtLmlkOyB9KTtcblx0cmV0dXJuIG5ld0xpc3QuZmlsdGVyKGZ1bmN0aW9uKG5vdGlmKSB7IHJldHVybiAob3JpZ2luYWxJZHMuaW5kZXhPZihub3RpZi5pZCkgPCAwKTsgfSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckJhZGdlKGVsLCBudW1iZXIpIHtcblx0dmFyIGJhZGdlID0gZWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnanMtbm90aWZ5LWJhZGdlJylbMF07XG5cdGlmKCFiYWRnZSkge1xuXHRcdGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXHRcdGJhZGdlLmNsYXNzTmFtZSA9ICdub3RpZnktYmFkZ2UganMtbm90aWZ5LWJhZGdlJztcblx0XHRlbC5hcHBlbmRDaGlsZChiYWRnZSk7XG5cdH1cblx0aWYobnVtYmVyID4gMCkge1xuXHRcdGJhZGdlLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKTtcblx0XHRiYWRnZS50ZXh0Q29udGVudCA9IG51bWJlcjtcblx0fSBlbHNlIHtcblx0XHRiYWRnZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJycpO1xuXHR9XG59XG5cbk5vdGlmaWNhdGlvblBvbGxlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG5cdGZvcih2YXIgc3RyZWFtIGluIHRoaXMubm90aWZpY2F0aW9ucykge1xuXHRcdGxpbmsgPSB0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdC5jb250YWluZXIucXVlcnlTZWxlY3RvcignW2hyZWY9XCIvc2VhcmNoP3E9JyArIHN0cmVhbSArICdcIl0nKTtcblx0XHRpZihsaW5rKSB7XG5cdFx0XHRyZW5kZXJCYWRnZShsaW5rLCB0aGlzLm5vdGlmaWNhdGlvbnNbc3RyZWFtXS5sZW5ndGgpO1xuXHRcdH1cblx0fVxufTtcblxuTm90aWZpY2F0aW9uUG9sbGVyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKHV1aWQpIHtcblx0aWYodXVpZCkge1xuXHRcdHRoaXMubm90aWZpY2F0aW9uc1t1dWlkXSA9IFtdO1xuXHRcdHJlcXdlc3Qoe1xuXHRcdFx0dXJsOiBOT1RJRklDQVRJT05TX1VSTCArIHV1aWQsXG5cdFx0XHR0eXBlOiAnanNvbicsXG5cdFx0XHRtZXRob2Q6ICdkZWxldGUnLFxuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnWC1GVC1VSUQnOiB0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdC51c2VySWRcblx0XHRcdH0sXG5cdFx0XHRjcm9zc09yaWdpbjogdHJ1ZVxuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiB1dWlkID09PSAndW5kZWZpbmVkJykge1xuXHRcdHRoaXMubm90aWZpY2F0aW9ucyA9IHt9O1xuXHR9XG5cdHRoaXMucmVuZGVyKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGlmaWNhdGlvblBvbGxlcjsiLCJ2YXIgTm90aWZpY2F0aW9uUG9sbGVyID0gcmVxdWlyZSgnLi9Ob3RpZmljYXRpb25Qb2xsZXInKTtcbnZhciBNZSA9IHJlcXVpcmUoJy4vTWUnKTtcblxudmFyICQgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufTtcbnZhciBlbWl0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICBpZiAoZGF0YSkge1xuICAgIGV2ZW50LmRldGFpbCA9IGRhdGE7XG4gIH1cbiAgdG9wLmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxudmFyIGdldFVzZXJJZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmFsdWUgPSBcIjsgXCIgKyBkb2N1bWVudC5jb29raWU7XG4gIHZhciBwYXJ0cyA9IHZhbHVlLnNwbGl0KFwiOyBGVF9VPVwiKTtcbiAgdmFyIGZ0VSA9IHBhcnRzLnBvcCgpLnNwbGl0KFwiO1wiKS5zaGlmdCgpO1xuICBpZihmdFUpIHtcbiAgICByZXR1cm4gZnRVLm1hdGNoKC9fRUlEPShcXGQrKV9QSUQvKVsxXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm47XG4gIH1cbn07XG5cbnZhciBVc2VyUHJlZmVyZW5jZUxpc3QgPSBmdW5jdGlvbihjb250YWluZXIsIG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnVzZXJJZCA9IGdldFVzZXJJZCgpO1xuICB0aGlzLmtleSA9IGNvbnRhaW5lci5nZXRBdHRyaWJ1dGUoJ2RhdGEtdXNlci1wcmVmZXJlbmNlLWxpc3QnKTtcbiAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gIHRoaXMubm90aWZ5ID0gb3B0cy5ub3RpZnk7XG5cbn07XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmKCF0aGlzLnVzZXJJZCkge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMua2V5ICsgJzphZGQnLCBmdW5jdGlvbihldikge1xuICAgIHNlbGYuYWRkKGV2LmRldGFpbCk7XG4gIH0pO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMua2V5ICsgJzpyZW1vdmUnLCBmdW5jdGlvbihldikge1xuICAgIHNlbGYucmVtb3ZlKGV2LmRldGFpbCk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5rZXkgKyAnOmNsZWFyJywgdGhpcy5jbGVhci5iaW5kKHRoaXMpKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmtleSArICc6dXBkYXRlJywgdGhpcy5yZW5kZXIuYmluZCh0aGlzKSk7XG5cbiAgJCgnW2RhdGEtbGlzdC1zb3VyY2U9XCInICsgdGhpcy5rZXkgKyAnXCJdIC5jbGVhcl9fYnV0dG9uJykubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5jbGVhci5iaW5kKHNlbGYpKTtcbiAgfSk7XG5cbiAgdGhpcy5saXN0ID0gbmV3IE1lKHRoaXMua2V5LCB0aGlzLnVzZXJJZCk7XG5cbiAgaWYodGhpcy5ub3RpZnkgPT09IHRydWUpIHtcbiAgICB0aGlzLm5vdGlmaWVyID0gbmV3IE5vdGlmaWNhdGlvblBvbGxlcih0aGlzKTtcbiAgfVxufVxuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB2YXIgaHJlZiA9ICcnO1xuXG4gIHZhciBsaW5rcyA9IHRoaXMubGlzdCA/IHRoaXMubGlzdC5nZXRPckNyZWF0ZSgpLnJldmVyc2UoKSA6IFtdO1xuXG4gIHZhciBsaW5rc0hUTUwgPSBsaW5rcy5tYXAoZnVuY3Rpb24gKHNlY3Rpb24pIHtcbiAgICBocmVmID0gc2VjdGlvbi5yZXNvdXJjZVR5cGUgPT09ICdzdHJlYW0nID8gJy9zZWFyY2g/cT0nICsgc2VjdGlvbi51dWlkdjMgOiAnLycgKyBzZWN0aW9uLnV1aWR2MztcbiAgICByZXR1cm4gJzxsaSBjbGFzcz1cIml0ZW0tdHlwZS0tJyArIHNlY3Rpb24ucmVzb3VyY2VUeXBlICsgJ1wiPjxhIGhyZWY9XCInICsgaHJlZiArICdcIj4nICsgc2VjdGlvbi5kaXNwbGF5VGV4dCArICc8L2E+PC9saT4nO1xuICB9KS5qb2luKCcnKTtcbiAgXG4gIGlmKHRoaXMuY29udGFpbmVyKSB7XG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gIGxpbmtzSFRNTDtcbiAgfVxuICBpZih0aGlzLm5vdGlmaWVyKSB7XG4gICAgdGhpcy5ub3RpZmllci5yZW5kZXIoKTtcbiAgfVxufTtcblxuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG9iaikge1xuICB0aGlzLmxpc3QuYWRkKG9iaik7XG59O1xuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKG9iaikge1xuICB0aGlzLmxpc3QucmVtb3ZlKG9iaik7XG59O1xuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubGlzdC5jbGVhcigpO1xufTtcblxuVXNlclByZWZlcmVuY2VMaXN0LmluaXQgPSBmdW5jdGlvbihyb290RWwsIG9wdHMpIHtcbiAgdmFyIGNvbXBvbmVudHMgPSB7fSwgXG4gICAgICBmRWxzLCBcbiAgICAgIGMsIGwsIFxuICAgICAgY29tcG9uZW50O1xuXG4gIHJvb3RFbCA9IHJvb3RFbCB8fCBkb2N1bWVudC5ib2R5O1xuICAvL3NldCBjb25maWcgd2l0aCBvdmVycmlkZXMgcGFzc2VkIHRocm91Z2hcblxuICBpZiAocm9vdEVsLnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICBmRWxzID0gcm9vdEVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXVzZXItcHJlZmVyZW5jZS1saXN0XScpO1xuICAgIGZvciAoYyA9IDAsIGwgPSBmRWxzLmxlbmd0aDsgYyA8IGw7IGMrKykge1xuICAgICAgaWYgKCFmRWxzW2NdLmhhc0F0dHJpYnV0ZSgnZGF0YS1vLWF1dGhvci1hbGVydHMtLWpzJykpIHtcbiAgICAgICAgY29tcG9uZW50ID0gbmV3IFVzZXJQcmVmZXJlbmNlTGlzdChmRWxzW2NdLCBvcHRzIHx8IHt9KTtcbiAgICAgICAgY29tcG9uZW50LmluaXQob3B0cyk7XG4gICAgICAgIGNvbXBvbmVudHNbZkVsc1tjXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdXNlci1wcmVmZXJlbmNlLWxpc3QnKV0gPSBjb21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbXBvbmVudHM7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVXNlclByZWZlcmVuY2VMaXN0O1xuIiwidmFyIFVzZXJQcmVmZXJlbmNlTGlzdCA9IHJlcXVpcmUoJy4vbGliL1VzZXJQcmVmZXJlbmNlTGlzdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVzZXJQcmVmZXJlbmNlTGlzdDsiLCIvKiFcbiAgKiBSZXF3ZXN0ISBBIGdlbmVyYWwgcHVycG9zZSBYSFIgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICogbGljZW5zZSBNSVQgKGMpIER1c3RpbiBEaWF6IDIwMTRcbiAgKiBodHRwczovL2dpdGh1Yi5jb20vZGVkL3JlcXdlc3RcbiAgKi9cbiFmdW5jdGlvbihlLHQsbil7dHlwZW9mIG1vZHVsZSE9XCJ1bmRlZmluZWRcIiYmbW9kdWxlLmV4cG9ydHM/bW9kdWxlLmV4cG9ydHM9bigpOnR5cGVvZiBkZWZpbmU9PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZD9kZWZpbmUobik6dFtlXT1uKCl9KFwicmVxd2VzdFwiLHRoaXMsZnVuY3Rpb24oKXtmdW5jdGlvbiBzdWNjZWVkKGUpe3JldHVybiBodHRwc1JlLnRlc3Qod2luZG93LmxvY2F0aW9uLnByb3RvY29sKT90d29IdW5kby50ZXN0KGUuc3RhdHVzKTohIWUucmVzcG9uc2V9ZnVuY3Rpb24gaGFuZGxlUmVhZHlTdGF0ZShlLHQsbil7cmV0dXJuIGZ1bmN0aW9uKCl7aWYoZS5fYWJvcnRlZClyZXR1cm4gbihlLnJlcXVlc3QpO2UucmVxdWVzdCYmZS5yZXF1ZXN0W3JlYWR5U3RhdGVdPT00JiYoZS5yZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZT1ub29wLHN1Y2NlZWQoZS5yZXF1ZXN0KT90KGUucmVxdWVzdCk6bihlLnJlcXVlc3QpKX19ZnVuY3Rpb24gc2V0SGVhZGVycyhlLHQpe3ZhciBuPXQuaGVhZGVyc3x8e30scjtuLkFjY2VwdD1uLkFjY2VwdHx8ZGVmYXVsdEhlYWRlcnMuYWNjZXB0W3QudHlwZV18fGRlZmF1bHRIZWFkZXJzLmFjY2VwdFtcIipcIl07dmFyIGk9dHlwZW9mIEZvcm1EYXRhPT1cImZ1bmN0aW9uXCImJnQuZGF0YSBpbnN0YW5jZW9mIEZvcm1EYXRhOyF0LmNyb3NzT3JpZ2luJiYhbltyZXF1ZXN0ZWRXaXRoXSYmKG5bcmVxdWVzdGVkV2l0aF09ZGVmYXVsdEhlYWRlcnMucmVxdWVzdGVkV2l0aCksIW5bY29udGVudFR5cGVdJiYhaSYmKG5bY29udGVudFR5cGVdPXQuY29udGVudFR5cGV8fGRlZmF1bHRIZWFkZXJzLmNvbnRlbnRUeXBlKTtmb3IociBpbiBuKW4uaGFzT3duUHJvcGVydHkocikmJlwic2V0UmVxdWVzdEhlYWRlclwiaW4gZSYmZS5zZXRSZXF1ZXN0SGVhZGVyKHIsbltyXSl9ZnVuY3Rpb24gc2V0Q3JlZGVudGlhbHMoZSx0KXt0eXBlb2YgdC53aXRoQ3JlZGVudGlhbHMhPVwidW5kZWZpbmVkXCImJnR5cGVvZiBlLndpdGhDcmVkZW50aWFscyE9XCJ1bmRlZmluZWRcIiYmKGUud2l0aENyZWRlbnRpYWxzPSEhdC53aXRoQ3JlZGVudGlhbHMpfWZ1bmN0aW9uIGdlbmVyYWxDYWxsYmFjayhlKXtsYXN0VmFsdWU9ZX1mdW5jdGlvbiB1cmxhcHBlbmQoZSx0KXtyZXR1cm4gZSsoL1xcPy8udGVzdChlKT9cIiZcIjpcIj9cIikrdH1mdW5jdGlvbiBoYW5kbGVKc29ucChlLHQsbixyKXt2YXIgaT11bmlxaWQrKyxzPWUuanNvbnBDYWxsYmFja3x8XCJjYWxsYmFja1wiLG89ZS5qc29ucENhbGxiYWNrTmFtZXx8cmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeChpKSx1PW5ldyBSZWdFeHAoXCIoKF58XFxcXD98JilcIitzK1wiKT0oW14mXSspXCIpLGE9ci5tYXRjaCh1KSxmPWRvYy5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpLGw9MCxjPW5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1TSUUgMTAuMFwiKSE9PS0xO3JldHVybiBhP2FbM109PT1cIj9cIj9yPXIucmVwbGFjZSh1LFwiJDE9XCIrbyk6bz1hWzNdOnI9dXJsYXBwZW5kKHIscytcIj1cIitvKSx3aW5bb109Z2VuZXJhbENhbGxiYWNrLGYudHlwZT1cInRleHQvamF2YXNjcmlwdFwiLGYuc3JjPXIsZi5hc3luYz0hMCx0eXBlb2YgZi5vbnJlYWR5c3RhdGVjaGFuZ2UhPVwidW5kZWZpbmVkXCImJiFjJiYoZi5odG1sRm9yPWYuaWQ9XCJfcmVxd2VzdF9cIitpKSxmLm9ubG9hZD1mLm9ucmVhZHlzdGF0ZWNoYW5nZT1mdW5jdGlvbigpe2lmKGZbcmVhZHlTdGF0ZV0mJmZbcmVhZHlTdGF0ZV0hPT1cImNvbXBsZXRlXCImJmZbcmVhZHlTdGF0ZV0hPT1cImxvYWRlZFwifHxsKXJldHVybiExO2Yub25sb2FkPWYub25yZWFkeXN0YXRlY2hhbmdlPW51bGwsZi5vbmNsaWNrJiZmLm9uY2xpY2soKSx0KGxhc3RWYWx1ZSksbGFzdFZhbHVlPXVuZGVmaW5lZCxoZWFkLnJlbW92ZUNoaWxkKGYpLGw9MX0saGVhZC5hcHBlbmRDaGlsZChmKSx7YWJvcnQ6ZnVuY3Rpb24oKXtmLm9ubG9hZD1mLm9ucmVhZHlzdGF0ZWNoYW5nZT1udWxsLG4oe30sXCJSZXF1ZXN0IGlzIGFib3J0ZWQ6IHRpbWVvdXRcIix7fSksbGFzdFZhbHVlPXVuZGVmaW5lZCxoZWFkLnJlbW92ZUNoaWxkKGYpLGw9MX19fWZ1bmN0aW9uIGdldFJlcXVlc3QoZSx0KXt2YXIgbj10aGlzLm8scj0obi5tZXRob2R8fFwiR0VUXCIpLnRvVXBwZXJDYXNlKCksaT10eXBlb2Ygbj09XCJzdHJpbmdcIj9uOm4udXJsLHM9bi5wcm9jZXNzRGF0YSE9PSExJiZuLmRhdGEmJnR5cGVvZiBuLmRhdGEhPVwic3RyaW5nXCI/cmVxd2VzdC50b1F1ZXJ5U3RyaW5nKG4uZGF0YSk6bi5kYXRhfHxudWxsLG8sdT0hMTtyZXR1cm4obltcInR5cGVcIl09PVwianNvbnBcInx8cj09XCJHRVRcIikmJnMmJihpPXVybGFwcGVuZChpLHMpLHM9bnVsbCksbltcInR5cGVcIl09PVwianNvbnBcIj9oYW5kbGVKc29ucChuLGUsdCxpKToobz1uLnhociYmbi54aHIobil8fHhocihuKSxvLm9wZW4ocixpLG4uYXN5bmM9PT0hMT8hMTohMCksc2V0SGVhZGVycyhvLG4pLHNldENyZWRlbnRpYWxzKG8sbiksd2luW3hEb21haW5SZXF1ZXN0XSYmbyBpbnN0YW5jZW9mIHdpblt4RG9tYWluUmVxdWVzdF0/KG8ub25sb2FkPWUsby5vbmVycm9yPXQsby5vbnByb2dyZXNzPWZ1bmN0aW9uKCl7fSx1PSEwKTpvLm9ucmVhZHlzdGF0ZWNoYW5nZT1oYW5kbGVSZWFkeVN0YXRlKHRoaXMsZSx0KSxuLmJlZm9yZSYmbi5iZWZvcmUobyksdT9zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7by5zZW5kKHMpfSwyMDApOm8uc2VuZChzKSxvKX1mdW5jdGlvbiBSZXF3ZXN0KGUsdCl7dGhpcy5vPWUsdGhpcy5mbj10LGluaXQuYXBwbHkodGhpcyxhcmd1bWVudHMpfWZ1bmN0aW9uIHNldFR5cGUoZSl7aWYoZS5tYXRjaChcImpzb25cIikpcmV0dXJuXCJqc29uXCI7aWYoZS5tYXRjaChcImphdmFzY3JpcHRcIikpcmV0dXJuXCJqc1wiO2lmKGUubWF0Y2goXCJ0ZXh0XCIpKXJldHVyblwiaHRtbFwiO2lmKGUubWF0Y2goXCJ4bWxcIikpcmV0dXJuXCJ4bWxcIn1mdW5jdGlvbiBpbml0KG8sZm4pe2Z1bmN0aW9uIGNvbXBsZXRlKGUpe28udGltZW91dCYmY2xlYXJUaW1lb3V0KHNlbGYudGltZW91dCksc2VsZi50aW1lb3V0PW51bGw7d2hpbGUoc2VsZi5fY29tcGxldGVIYW5kbGVycy5sZW5ndGg+MClzZWxmLl9jb21wbGV0ZUhhbmRsZXJzLnNoaWZ0KCkoZSl9ZnVuY3Rpb24gc3VjY2VzcyhyZXNwKXt2YXIgdHlwZT1vLnR5cGV8fHNldFR5cGUocmVzcC5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtVHlwZVwiKSk7cmVzcD10eXBlIT09XCJqc29ucFwiP3NlbGYucmVxdWVzdDpyZXNwO3ZhciBmaWx0ZXJlZFJlc3BvbnNlPWdsb2JhbFNldHVwT3B0aW9ucy5kYXRhRmlsdGVyKHJlc3AucmVzcG9uc2VUZXh0LHR5cGUpLHI9ZmlsdGVyZWRSZXNwb25zZTt0cnl7cmVzcC5yZXNwb25zZVRleHQ9cn1jYXRjaChlKXt9aWYocilzd2l0Y2godHlwZSl7Y2FzZVwianNvblwiOnRyeXtyZXNwPXdpbi5KU09OP3dpbi5KU09OLnBhcnNlKHIpOmV2YWwoXCIoXCIrcitcIilcIil9Y2F0Y2goZXJyKXtyZXR1cm4gZXJyb3IocmVzcCxcIkNvdWxkIG5vdCBwYXJzZSBKU09OIGluIHJlc3BvbnNlXCIsZXJyKX1icmVhaztjYXNlXCJqc1wiOnJlc3A9ZXZhbChyKTticmVhaztjYXNlXCJodG1sXCI6cmVzcD1yO2JyZWFrO2Nhc2VcInhtbFwiOnJlc3A9cmVzcC5yZXNwb25zZVhNTCYmcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yJiZyZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IuZXJyb3JDb2RlJiZyZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IucmVhc29uP251bGw6cmVzcC5yZXNwb25zZVhNTH1zZWxmLl9yZXNwb25zZUFyZ3MucmVzcD1yZXNwLHNlbGYuX2Z1bGZpbGxlZD0hMCxmbihyZXNwKSxzZWxmLl9zdWNjZXNzSGFuZGxlcihyZXNwKTt3aGlsZShzZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLmxlbmd0aD4wKXJlc3A9c2VsZi5fZnVsZmlsbG1lbnRIYW5kbGVycy5zaGlmdCgpKHJlc3ApO2NvbXBsZXRlKHJlc3ApfWZ1bmN0aW9uIGVycm9yKGUsdCxuKXtlPXNlbGYucmVxdWVzdCxzZWxmLl9yZXNwb25zZUFyZ3MucmVzcD1lLHNlbGYuX3Jlc3BvbnNlQXJncy5tc2c9dCxzZWxmLl9yZXNwb25zZUFyZ3MudD1uLHNlbGYuX2VycmVkPSEwO3doaWxlKHNlbGYuX2Vycm9ySGFuZGxlcnMubGVuZ3RoPjApc2VsZi5fZXJyb3JIYW5kbGVycy5zaGlmdCgpKGUsdCxuKTtjb21wbGV0ZShlKX10aGlzLnVybD10eXBlb2Ygbz09XCJzdHJpbmdcIj9vOm8udXJsLHRoaXMudGltZW91dD1udWxsLHRoaXMuX2Z1bGZpbGxlZD0hMSx0aGlzLl9zdWNjZXNzSGFuZGxlcj1mdW5jdGlvbigpe30sdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycz1bXSx0aGlzLl9lcnJvckhhbmRsZXJzPVtdLHRoaXMuX2NvbXBsZXRlSGFuZGxlcnM9W10sdGhpcy5fZXJyZWQ9ITEsdGhpcy5fcmVzcG9uc2VBcmdzPXt9O3ZhciBzZWxmPXRoaXM7Zm49Zm58fGZ1bmN0aW9uKCl7fSxvLnRpbWVvdXQmJih0aGlzLnRpbWVvdXQ9c2V0VGltZW91dChmdW5jdGlvbigpe3NlbGYuYWJvcnQoKX0sby50aW1lb3V0KSksby5zdWNjZXNzJiYodGhpcy5fc3VjY2Vzc0hhbmRsZXI9ZnVuY3Rpb24oKXtvLnN1Y2Nlc3MuYXBwbHkobyxhcmd1bWVudHMpfSksby5lcnJvciYmdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGZ1bmN0aW9uKCl7by5lcnJvci5hcHBseShvLGFyZ3VtZW50cyl9KSxvLmNvbXBsZXRlJiZ0aGlzLl9jb21wbGV0ZUhhbmRsZXJzLnB1c2goZnVuY3Rpb24oKXtvLmNvbXBsZXRlLmFwcGx5KG8sYXJndW1lbnRzKX0pLHRoaXMucmVxdWVzdD1nZXRSZXF1ZXN0LmNhbGwodGhpcyxzdWNjZXNzLGVycm9yKX1mdW5jdGlvbiByZXF3ZXN0KGUsdCl7cmV0dXJuIG5ldyBSZXF3ZXN0KGUsdCl9ZnVuY3Rpb24gbm9ybWFsaXplKGUpe3JldHVybiBlP2UucmVwbGFjZSgvXFxyP1xcbi9nLFwiXFxyXFxuXCIpOlwiXCJ9ZnVuY3Rpb24gc2VyaWFsKGUsdCl7dmFyIG49ZS5uYW1lLHI9ZS50YWdOYW1lLnRvTG93ZXJDYXNlKCksaT1mdW5jdGlvbihlKXtlJiYhZS5kaXNhYmxlZCYmdChuLG5vcm1hbGl6ZShlLmF0dHJpYnV0ZXMudmFsdWUmJmUuYXR0cmlidXRlcy52YWx1ZS5zcGVjaWZpZWQ/ZS52YWx1ZTplLnRleHQpKX0scyxvLHUsYTtpZihlLmRpc2FibGVkfHwhbilyZXR1cm47c3dpdGNoKHIpe2Nhc2VcImlucHV0XCI6L3Jlc2V0fGJ1dHRvbnxpbWFnZXxmaWxlL2kudGVzdChlLnR5cGUpfHwocz0vY2hlY2tib3gvaS50ZXN0KGUudHlwZSksbz0vcmFkaW8vaS50ZXN0KGUudHlwZSksdT1lLnZhbHVlLCghcyYmIW98fGUuY2hlY2tlZCkmJnQobixub3JtYWxpemUocyYmdT09PVwiXCI/XCJvblwiOnUpKSk7YnJlYWs7Y2FzZVwidGV4dGFyZWFcIjp0KG4sbm9ybWFsaXplKGUudmFsdWUpKTticmVhaztjYXNlXCJzZWxlY3RcIjppZihlLnR5cGUudG9Mb3dlckNhc2UoKT09PVwic2VsZWN0LW9uZVwiKWkoZS5zZWxlY3RlZEluZGV4Pj0wP2Uub3B0aW9uc1tlLnNlbGVjdGVkSW5kZXhdOm51bGwpO2Vsc2UgZm9yKGE9MDtlLmxlbmd0aCYmYTxlLmxlbmd0aDthKyspZS5vcHRpb25zW2FdLnNlbGVjdGVkJiZpKGUub3B0aW9uc1thXSl9fWZ1bmN0aW9uIGVhY2hGb3JtRWxlbWVudCgpe3ZhciBlPXRoaXMsdCxuLHI9ZnVuY3Rpb24odCxuKXt2YXIgcixpLHM7Zm9yKHI9MDtyPG4ubGVuZ3RoO3IrKyl7cz10W2J5VGFnXShuW3JdKTtmb3IoaT0wO2k8cy5sZW5ndGg7aSsrKXNlcmlhbChzW2ldLGUpfX07Zm9yKG49MDtuPGFyZ3VtZW50cy5sZW5ndGg7bisrKXQ9YXJndW1lbnRzW25dLC9pbnB1dHxzZWxlY3R8dGV4dGFyZWEvaS50ZXN0KHQudGFnTmFtZSkmJnNlcmlhbCh0LGUpLHIodCxbXCJpbnB1dFwiLFwic2VsZWN0XCIsXCJ0ZXh0YXJlYVwiXSl9ZnVuY3Rpb24gc2VyaWFsaXplUXVlcnlTdHJpbmcoKXtyZXR1cm4gcmVxd2VzdC50b1F1ZXJ5U3RyaW5nKHJlcXdlc3Quc2VyaWFsaXplQXJyYXkuYXBwbHkobnVsbCxhcmd1bWVudHMpKX1mdW5jdGlvbiBzZXJpYWxpemVIYXNoKCl7dmFyIGU9e307cmV0dXJuIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbih0LG4pe3QgaW4gZT8oZVt0XSYmIWlzQXJyYXkoZVt0XSkmJihlW3RdPVtlW3RdXSksZVt0XS5wdXNoKG4pKTplW3RdPW59LGFyZ3VtZW50cyksZX1mdW5jdGlvbiBidWlsZFBhcmFtcyhlLHQsbixyKXt2YXIgaSxzLG8sdT0vXFxbXFxdJC87aWYoaXNBcnJheSh0KSlmb3Iocz0wO3QmJnM8dC5sZW5ndGg7cysrKW89dFtzXSxufHx1LnRlc3QoZSk/cihlLG8pOmJ1aWxkUGFyYW1zKGUrXCJbXCIrKHR5cGVvZiBvPT1cIm9iamVjdFwiP3M6XCJcIikrXCJdXCIsbyxuLHIpO2Vsc2UgaWYodCYmdC50b1N0cmluZygpPT09XCJbb2JqZWN0IE9iamVjdF1cIilmb3IoaSBpbiB0KWJ1aWxkUGFyYW1zKGUrXCJbXCIraStcIl1cIix0W2ldLG4scik7ZWxzZSByKGUsdCl9dmFyIHdpbj13aW5kb3csZG9jPWRvY3VtZW50LGh0dHBzUmU9L15odHRwLyx0d29IdW5kbz0vXigyMFxcZHwxMjIzKSQvLGJ5VGFnPVwiZ2V0RWxlbWVudHNCeVRhZ05hbWVcIixyZWFkeVN0YXRlPVwicmVhZHlTdGF0ZVwiLGNvbnRlbnRUeXBlPVwiQ29udGVudC1UeXBlXCIscmVxdWVzdGVkV2l0aD1cIlgtUmVxdWVzdGVkLVdpdGhcIixoZWFkPWRvY1tieVRhZ10oXCJoZWFkXCIpWzBdLHVuaXFpZD0wLGNhbGxiYWNrUHJlZml4PVwicmVxd2VzdF9cIisgKyhuZXcgRGF0ZSksbGFzdFZhbHVlLHhtbEh0dHBSZXF1ZXN0PVwiWE1MSHR0cFJlcXVlc3RcIix4RG9tYWluUmVxdWVzdD1cIlhEb21haW5SZXF1ZXN0XCIsbm9vcD1mdW5jdGlvbigpe30saXNBcnJheT10eXBlb2YgQXJyYXkuaXNBcnJheT09XCJmdW5jdGlvblwiP0FycmF5LmlzQXJyYXk6ZnVuY3Rpb24oZSl7cmV0dXJuIGUgaW5zdGFuY2VvZiBBcnJheX0sZGVmYXVsdEhlYWRlcnM9e2NvbnRlbnRUeXBlOlwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCIscmVxdWVzdGVkV2l0aDp4bWxIdHRwUmVxdWVzdCxhY2NlcHQ6e1wiKlwiOlwidGV4dC9qYXZhc2NyaXB0LCB0ZXh0L2h0bWwsIGFwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwsICovKlwiLHhtbDpcImFwcGxpY2F0aW9uL3htbCwgdGV4dC94bWxcIixodG1sOlwidGV4dC9odG1sXCIsdGV4dDpcInRleHQvcGxhaW5cIixqc29uOlwiYXBwbGljYXRpb24vanNvbiwgdGV4dC9qYXZhc2NyaXB0XCIsanM6XCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0LCB0ZXh0L2phdmFzY3JpcHRcIn19LHhocj1mdW5jdGlvbihlKXtpZihlLmNyb3NzT3JpZ2luPT09ITApe3ZhciB0PXdpblt4bWxIdHRwUmVxdWVzdF0/bmV3IFhNTEh0dHBSZXF1ZXN0Om51bGw7aWYodCYmXCJ3aXRoQ3JlZGVudGlhbHNcImluIHQpcmV0dXJuIHQ7aWYod2luW3hEb21haW5SZXF1ZXN0XSlyZXR1cm4gbmV3IFhEb21haW5SZXF1ZXN0O3Rocm93IG5ldyBFcnJvcihcIkJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBjcm9zcy1vcmlnaW4gcmVxdWVzdHNcIil9cmV0dXJuIHdpblt4bWxIdHRwUmVxdWVzdF0/bmV3IFhNTEh0dHBSZXF1ZXN0Om5ldyBBY3RpdmVYT2JqZWN0KFwiTWljcm9zb2Z0LlhNTEhUVFBcIil9LGdsb2JhbFNldHVwT3B0aW9ucz17ZGF0YUZpbHRlcjpmdW5jdGlvbihlKXtyZXR1cm4gZX19O3JldHVybiBSZXF3ZXN0LnByb3RvdHlwZT17YWJvcnQ6ZnVuY3Rpb24oKXt0aGlzLl9hYm9ydGVkPSEwLHRoaXMucmVxdWVzdC5hYm9ydCgpfSxyZXRyeTpmdW5jdGlvbigpe2luaXQuY2FsbCh0aGlzLHRoaXMubyx0aGlzLmZuKX0sdGhlbjpmdW5jdGlvbihlLHQpe3JldHVybiBlPWV8fGZ1bmN0aW9uKCl7fSx0PXR8fGZ1bmN0aW9uKCl7fSx0aGlzLl9mdWxmaWxsZWQ/dGhpcy5fcmVzcG9uc2VBcmdzLnJlc3A9ZSh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCk6dGhpcy5fZXJyZWQ/dCh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCx0aGlzLl9yZXNwb25zZUFyZ3MubXNnLHRoaXMuX3Jlc3BvbnNlQXJncy50KToodGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycy5wdXNoKGUpLHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaCh0KSksdGhpc30sYWx3YXlzOmZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLl9mdWxmaWxsZWR8fHRoaXMuX2VycmVkP2UodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3ApOnRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChlKSx0aGlzfSxmYWlsOmZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLl9lcnJlZD9lKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwLHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csdGhpcy5fcmVzcG9uc2VBcmdzLnQpOnRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChlKSx0aGlzfSxcImNhdGNoXCI6ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuZmFpbChlKX19LHJlcXdlc3Quc2VyaWFsaXplQXJyYXk9ZnVuY3Rpb24oKXt2YXIgZT1bXTtyZXR1cm4gZWFjaEZvcm1FbGVtZW50LmFwcGx5KGZ1bmN0aW9uKHQsbil7ZS5wdXNoKHtuYW1lOnQsdmFsdWU6bn0pfSxhcmd1bWVudHMpLGV9LHJlcXdlc3Quc2VyaWFsaXplPWZ1bmN0aW9uKCl7aWYoYXJndW1lbnRzLmxlbmd0aD09PTApcmV0dXJuXCJcIjt2YXIgZSx0LG49QXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLDApO3JldHVybiBlPW4ucG9wKCksZSYmZS5ub2RlVHlwZSYmbi5wdXNoKGUpJiYoZT1udWxsKSxlJiYoZT1lLnR5cGUpLGU9PVwibWFwXCI/dD1zZXJpYWxpemVIYXNoOmU9PVwiYXJyYXlcIj90PXJlcXdlc3Quc2VyaWFsaXplQXJyYXk6dD1zZXJpYWxpemVRdWVyeVN0cmluZyx0LmFwcGx5KG51bGwsbil9LHJlcXdlc3QudG9RdWVyeVN0cmluZz1mdW5jdGlvbihlLHQpe3ZhciBuLHIsaT10fHwhMSxzPVtdLG89ZW5jb2RlVVJJQ29tcG9uZW50LHU9ZnVuY3Rpb24oZSx0KXt0PVwiZnVuY3Rpb25cIj09dHlwZW9mIHQ/dCgpOnQ9PW51bGw/XCJcIjp0LHNbcy5sZW5ndGhdPW8oZSkrXCI9XCIrbyh0KX07aWYoaXNBcnJheShlKSlmb3Iocj0wO2UmJnI8ZS5sZW5ndGg7cisrKXUoZVtyXS5uYW1lLGVbcl0udmFsdWUpO2Vsc2UgZm9yKG4gaW4gZSllLmhhc093blByb3BlcnR5KG4pJiZidWlsZFBhcmFtcyhuLGVbbl0saSx1KTtyZXR1cm4gcy5qb2luKFwiJlwiKS5yZXBsYWNlKC8lMjAvZyxcIitcIil9LHJlcXdlc3QuZ2V0Y2FsbGJhY2tQcmVmaXg9ZnVuY3Rpb24oKXtyZXR1cm4gY2FsbGJhY2tQcmVmaXh9LHJlcXdlc3QuY29tcGF0PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGUmJihlLnR5cGUmJihlLm1ldGhvZD1lLnR5cGUpJiZkZWxldGUgZS50eXBlLGUuZGF0YVR5cGUmJihlLnR5cGU9ZS5kYXRhVHlwZSksZS5qc29ucENhbGxiYWNrJiYoZS5qc29ucENhbGxiYWNrTmFtZT1lLmpzb25wQ2FsbGJhY2spJiZkZWxldGUgZS5qc29ucENhbGxiYWNrLGUuanNvbnAmJihlLmpzb25wQ2FsbGJhY2s9ZS5qc29ucCkpLG5ldyBSZXF3ZXN0KGUsdCl9LHJlcXdlc3QuYWpheFNldHVwPWZ1bmN0aW9uKGUpe2U9ZXx8e307Zm9yKHZhciB0IGluIGUpZ2xvYmFsU2V0dXBPcHRpb25zW3RdPWVbdF19LHJlcXdlc3R9KSIsIi8qISBSYXZlbi5qcyAxLjEuMTYgKDQ2M2Y2OGYpIHwgZ2l0aHViLmNvbS9nZXRzZW50cnkvcmF2ZW4tanMgKi9cblxuLypcbiAqIEluY2x1ZGVzIFRyYWNlS2l0XG4gKiBodHRwczovL2dpdGh1Yi5jb20vZ2V0c2VudHJ5L1RyYWNlS2l0XG4gKlxuICogQ29weXJpZ2h0IDIwMTQgTWF0dCBSb2Jlbm9sdCBhbmQgb3RoZXIgY29udHJpYnV0b3JzXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgQlNEIGxpY2Vuc2VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nZXRzZW50cnkvcmF2ZW4tanMvYmxvYi9tYXN0ZXIvTElDRU5TRVxuICpcbiAqL1xuOyhmdW5jdGlvbih3aW5kb3csIHVuZGVmaW5lZCl7XG4ndXNlIHN0cmljdCc7XG5cbi8qXG4gVHJhY2VLaXQgLSBDcm9zcyBicm93ZXIgc3RhY2sgdHJhY2VzIC0gZ2l0aHViLmNvbS9vY2MvVHJhY2VLaXRcbiBNSVQgbGljZW5zZVxuKi9cblxudmFyIFRyYWNlS2l0ID0ge1xuICAgIHJlbW90ZUZldGNoaW5nOiBmYWxzZSxcbiAgICBjb2xsZWN0V2luZG93RXJyb3JzOiB0cnVlLFxuICAgIC8vIDMgbGluZXMgYmVmb3JlLCB0aGUgb2ZmZW5kaW5nIGxpbmUsIDMgbGluZXMgYWZ0ZXJcbiAgICBsaW5lc09mQ29udGV4dDogN1xufTtcblxuLy8gZ2xvYmFsIHJlZmVyZW5jZSB0byBzbGljZVxudmFyIF9zbGljZSA9IFtdLnNsaWNlO1xudmFyIFVOS05PV05fRlVOQ1RJT04gPSAnPyc7XG5cblxuLyoqXG4gKiBUcmFjZUtpdC53cmFwOiBXcmFwIGFueSBmdW5jdGlvbiBpbiBhIFRyYWNlS2l0IHJlcG9ydGVyXG4gKiBFeGFtcGxlOiBmdW5jID0gVHJhY2VLaXQud3JhcChmdW5jKTtcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIEZ1bmN0aW9uIHRvIGJlIHdyYXBwZWRcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgd3JhcHBlZCBmdW5jXG4gKi9cblRyYWNlS2l0LndyYXAgPSBmdW5jdGlvbiB0cmFjZUtpdFdyYXBwZXIoZnVuYykge1xuICAgIGZ1bmN0aW9uIHdyYXBwZWQoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBUcmFjZUtpdC5yZXBvcnQoZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB3cmFwcGVkO1xufTtcblxuLyoqXG4gKiBUcmFjZUtpdC5yZXBvcnQ6IGNyb3NzLWJyb3dzZXIgcHJvY2Vzc2luZyBvZiB1bmhhbmRsZWQgZXhjZXB0aW9uc1xuICpcbiAqIFN5bnRheDpcbiAqICAgVHJhY2VLaXQucmVwb3J0LnN1YnNjcmliZShmdW5jdGlvbihzdGFja0luZm8pIHsgLi4uIH0pXG4gKiAgIFRyYWNlS2l0LnJlcG9ydC51bnN1YnNjcmliZShmdW5jdGlvbihzdGFja0luZm8pIHsgLi4uIH0pXG4gKiAgIFRyYWNlS2l0LnJlcG9ydChleGNlcHRpb24pXG4gKiAgIHRyeSB7IC4uLmNvZGUuLi4gfSBjYXRjaChleCkgeyBUcmFjZUtpdC5yZXBvcnQoZXgpOyB9XG4gKlxuICogU3VwcG9ydHM6XG4gKiAgIC0gRmlyZWZveDogZnVsbCBzdGFjayB0cmFjZSB3aXRoIGxpbmUgbnVtYmVycywgcGx1cyBjb2x1bW4gbnVtYmVyXG4gKiAgICAgICAgICAgICAgb24gdG9wIGZyYW1lOyBjb2x1bW4gbnVtYmVyIGlzIG5vdCBndWFyYW50ZWVkXG4gKiAgIC0gT3BlcmE6ICAgZnVsbCBzdGFjayB0cmFjZSB3aXRoIGxpbmUgYW5kIGNvbHVtbiBudW1iZXJzXG4gKiAgIC0gQ2hyb21lOiAgZnVsbCBzdGFjayB0cmFjZSB3aXRoIGxpbmUgYW5kIGNvbHVtbiBudW1iZXJzXG4gKiAgIC0gU2FmYXJpOiAgbGluZSBhbmQgY29sdW1uIG51bWJlciBmb3IgdGhlIHRvcCBmcmFtZSBvbmx5OyBzb21lIGZyYW1lc1xuICogICAgICAgICAgICAgIG1heSBiZSBtaXNzaW5nLCBhbmQgY29sdW1uIG51bWJlciBpcyBub3QgZ3VhcmFudGVlZFxuICogICAtIElFOiAgICAgIGxpbmUgYW5kIGNvbHVtbiBudW1iZXIgZm9yIHRoZSB0b3AgZnJhbWUgb25seTsgc29tZSBmcmFtZXNcbiAqICAgICAgICAgICAgICBtYXkgYmUgbWlzc2luZywgYW5kIGNvbHVtbiBudW1iZXIgaXMgbm90IGd1YXJhbnRlZWRcbiAqXG4gKiBJbiB0aGVvcnksIFRyYWNlS2l0IHNob3VsZCB3b3JrIG9uIGFsbCBvZiB0aGUgZm9sbG93aW5nIHZlcnNpb25zOlxuICogICAtIElFNS41KyAob25seSA4LjAgdGVzdGVkKVxuICogICAtIEZpcmVmb3ggMC45KyAob25seSAzLjUrIHRlc3RlZClcbiAqICAgLSBPcGVyYSA3KyAob25seSAxMC41MCB0ZXN0ZWQ7IHZlcnNpb25zIDkgYW5kIGVhcmxpZXIgbWF5IHJlcXVpcmVcbiAqICAgICBFeGNlcHRpb25zIEhhdmUgU3RhY2t0cmFjZSB0byBiZSBlbmFibGVkIGluIG9wZXJhOmNvbmZpZylcbiAqICAgLSBTYWZhcmkgMysgKG9ubHkgNCsgdGVzdGVkKVxuICogICAtIENocm9tZSAxKyAob25seSA1KyB0ZXN0ZWQpXG4gKiAgIC0gS29ucXVlcm9yIDMuNSsgKHVudGVzdGVkKVxuICpcbiAqIFJlcXVpcmVzIFRyYWNlS2l0LmNvbXB1dGVTdGFja1RyYWNlLlxuICpcbiAqIFRyaWVzIHRvIGNhdGNoIGFsbCB1bmhhbmRsZWQgZXhjZXB0aW9ucyBhbmQgcmVwb3J0IHRoZW0gdG8gdGhlXG4gKiBzdWJzY3JpYmVkIGhhbmRsZXJzLiBQbGVhc2Ugbm90ZSB0aGF0IFRyYWNlS2l0LnJlcG9ydCB3aWxsIHJldGhyb3cgdGhlXG4gKiBleGNlcHRpb24uIFRoaXMgaXMgUkVRVUlSRUQgaW4gb3JkZXIgdG8gZ2V0IGEgdXNlZnVsIHN0YWNrIHRyYWNlIGluIElFLlxuICogSWYgdGhlIGV4Y2VwdGlvbiBkb2VzIG5vdCByZWFjaCB0aGUgdG9wIG9mIHRoZSBicm93c2VyLCB5b3Ugd2lsbCBvbmx5XG4gKiBnZXQgYSBzdGFjayB0cmFjZSBmcm9tIHRoZSBwb2ludCB3aGVyZSBUcmFjZUtpdC5yZXBvcnQgd2FzIGNhbGxlZC5cbiAqXG4gKiBIYW5kbGVycyByZWNlaXZlIGEgc3RhY2tJbmZvIG9iamVjdCBhcyBkZXNjcmliZWQgaW4gdGhlXG4gKiBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZSBkb2NzLlxuICovXG5UcmFjZUtpdC5yZXBvcnQgPSAoZnVuY3Rpb24gcmVwb3J0TW9kdWxlV3JhcHBlcigpIHtcbiAgICB2YXIgaGFuZGxlcnMgPSBbXSxcbiAgICAgICAgbGFzdEFyZ3MgPSBudWxsLFxuICAgICAgICBsYXN0RXhjZXB0aW9uID0gbnVsbCxcbiAgICAgICAgbGFzdEV4Y2VwdGlvblN0YWNrID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGNyYXNoIGhhbmRsZXIuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShoYW5kbGVyKSB7XG4gICAgICAgIGluc3RhbGxHbG9iYWxIYW5kbGVyKCk7XG4gICAgICAgIGhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgY3Jhc2ggaGFuZGxlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5zdWJzY3JpYmUoaGFuZGxlcikge1xuICAgICAgICBmb3IgKHZhciBpID0gaGFuZGxlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgICAgIGlmIChoYW5kbGVyc1tpXSA9PT0gaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhbGwgY3Jhc2ggaGFuZGxlcnMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdW5zdWJzY3JpYmVBbGwoKSB7XG4gICAgICAgIHVuaW5zdGFsbEdsb2JhbEhhbmRsZXIoKTtcbiAgICAgICAgaGFuZGxlcnMgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEaXNwYXRjaCBzdGFjayBpbmZvcm1hdGlvbiB0byBhbGwgaGFuZGxlcnMuXG4gICAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgKj59IHN0YWNrXG4gICAgICovXG4gICAgZnVuY3Rpb24gbm90aWZ5SGFuZGxlcnMoc3RhY2ssIGlzV2luZG93RXJyb3IpIHtcbiAgICAgICAgdmFyIGV4Y2VwdGlvbiA9IG51bGw7XG4gICAgICAgIGlmIChpc1dpbmRvd0Vycm9yICYmICFUcmFjZUtpdC5jb2xsZWN0V2luZG93RXJyb3JzKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgaW4gaGFuZGxlcnMpIHtcbiAgICAgICAgICAgIGlmIChoYXNLZXkoaGFuZGxlcnMsIGkpKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnNbaV0uYXBwbHkobnVsbCwgW3N0YWNrXS5jb25jYXQoX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSkpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGlubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGlubmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBfb2xkT25lcnJvckhhbmRsZXIsIF9vbkVycm9ySGFuZGxlckluc3RhbGxlZDtcblxuICAgIC8qKlxuICAgICAqIEVuc3VyZXMgYWxsIGdsb2JhbCB1bmhhbmRsZWQgZXhjZXB0aW9ucyBhcmUgcmVjb3JkZWQuXG4gICAgICogU3VwcG9ydGVkIGJ5IEdlY2tvIGFuZCBJRS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBFcnJvciBtZXNzYWdlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVVJMIG9mIHNjcmlwdCB0aGF0IGdlbmVyYXRlZCB0aGUgZXhjZXB0aW9uLlxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBsaW5lTm8gVGhlIGxpbmUgbnVtYmVyIGF0IHdoaWNoIHRoZSBlcnJvclxuICAgICAqIG9jY3VycmVkLlxuICAgICAqIEBwYXJhbSB7PyhudW1iZXJ8c3RyaW5nKX0gY29sTm8gVGhlIGNvbHVtbiBudW1iZXIgYXQgd2hpY2ggdGhlIGVycm9yXG4gICAgICogb2NjdXJyZWQuXG4gICAgICogQHBhcmFtIHs/RXJyb3J9IGV4IFRoZSBhY3R1YWwgRXJyb3Igb2JqZWN0LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRyYWNlS2l0V2luZG93T25FcnJvcihtZXNzYWdlLCB1cmwsIGxpbmVObywgY29sTm8sIGV4KSB7XG4gICAgICAgIHZhciBzdGFjayA9IG51bGw7XG5cbiAgICAgICAgaWYgKGxhc3RFeGNlcHRpb25TdGFjaykge1xuICAgICAgICAgICAgVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2UuYXVnbWVudFN0YWNrVHJhY2VXaXRoSW5pdGlhbEVsZW1lbnQobGFzdEV4Y2VwdGlvblN0YWNrLCB1cmwsIGxpbmVObywgbWVzc2FnZSk7XG4gICAgICAgICAgICBwcm9jZXNzTGFzdEV4Y2VwdGlvbigpO1xuICAgICAgICB9IGVsc2UgaWYgKGV4KSB7XG4gICAgICAgICAgICAvLyBOZXcgY2hyb21lIGFuZCBibGluayBzZW5kIGFsb25nIGEgcmVhbCBlcnJvciBvYmplY3RcbiAgICAgICAgICAgIC8vIExldCdzIGp1c3QgcmVwb3J0IHRoYXQgbGlrZSBhIG5vcm1hbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNlZTogaHR0cHM6Ly9taWtld2VzdC5vcmcvMjAxMy8wOC9kZWJ1Z2dpbmctcnVudGltZS1lcnJvcnMtd2l0aC13aW5kb3ctb25lcnJvclxuICAgICAgICAgICAgc3RhY2sgPSBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZShleCk7XG4gICAgICAgICAgICBub3RpZnlIYW5kbGVycyhzdGFjaywgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgbG9jYXRpb24gPSB7XG4gICAgICAgICAgICAgICAgJ3VybCc6IHVybCxcbiAgICAgICAgICAgICAgICAnbGluZSc6IGxpbmVObyxcbiAgICAgICAgICAgICAgICAnY29sdW1uJzogY29sTm9cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsb2NhdGlvbi5mdW5jID0gVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2UuZ3Vlc3NGdW5jdGlvbk5hbWUobG9jYXRpb24udXJsLCBsb2NhdGlvbi5saW5lKTtcbiAgICAgICAgICAgIGxvY2F0aW9uLmNvbnRleHQgPSBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZS5nYXRoZXJDb250ZXh0KGxvY2F0aW9uLnVybCwgbG9jYXRpb24ubGluZSk7XG4gICAgICAgICAgICBzdGFjayA9IHtcbiAgICAgICAgICAgICAgICAnbWVzc2FnZSc6IG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgJ3VybCc6IGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICAgICAgJ3N0YWNrJzogW2xvY2F0aW9uXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG5vdGlmeUhhbmRsZXJzKHN0YWNrLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfb2xkT25lcnJvckhhbmRsZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBfb2xkT25lcnJvckhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnN0YWxsR2xvYmFsSGFuZGxlciAoKVxuICAgIHtcbiAgICAgICAgaWYgKF9vbkVycm9ySGFuZGxlckluc3RhbGxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIF9vbGRPbmVycm9ySGFuZGxlciA9IHdpbmRvdy5vbmVycm9yO1xuICAgICAgICB3aW5kb3cub25lcnJvciA9IHRyYWNlS2l0V2luZG93T25FcnJvcjtcbiAgICAgICAgX29uRXJyb3JIYW5kbGVySW5zdGFsbGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1bmluc3RhbGxHbG9iYWxIYW5kbGVyICgpXG4gICAge1xuICAgICAgICBpZiAoIV9vbkVycm9ySGFuZGxlckluc3RhbGxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5vbmVycm9yID0gX29sZE9uZXJyb3JIYW5kbGVyO1xuICAgICAgICBfb25FcnJvckhhbmRsZXJJbnN0YWxsZWQgPSBmYWxzZTtcbiAgICAgICAgX29sZE9uZXJyb3JIYW5kbGVyID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NMYXN0RXhjZXB0aW9uKCkge1xuICAgICAgICB2YXIgX2xhc3RFeGNlcHRpb25TdGFjayA9IGxhc3RFeGNlcHRpb25TdGFjayxcbiAgICAgICAgICAgIF9sYXN0QXJncyA9IGxhc3RBcmdzO1xuICAgICAgICBsYXN0QXJncyA9IG51bGw7XG4gICAgICAgIGxhc3RFeGNlcHRpb25TdGFjayA9IG51bGw7XG4gICAgICAgIGxhc3RFeGNlcHRpb24gPSBudWxsO1xuICAgICAgICBub3RpZnlIYW5kbGVycy5hcHBseShudWxsLCBbX2xhc3RFeGNlcHRpb25TdGFjaywgZmFsc2VdLmNvbmNhdChfbGFzdEFyZ3MpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXBvcnRzIGFuIHVuaGFuZGxlZCBFcnJvciB0byBUcmFjZUtpdC5cbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBleFxuICAgICAqIEBwYXJhbSB7P2Jvb2xlYW59IHJldGhyb3cgSWYgZmFsc2UsIGRvIG5vdCByZS10aHJvdyB0aGUgZXhjZXB0aW9uLlxuICAgICAqIE9ubHkgdXNlZCBmb3Igd2luZG93Lm9uZXJyb3IgdG8gbm90IGNhdXNlIGFuIGluZmluaXRlIGxvb3Agb2ZcbiAgICAgKiByZXRocm93aW5nLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlcG9ydChleCwgcmV0aHJvdykge1xuICAgICAgICB2YXIgYXJncyA9IF9zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGlmIChsYXN0RXhjZXB0aW9uU3RhY2spIHtcbiAgICAgICAgICAgIGlmIChsYXN0RXhjZXB0aW9uID09PSBleCkge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gYWxyZWFkeSBjYXVnaHQgYnkgYW4gaW5uZXIgY2F0Y2ggYmxvY2ssIGlnbm9yZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcHJvY2Vzc0xhc3RFeGNlcHRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdGFjayA9IFRyYWNlS2l0LmNvbXB1dGVTdGFja1RyYWNlKGV4KTtcbiAgICAgICAgbGFzdEV4Y2VwdGlvblN0YWNrID0gc3RhY2s7XG4gICAgICAgIGxhc3RFeGNlcHRpb24gPSBleDtcbiAgICAgICAgbGFzdEFyZ3MgPSBhcmdzO1xuXG4gICAgICAgIC8vIElmIHRoZSBzdGFjayB0cmFjZSBpcyBpbmNvbXBsZXRlLCB3YWl0IGZvciAyIHNlY29uZHMgZm9yXG4gICAgICAgIC8vIHNsb3cgc2xvdyBJRSB0byBzZWUgaWYgb25lcnJvciBvY2N1cnMgb3Igbm90IGJlZm9yZSByZXBvcnRpbmdcbiAgICAgICAgLy8gdGhpcyBleGNlcHRpb247IG90aGVyd2lzZSwgd2Ugd2lsbCBlbmQgdXAgd2l0aCBhbiBpbmNvbXBsZXRlXG4gICAgICAgIC8vIHN0YWNrIHRyYWNlXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChsYXN0RXhjZXB0aW9uID09PSBleCkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3NMYXN0RXhjZXB0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIChzdGFjay5pbmNvbXBsZXRlID8gMjAwMCA6IDApKTtcblxuICAgICAgICBpZiAocmV0aHJvdyAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHRocm93IGV4OyAvLyByZS10aHJvdyB0byBwcm9wYWdhdGUgdG8gdGhlIHRvcCBsZXZlbCAoYW5kIGNhdXNlIHdpbmRvdy5vbmVycm9yKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVwb3J0LnN1YnNjcmliZSA9IHN1YnNjcmliZTtcbiAgICByZXBvcnQudW5zdWJzY3JpYmUgPSB1bnN1YnNjcmliZTtcbiAgICByZXBvcnQudW5pbnN0YWxsID0gdW5zdWJzY3JpYmVBbGw7XG4gICAgcmV0dXJuIHJlcG9ydDtcbn0oKSk7XG5cbi8qKlxuICogVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2U6IGNyb3NzLWJyb3dzZXIgc3RhY2sgdHJhY2VzIGluIEphdmFTY3JpcHRcbiAqXG4gKiBTeW50YXg6XG4gKiAgIHMgPSBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZS5vZkNhbGxlcihbZGVwdGhdKVxuICogICBzID0gVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2UoZXhjZXB0aW9uKSAvLyBjb25zaWRlciB1c2luZyBUcmFjZUtpdC5yZXBvcnQgaW5zdGVhZCAoc2VlIGJlbG93KVxuICogUmV0dXJuczpcbiAqICAgcy5uYW1lICAgICAgICAgICAgICAtIGV4Y2VwdGlvbiBuYW1lXG4gKiAgIHMubWVzc2FnZSAgICAgICAgICAgLSBleGNlcHRpb24gbWVzc2FnZVxuICogICBzLnN0YWNrW2ldLnVybCAgICAgIC0gSmF2YVNjcmlwdCBvciBIVE1MIGZpbGUgVVJMXG4gKiAgIHMuc3RhY2tbaV0uZnVuYyAgICAgLSBmdW5jdGlvbiBuYW1lLCBvciBlbXB0eSBmb3IgYW5vbnltb3VzIGZ1bmN0aW9ucyAoaWYgZ3Vlc3NpbmcgZGlkIG5vdCB3b3JrKVxuICogICBzLnN0YWNrW2ldLmFyZ3MgICAgIC0gYXJndW1lbnRzIHBhc3NlZCB0byB0aGUgZnVuY3Rpb24sIGlmIGtub3duXG4gKiAgIHMuc3RhY2tbaV0ubGluZSAgICAgLSBsaW5lIG51bWJlciwgaWYga25vd25cbiAqICAgcy5zdGFja1tpXS5jb2x1bW4gICAtIGNvbHVtbiBudW1iZXIsIGlmIGtub3duXG4gKiAgIHMuc3RhY2tbaV0uY29udGV4dCAgLSBhbiBhcnJheSBvZiBzb3VyY2UgY29kZSBsaW5lczsgdGhlIG1pZGRsZSBlbGVtZW50IGNvcnJlc3BvbmRzIHRvIHRoZSBjb3JyZWN0IGxpbmUjXG4gKlxuICogU3VwcG9ydHM6XG4gKiAgIC0gRmlyZWZveDogIGZ1bGwgc3RhY2sgdHJhY2Ugd2l0aCBsaW5lIG51bWJlcnMgYW5kIHVucmVsaWFibGUgY29sdW1uXG4gKiAgICAgICAgICAgICAgIG51bWJlciBvbiB0b3AgZnJhbWVcbiAqICAgLSBPcGVyYSAxMDogZnVsbCBzdGFjayB0cmFjZSB3aXRoIGxpbmUgYW5kIGNvbHVtbiBudW1iZXJzXG4gKiAgIC0gT3BlcmEgOS06IGZ1bGwgc3RhY2sgdHJhY2Ugd2l0aCBsaW5lIG51bWJlcnNcbiAqICAgLSBDaHJvbWU6ICAgZnVsbCBzdGFjayB0cmFjZSB3aXRoIGxpbmUgYW5kIGNvbHVtbiBudW1iZXJzXG4gKiAgIC0gU2FmYXJpOiAgIGxpbmUgYW5kIGNvbHVtbiBudW1iZXIgZm9yIHRoZSB0b3Btb3N0IHN0YWNrdHJhY2UgZWxlbWVudFxuICogICAgICAgICAgICAgICBvbmx5XG4gKiAgIC0gSUU6ICAgICAgIG5vIGxpbmUgbnVtYmVycyB3aGF0c29ldmVyXG4gKlxuICogVHJpZXMgdG8gZ3Vlc3MgbmFtZXMgb2YgYW5vbnltb3VzIGZ1bmN0aW9ucyBieSBsb29raW5nIGZvciBhc3NpZ25tZW50c1xuICogaW4gdGhlIHNvdXJjZSBjb2RlLiBJbiBJRSBhbmQgU2FmYXJpLCB3ZSBoYXZlIHRvIGd1ZXNzIHNvdXJjZSBmaWxlIG5hbWVzXG4gKiBieSBzZWFyY2hpbmcgZm9yIGZ1bmN0aW9uIGJvZGllcyBpbnNpZGUgYWxsIHBhZ2Ugc2NyaXB0cy4gVGhpcyB3aWxsIG5vdFxuICogd29yayBmb3Igc2NyaXB0cyB0aGF0IGFyZSBsb2FkZWQgY3Jvc3MtZG9tYWluLlxuICogSGVyZSBiZSBkcmFnb25zOiBzb21lIGZ1bmN0aW9uIG5hbWVzIG1heSBiZSBndWVzc2VkIGluY29ycmVjdGx5LCBhbmRcbiAqIGR1cGxpY2F0ZSBmdW5jdGlvbnMgbWF5IGJlIG1pc21hdGNoZWQuXG4gKlxuICogVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2Ugc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3IgdHJhY2luZyBwdXJwb3Nlcy5cbiAqIExvZ2dpbmcgb2YgdW5oYW5kbGVkIGV4Y2VwdGlvbnMgc2hvdWxkIGJlIGRvbmUgd2l0aCBUcmFjZUtpdC5yZXBvcnQsXG4gKiB3aGljaCBidWlsZHMgb24gdG9wIG9mIFRyYWNlS2l0LmNvbXB1dGVTdGFja1RyYWNlIGFuZCBwcm92aWRlcyBiZXR0ZXJcbiAqIElFIHN1cHBvcnQgYnkgdXRpbGl6aW5nIHRoZSB3aW5kb3cub25lcnJvciBldmVudCB0byByZXRyaWV2ZSBpbmZvcm1hdGlvblxuICogYWJvdXQgdGhlIHRvcCBvZiB0aGUgc3RhY2suXG4gKlxuICogTm90ZTogSW4gSUUgYW5kIFNhZmFyaSwgbm8gc3RhY2sgdHJhY2UgaXMgcmVjb3JkZWQgb24gdGhlIEVycm9yIG9iamVjdCxcbiAqIHNvIGNvbXB1dGVTdGFja1RyYWNlIGluc3RlYWQgd2Fsa3MgaXRzICpvd24qIGNoYWluIG9mIGNhbGxlcnMuXG4gKiBUaGlzIG1lYW5zIHRoYXQ6XG4gKiAgKiBpbiBTYWZhcmksIHNvbWUgbWV0aG9kcyBtYXkgYmUgbWlzc2luZyBmcm9tIHRoZSBzdGFjayB0cmFjZTtcbiAqICAqIGluIElFLCB0aGUgdG9wbW9zdCBmdW5jdGlvbiBpbiB0aGUgc3RhY2sgdHJhY2Ugd2lsbCBhbHdheXMgYmUgdGhlXG4gKiAgICBjYWxsZXIgb2YgY29tcHV0ZVN0YWNrVHJhY2UuXG4gKlxuICogVGhpcyBpcyBva2F5IGZvciB0cmFjaW5nIChiZWNhdXNlIHlvdSBhcmUgbGlrZWx5IHRvIGJlIGNhbGxpbmdcbiAqIGNvbXB1dGVTdGFja1RyYWNlIGZyb20gdGhlIGZ1bmN0aW9uIHlvdSB3YW50IHRvIGJlIHRoZSB0b3Btb3N0IGVsZW1lbnRcbiAqIG9mIHRoZSBzdGFjayB0cmFjZSBhbnl3YXkpLCBidXQgbm90IG9rYXkgZm9yIGxvZ2dpbmcgdW5oYW5kbGVkXG4gKiBleGNlcHRpb25zIChiZWNhdXNlIHlvdXIgY2F0Y2ggYmxvY2sgd2lsbCBsaWtlbHkgYmUgZmFyIGF3YXkgZnJvbSB0aGVcbiAqIGlubmVyIGZ1bmN0aW9uIHRoYXQgYWN0dWFsbHkgY2F1c2VkIHRoZSBleGNlcHRpb24pLlxuICpcbiAqIFRyYWNpbmcgZXhhbXBsZTpcbiAqICAgICBmdW5jdGlvbiB0cmFjZShtZXNzYWdlKSB7XG4gKiAgICAgICAgIHZhciBzdGFja0luZm8gPSBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZS5vZkNhbGxlcigpO1xuICogICAgICAgICB2YXIgZGF0YSA9IG1lc3NhZ2UgKyBcIlxcblwiO1xuICogICAgICAgICBmb3IodmFyIGkgaW4gc3RhY2tJbmZvLnN0YWNrKSB7XG4gKiAgICAgICAgICAgICB2YXIgaXRlbSA9IHN0YWNrSW5mby5zdGFja1tpXTtcbiAqICAgICAgICAgICAgIGRhdGEgKz0gKGl0ZW0uZnVuYyB8fCAnW2Fub255bW91c10nKSArIFwiKCkgaW4gXCIgKyBpdGVtLnVybCArIFwiOlwiICsgKGl0ZW0ubGluZSB8fCAnMCcpICsgXCJcXG5cIjtcbiAqICAgICAgICAgfVxuICogICAgICAgICBpZiAod2luZG93LmNvbnNvbGUpXG4gKiAgICAgICAgICAgICBjb25zb2xlLmluZm8oZGF0YSk7XG4gKiAgICAgICAgIGVsc2VcbiAqICAgICAgICAgICAgIGFsZXJ0KGRhdGEpO1xuICogICAgIH1cbiAqL1xuVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2UgPSAoZnVuY3Rpb24gY29tcHV0ZVN0YWNrVHJhY2VXcmFwcGVyKCkge1xuICAgIHZhciBkZWJ1ZyA9IGZhbHNlLFxuICAgICAgICBzb3VyY2VDYWNoZSA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogQXR0ZW1wdHMgdG8gcmV0cmlldmUgc291cmNlIGNvZGUgdmlhIFhNTEh0dHBSZXF1ZXN0LCB3aGljaCBpcyB1c2VkXG4gICAgICogdG8gbG9vayB1cCBhbm9ueW1vdXMgZnVuY3Rpb24gbmFtZXMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVUkwgb2Ygc291cmNlIGNvZGUuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBTb3VyY2UgY29udGVudHMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gbG9hZFNvdXJjZSh1cmwpIHtcbiAgICAgICAgaWYgKCFUcmFjZUtpdC5yZW1vdGVGZXRjaGluZykgeyAvL09ubHkgYXR0ZW1wdCByZXF1ZXN0IGlmIHJlbW90ZUZldGNoaW5nIGlzIG9uLlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZ2V0WEhSID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGV4cGxpY2l0bHkgYnViYmxlIHVwIHRoZSBleGNlcHRpb24gaWYgbm90IGZvdW5kXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgd2luZG93LkFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSBnZXRYSFIoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub3BlbignR0VUJywgdXJsLCBmYWxzZSk7XG4gICAgICAgICAgICByZXF1ZXN0LnNlbmQoJycpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3QucmVzcG9uc2VUZXh0O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgc291cmNlIGNvZGUgZnJvbSB0aGUgc291cmNlIGNvZGUgY2FjaGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVUkwgb2Ygc291cmNlIGNvZGUuXG4gICAgICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59IFNvdXJjZSBjb250ZW50cy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRTb3VyY2UodXJsKSB7XG4gICAgICAgIGlmICghaXNTdHJpbmcodXJsKSkgcmV0dXJuIFtdO1xuICAgICAgICBpZiAoIWhhc0tleShzb3VyY2VDYWNoZSwgdXJsKSkge1xuICAgICAgICAgICAgLy8gVVJMIG5lZWRzIHRvIGJlIGFibGUgdG8gZmV0Y2hlZCB3aXRoaW4gdGhlIGFjY2VwdGFibGUgZG9tYWluLiAgT3RoZXJ3aXNlLFxuICAgICAgICAgICAgLy8gY3Jvc3MtZG9tYWluIGVycm9ycyB3aWxsIGJlIHRyaWdnZXJlZC5cbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSAnJztcbiAgICAgICAgICAgIGlmICh1cmwuaW5kZXhPZihkb2N1bWVudC5kb21haW4pICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHNvdXJjZSA9IGxvYWRTb3VyY2UodXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvdXJjZUNhY2hlW3VybF0gPSBzb3VyY2UgPyBzb3VyY2Uuc3BsaXQoJ1xcbicpIDogW107XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc291cmNlQ2FjaGVbdXJsXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUcmllcyB0byB1c2UgYW4gZXh0ZXJuYWxseSBsb2FkZWQgY29weSBvZiBzb3VyY2UgY29kZSB0byBkZXRlcm1pbmVcbiAgICAgKiB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uIGJ5IGxvb2tpbmcgYXQgdGhlIG5hbWUgb2YgdGhlIHZhcmlhYmxlIGl0IHdhc1xuICAgICAqIGFzc2lnbmVkIHRvLCBpZiBhbnkuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVUkwgb2Ygc291cmNlIGNvZGUuXG4gICAgICogQHBhcmFtIHsoc3RyaW5nfG51bWJlcil9IGxpbmVObyBMaW5lIG51bWJlciBpbiBzb3VyY2UgY29kZS5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBmdW5jdGlvbiBuYW1lLCBpZiBkaXNjb3ZlcmFibGUuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ3Vlc3NGdW5jdGlvbk5hbWUodXJsLCBsaW5lTm8pIHtcbiAgICAgICAgdmFyIHJlRnVuY3Rpb25BcmdOYW1lcyA9IC9mdW5jdGlvbiAoW14oXSopXFwoKFteKV0qKVxcKS8sXG4gICAgICAgICAgICByZUd1ZXNzRnVuY3Rpb24gPSAvWydcIl0/KFswLTlBLVphLXokX10rKVsnXCJdP1xccypbOj1dXFxzKihmdW5jdGlvbnxldmFsfG5ldyBGdW5jdGlvbikvLFxuICAgICAgICAgICAgbGluZSA9ICcnLFxuICAgICAgICAgICAgbWF4TGluZXMgPSAxMCxcbiAgICAgICAgICAgIHNvdXJjZSA9IGdldFNvdXJjZSh1cmwpLFxuICAgICAgICAgICAgbTtcblxuICAgICAgICBpZiAoIXNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBVTktOT1dOX0ZVTkNUSU9OO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2FsayBiYWNrd2FyZHMgZnJvbSB0aGUgZmlyc3QgbGluZSBpbiB0aGUgZnVuY3Rpb24gdW50aWwgd2UgZmluZCB0aGUgbGluZSB3aGljaFxuICAgICAgICAvLyBtYXRjaGVzIHRoZSBwYXR0ZXJuIGFib3ZlLCB3aGljaCBpcyB0aGUgZnVuY3Rpb24gZGVmaW5pdGlvblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1heExpbmVzOyArK2kpIHtcbiAgICAgICAgICAgIGxpbmUgPSBzb3VyY2VbbGluZU5vIC0gaV0gKyBsaW5lO1xuXG4gICAgICAgICAgICBpZiAoIWlzVW5kZWZpbmVkKGxpbmUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKChtID0gcmVHdWVzc0Z1bmN0aW9uLmV4ZWMobGluZSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtWzFdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKG0gPSByZUZ1bmN0aW9uQXJnTmFtZXMuZXhlYyhsaW5lKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1bMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFVOS05PV05fRlVOQ1RJT047XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIHRoZSBzdXJyb3VuZGluZyBsaW5lcyBmcm9tIHdoZXJlIGFuIGV4Y2VwdGlvbiBvY2N1cnJlZC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFVSTCBvZiBzb3VyY2UgY29kZS5cbiAgICAgKiBAcGFyYW0geyhzdHJpbmd8bnVtYmVyKX0gbGluZSBMaW5lIG51bWJlciBpbiBzb3VyY2UgY29kZSB0byBjZW50cmVcbiAgICAgKiBhcm91bmQgZm9yIGNvbnRleHQuXG4gICAgICogQHJldHVybiB7P0FycmF5LjxzdHJpbmc+fSBMaW5lcyBvZiBzb3VyY2UgY29kZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnYXRoZXJDb250ZXh0KHVybCwgbGluZSkge1xuICAgICAgICB2YXIgc291cmNlID0gZ2V0U291cmNlKHVybCk7XG5cbiAgICAgICAgaWYgKCFzb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjb250ZXh0ID0gW10sXG4gICAgICAgICAgICAvLyBsaW5lc0JlZm9yZSAmIGxpbmVzQWZ0ZXIgYXJlIGluY2x1c2l2ZSB3aXRoIHRoZSBvZmZlbmRpbmcgbGluZS5cbiAgICAgICAgICAgIC8vIGlmIGxpbmVzT2ZDb250ZXh0IGlzIGV2ZW4sIHRoZXJlIHdpbGwgYmUgb25lIGV4dHJhIGxpbmVcbiAgICAgICAgICAgIC8vICAgKmJlZm9yZSogdGhlIG9mZmVuZGluZyBsaW5lLlxuICAgICAgICAgICAgbGluZXNCZWZvcmUgPSBNYXRoLmZsb29yKFRyYWNlS2l0LmxpbmVzT2ZDb250ZXh0IC8gMiksXG4gICAgICAgICAgICAvLyBBZGQgb25lIGV4dHJhIGxpbmUgaWYgbGluZXNPZkNvbnRleHQgaXMgb2RkXG4gICAgICAgICAgICBsaW5lc0FmdGVyID0gbGluZXNCZWZvcmUgKyAoVHJhY2VLaXQubGluZXNPZkNvbnRleHQgJSAyKSxcbiAgICAgICAgICAgIHN0YXJ0ID0gTWF0aC5tYXgoMCwgbGluZSAtIGxpbmVzQmVmb3JlIC0gMSksXG4gICAgICAgICAgICBlbmQgPSBNYXRoLm1pbihzb3VyY2UubGVuZ3RoLCBsaW5lICsgbGluZXNBZnRlciAtIDEpO1xuXG4gICAgICAgIGxpbmUgLT0gMTsgLy8gY29udmVydCB0byAwLWJhc2VkIGluZGV4XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgICAgICAgIGlmICghaXNVbmRlZmluZWQoc291cmNlW2ldKSkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQucHVzaChzb3VyY2VbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbnRleHQubGVuZ3RoID4gMCA/IGNvbnRleHQgOiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVzY2FwZXMgc3BlY2lhbCBjaGFyYWN0ZXJzLCBleGNlcHQgZm9yIHdoaXRlc3BhY2UsIGluIGEgc3RyaW5nIHRvIGJlXG4gICAgICogdXNlZCBpbnNpZGUgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgYSBzdHJpbmcgbGl0ZXJhbC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBUaGUgc3RyaW5nLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGVzY2FwZWQgc3RyaW5nIGxpdGVyYWwuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRleHQucmVwbGFjZSgvW1xcLVxcW1xcXXt9KCkqKz8uLFxcXFxcXF4kfCNdL2csICdcXFxcJCYnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFc2NhcGVzIHNwZWNpYWwgY2hhcmFjdGVycyBpbiBhIHN0cmluZyB0byBiZSB1c2VkIGluc2lkZSBhIHJlZ3VsYXJcbiAgICAgKiBleHByZXNzaW9uIGFzIGEgc3RyaW5nIGxpdGVyYWwuIEFsc28gZW5zdXJlcyB0aGF0IEhUTUwgZW50aXRpZXMgd2lsbFxuICAgICAqIGJlIG1hdGNoZWQgdGhlIHNhbWUgYXMgdGhlaXIgbGl0ZXJhbCBmcmllbmRzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBib2R5IFRoZSBzdHJpbmcuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgZXNjYXBlZCBzdHJpbmcuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXNjYXBlQ29kZUFzUmVnRXhwRm9yTWF0Y2hpbmdJbnNpZGVIVE1MKGJvZHkpIHtcbiAgICAgICAgcmV0dXJuIGVzY2FwZVJlZ0V4cChib2R5KS5yZXBsYWNlKCc8JywgJyg/Ojx8Jmx0OyknKS5yZXBsYWNlKCc+JywgJyg/Oj58Jmd0OyknKS5yZXBsYWNlKCcmJywgJyg/OiZ8JmFtcDspJykucmVwbGFjZSgnXCInLCAnKD86XCJ8JnF1b3Q7KScpLnJlcGxhY2UoL1xccysvZywgJ1xcXFxzKycpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgd2hlcmUgYSBjb2RlIGZyYWdtZW50IG9jY3VycyBpbiB0aGUgc291cmNlIGNvZGUuXG4gICAgICogQHBhcmFtIHtSZWdFeHB9IHJlIFRoZSBmdW5jdGlvbiBkZWZpbml0aW9uLlxuICAgICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IHVybHMgQSBsaXN0IG9mIFVSTHMgdG8gc2VhcmNoLlxuICAgICAqIEByZXR1cm4gez9PYmplY3QuPHN0cmluZywgKHN0cmluZ3xudW1iZXIpPn0gQW4gb2JqZWN0IGNvbnRhaW5pbmdcbiAgICAgKiB0aGUgdXJsLCBsaW5lLCBhbmQgY29sdW1uIG51bWJlciBvZiB0aGUgZGVmaW5lZCBmdW5jdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmaW5kU291cmNlSW5VcmxzKHJlLCB1cmxzKSB7XG4gICAgICAgIHZhciBzb3VyY2UsIG07XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gdXJscy5sZW5ndGg7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdzZWFyY2hpbmcnLCB1cmxzW2ldKTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID0gZ2V0U291cmNlKHVybHNbaV0pKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBzb3VyY2UgPSBzb3VyY2Uuam9pbignXFxuJyk7XG4gICAgICAgICAgICAgICAgaWYgKChtID0gcmUuZXhlYyhzb3VyY2UpKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnRm91bmQgZnVuY3Rpb24gaW4gJyArIHVybHNbaV0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAndXJsJzogdXJsc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdsaW5lJzogc291cmNlLnN1YnN0cmluZygwLCBtLmluZGV4KS5zcGxpdCgnXFxuJykubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbHVtbic6IG0uaW5kZXggLSBzb3VyY2UubGFzdEluZGV4T2YoJ1xcbicsIG0uaW5kZXgpIC0gMVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdubyBtYXRjaCcpO1xuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgYXQgd2hpY2ggY29sdW1uIGEgY29kZSBmcmFnbWVudCBvY2N1cnMgb24gYSBsaW5lIG9mIHRoZVxuICAgICAqIHNvdXJjZSBjb2RlLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmcmFnbWVudCBUaGUgY29kZSBmcmFnbWVudC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFRoZSBVUkwgdG8gc2VhcmNoLlxuICAgICAqIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBsaW5lIFRoZSBsaW5lIG51bWJlciB0byBleGFtaW5lLlxuICAgICAqIEByZXR1cm4gez9udW1iZXJ9IFRoZSBjb2x1bW4gbnVtYmVyLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRTb3VyY2VJbkxpbmUoZnJhZ21lbnQsIHVybCwgbGluZSkge1xuICAgICAgICB2YXIgc291cmNlID0gZ2V0U291cmNlKHVybCksXG4gICAgICAgICAgICByZSA9IG5ldyBSZWdFeHAoJ1xcXFxiJyArIGVzY2FwZVJlZ0V4cChmcmFnbWVudCkgKyAnXFxcXGInKSxcbiAgICAgICAgICAgIG07XG5cbiAgICAgICAgbGluZSAtPSAxO1xuXG4gICAgICAgIGlmIChzb3VyY2UgJiYgc291cmNlLmxlbmd0aCA+IGxpbmUgJiYgKG0gPSByZS5leGVjKHNvdXJjZVtsaW5lXSkpKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5pbmRleDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgd2hlcmUgYSBmdW5jdGlvbiB3YXMgZGVmaW5lZCB3aXRoaW4gdGhlIHNvdXJjZSBjb2RlLlxuICAgICAqIEBwYXJhbSB7KEZ1bmN0aW9ufHN0cmluZyl9IGZ1bmMgQSBmdW5jdGlvbiByZWZlcmVuY2Ugb3Igc2VyaWFsaXplZFxuICAgICAqIGZ1bmN0aW9uIGRlZmluaXRpb24uXG4gICAgICogQHJldHVybiB7P09iamVjdC48c3RyaW5nLCAoc3RyaW5nfG51bWJlcik+fSBBbiBvYmplY3QgY29udGFpbmluZ1xuICAgICAqIHRoZSB1cmwsIGxpbmUsIGFuZCBjb2x1bW4gbnVtYmVyIG9mIHRoZSBkZWZpbmVkIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRTb3VyY2VCeUZ1bmN0aW9uQm9keShmdW5jKSB7XG4gICAgICAgIHZhciB1cmxzID0gW3dpbmRvdy5sb2NhdGlvbi5ocmVmXSxcbiAgICAgICAgICAgIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JyksXG4gICAgICAgICAgICBib2R5LFxuICAgICAgICAgICAgY29kZSA9ICcnICsgZnVuYyxcbiAgICAgICAgICAgIGNvZGVSRSA9IC9eZnVuY3Rpb24oPzpcXHMrKFtcXHckXSspKT9cXHMqXFwoKFtcXHdcXHMsXSopXFwpXFxzKlxce1xccyooXFxTW1xcc1xcU10qXFxTKVxccypcXH1cXHMqJC8sXG4gICAgICAgICAgICBldmVudFJFID0gL15mdW5jdGlvbiBvbihbXFx3JF0rKVxccypcXChldmVudFxcKVxccypcXHtcXHMqKFxcU1tcXHNcXFNdKlxcUylcXHMqXFx9XFxzKiQvLFxuICAgICAgICAgICAgcmUsXG4gICAgICAgICAgICBwYXJ0cyxcbiAgICAgICAgICAgIHJlc3VsdDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzY3JpcHQgPSBzY3JpcHRzW2ldO1xuICAgICAgICAgICAgaWYgKHNjcmlwdC5zcmMpIHtcbiAgICAgICAgICAgICAgICB1cmxzLnB1c2goc2NyaXB0LnNyYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIShwYXJ0cyA9IGNvZGVSRS5leGVjKGNvZGUpKSkge1xuICAgICAgICAgICAgcmUgPSBuZXcgUmVnRXhwKGVzY2FwZVJlZ0V4cChjb2RlKS5yZXBsYWNlKC9cXHMrL2csICdcXFxccysnKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBub3Qgc3VyZSBpZiB0aGlzIGlzIHJlYWxseSBuZWNlc3NhcnksIGJ1dCBJIGRvbuKAmXQgaGF2ZSBhIHRlc3RcbiAgICAgICAgLy8gY29ycHVzIGxhcmdlIGVub3VnaCB0byBjb25maXJtIHRoYXQgYW5kIGl0IHdhcyBpbiB0aGUgb3JpZ2luYWwuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBwYXJ0c1sxXSA/ICdcXFxccysnICsgcGFydHNbMV0gOiAnJyxcbiAgICAgICAgICAgICAgICBhcmdzID0gcGFydHNbMl0uc3BsaXQoJywnKS5qb2luKCdcXFxccyosXFxcXHMqJyk7XG5cbiAgICAgICAgICAgIGJvZHkgPSBlc2NhcGVSZWdFeHAocGFydHNbM10pLnJlcGxhY2UoLzskLywgJzs/Jyk7IC8vIHNlbWljb2xvbiBpcyBpbnNlcnRlZCBpZiB0aGUgZnVuY3Rpb24gZW5kcyB3aXRoIGEgY29tbWVudC5yZXBsYWNlKC9cXHMrL2csICdcXFxccysnKTtcbiAgICAgICAgICAgIHJlID0gbmV3IFJlZ0V4cCgnZnVuY3Rpb24nICsgbmFtZSArICdcXFxccypcXFxcKFxcXFxzKicgKyBhcmdzICsgJ1xcXFxzKlxcXFwpXFxcXHMqe1xcXFxzKicgKyBib2R5ICsgJ1xcXFxzKn0nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxvb2sgZm9yIGEgbm9ybWFsIGZ1bmN0aW9uIGRlZmluaXRpb25cbiAgICAgICAgaWYgKChyZXN1bHQgPSBmaW5kU291cmNlSW5VcmxzKHJlLCB1cmxzKSkpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsb29rIGZvciBhbiBvbGQtc2Nob29sIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgICAgaWYgKChwYXJ0cyA9IGV2ZW50UkUuZXhlYyhjb2RlKSkpIHtcbiAgICAgICAgICAgIHZhciBldmVudCA9IHBhcnRzWzFdO1xuICAgICAgICAgICAgYm9keSA9IGVzY2FwZUNvZGVBc1JlZ0V4cEZvck1hdGNoaW5nSW5zaWRlSFRNTChwYXJ0c1syXSk7XG5cbiAgICAgICAgICAgIC8vIGxvb2sgZm9yIGEgZnVuY3Rpb24gZGVmaW5lZCBpbiBIVE1MIGFzIGFuIG9uWFhYIGhhbmRsZXJcbiAgICAgICAgICAgIHJlID0gbmV3IFJlZ0V4cCgnb24nICsgZXZlbnQgKyAnPVtcXFxcXFwnXCJdXFxcXHMqJyArIGJvZHkgKyAnXFxcXHMqW1xcXFxcXCdcIl0nLCAnaScpO1xuXG4gICAgICAgICAgICBpZiAoKHJlc3VsdCA9IGZpbmRTb3VyY2VJblVybHMocmUsIHVybHNbMF0pKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGxvb2sgZm9yID8/P1xuICAgICAgICAgICAgcmUgPSBuZXcgUmVnRXhwKGJvZHkpO1xuXG4gICAgICAgICAgICBpZiAoKHJlc3VsdCA9IGZpbmRTb3VyY2VJblVybHMocmUsIHVybHMpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBDb250ZW50cyBvZiBFeGNlcHRpb24gaW4gdmFyaW91cyBicm93c2Vycy5cbiAgICAvL1xuICAgIC8vIFNBRkFSSTpcbiAgICAvLyBleC5tZXNzYWdlID0gQ2FuJ3QgZmluZCB2YXJpYWJsZTogcXFcbiAgICAvLyBleC5saW5lID0gNTlcbiAgICAvLyBleC5zb3VyY2VJZCA9IDU4MDIzODE5MlxuICAgIC8vIGV4LnNvdXJjZVVSTCA9IGh0dHA6Ly8uLi5cbiAgICAvLyBleC5leHByZXNzaW9uQmVnaW5PZmZzZXQgPSA5NlxuICAgIC8vIGV4LmV4cHJlc3Npb25DYXJldE9mZnNldCA9IDk4XG4gICAgLy8gZXguZXhwcmVzc2lvbkVuZE9mZnNldCA9IDk4XG4gICAgLy8gZXgubmFtZSA9IFJlZmVyZW5jZUVycm9yXG4gICAgLy9cbiAgICAvLyBGSVJFRk9YOlxuICAgIC8vIGV4Lm1lc3NhZ2UgPSBxcSBpcyBub3QgZGVmaW5lZFxuICAgIC8vIGV4LmZpbGVOYW1lID0gaHR0cDovLy4uLlxuICAgIC8vIGV4LmxpbmVOdW1iZXIgPSA1OVxuICAgIC8vIGV4LmNvbHVtbk51bWJlciA9IDY5XG4gICAgLy8gZXguc3RhY2sgPSAuLi5zdGFjayB0cmFjZS4uLiAoc2VlIHRoZSBleGFtcGxlIGJlbG93KVxuICAgIC8vIGV4Lm5hbWUgPSBSZWZlcmVuY2VFcnJvclxuICAgIC8vXG4gICAgLy8gQ0hST01FOlxuICAgIC8vIGV4Lm1lc3NhZ2UgPSBxcSBpcyBub3QgZGVmaW5lZFxuICAgIC8vIGV4Lm5hbWUgPSBSZWZlcmVuY2VFcnJvclxuICAgIC8vIGV4LnR5cGUgPSBub3RfZGVmaW5lZFxuICAgIC8vIGV4LmFyZ3VtZW50cyA9IFsnYWEnXVxuICAgIC8vIGV4LnN0YWNrID0gLi4uc3RhY2sgdHJhY2UuLi5cbiAgICAvL1xuICAgIC8vIElOVEVSTkVUIEVYUExPUkVSOlxuICAgIC8vIGV4Lm1lc3NhZ2UgPSAuLi5cbiAgICAvLyBleC5uYW1lID0gUmVmZXJlbmNlRXJyb3JcbiAgICAvL1xuICAgIC8vIE9QRVJBOlxuICAgIC8vIGV4Lm1lc3NhZ2UgPSAuLi5tZXNzYWdlLi4uIChzZWUgdGhlIGV4YW1wbGUgYmVsb3cpXG4gICAgLy8gZXgubmFtZSA9IFJlZmVyZW5jZUVycm9yXG4gICAgLy8gZXgub3BlcmEjc291cmNlbG9jID0gMTEgIChwcmV0dHkgbXVjaCB1c2VsZXNzLCBkdXBsaWNhdGVzIHRoZSBpbmZvIGluIGV4Lm1lc3NhZ2UpXG4gICAgLy8gZXguc3RhY2t0cmFjZSA9IG4vYTsgc2VlICdvcGVyYTpjb25maWcjVXNlclByZWZzfEV4Y2VwdGlvbnMgSGF2ZSBTdGFja3RyYWNlJ1xuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgc3RhY2sgdHJhY2UgaW5mb3JtYXRpb24gZnJvbSB0aGUgc3RhY2sgcHJvcGVydHkuXG4gICAgICogQ2hyb21lIGFuZCBHZWNrbyB1c2UgdGhpcyBwcm9wZXJ0eS5cbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBleFxuICAgICAqIEByZXR1cm4gez9PYmplY3QuPHN0cmluZywgKj59IFN0YWNrIHRyYWNlIGluZm9ybWF0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbXB1dGVTdGFja1RyYWNlRnJvbVN0YWNrUHJvcChleCkge1xuICAgICAgICBpZiAoIWV4LnN0YWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaHJvbWUgPSAvXlxccyphdCAoPzooKD86XFxbb2JqZWN0IG9iamVjdFxcXSk/XFxTKyg/OiBcXFthcyBcXFMrXFxdKT8pICk/XFwoPygoPzpmaWxlfGh0dHBzP3xjaHJvbWUtZXh0ZW5zaW9uKTouKj8pOihcXGQrKSg/OjooXFxkKykpP1xcKT9cXHMqJC9pLFxuICAgICAgICAgICAgZ2Vja28gPSAvXlxccyooXFxTKikoPzpcXCgoLio/KVxcKSk/QCgoPzpmaWxlfGh0dHBzP3xjaHJvbWUpLio/KTooXFxkKykoPzo6KFxcZCspKT9cXHMqJC9pLFxuICAgICAgICAgICAgbGluZXMgPSBleC5zdGFjay5zcGxpdCgnXFxuJyksXG4gICAgICAgICAgICBzdGFjayA9IFtdLFxuICAgICAgICAgICAgcGFydHMsXG4gICAgICAgICAgICBlbGVtZW50LFxuICAgICAgICAgICAgcmVmZXJlbmNlID0gL14oLiopIGlzIHVuZGVmaW5lZCQvLmV4ZWMoZXgubWVzc2FnZSk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBsaW5lcy5sZW5ndGg7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICAgIGlmICgocGFydHMgPSBnZWNrby5leGVjKGxpbmVzW2ldKSkpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAndXJsJzogcGFydHNbM10sXG4gICAgICAgICAgICAgICAgICAgICdmdW5jJzogcGFydHNbMV0gfHwgVU5LTk9XTl9GVU5DVElPTixcbiAgICAgICAgICAgICAgICAgICAgJ2FyZ3MnOiBwYXJ0c1syXSA/IHBhcnRzWzJdLnNwbGl0KCcsJykgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUnOiArcGFydHNbNF0sXG4gICAgICAgICAgICAgICAgICAgICdjb2x1bW4nOiBwYXJ0c1s1XSA/ICtwYXJ0c1s1XSA6IG51bGxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIGlmICgocGFydHMgPSBjaHJvbWUuZXhlYyhsaW5lc1tpXSkpKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ3VybCc6IHBhcnRzWzJdLFxuICAgICAgICAgICAgICAgICAgICAnZnVuYyc6IHBhcnRzWzFdIHx8IFVOS05PV05fRlVOQ1RJT04sXG4gICAgICAgICAgICAgICAgICAgICdsaW5lJzogK3BhcnRzWzNdLFxuICAgICAgICAgICAgICAgICAgICAnY29sdW1uJzogcGFydHNbNF0gPyArcGFydHNbNF0gOiBudWxsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZWxlbWVudC5mdW5jICYmIGVsZW1lbnQubGluZSkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuZnVuYyA9IGd1ZXNzRnVuY3Rpb25OYW1lKGVsZW1lbnQudXJsLCBlbGVtZW50LmxpbmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5saW5lKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5jb250ZXh0ID0gZ2F0aGVyQ29udGV4dChlbGVtZW50LnVybCwgZWxlbWVudC5saW5lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhY2sucHVzaChlbGVtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdGFja1swXS5saW5lICYmICFzdGFja1swXS5jb2x1bW4gJiYgcmVmZXJlbmNlKSB7XG4gICAgICAgICAgICBzdGFja1swXS5jb2x1bW4gPSBmaW5kU291cmNlSW5MaW5lKHJlZmVyZW5jZVsxXSwgc3RhY2tbMF0udXJsLCBzdGFja1swXS5saW5lKTtcbiAgICAgICAgfSBlbHNlIGlmICghc3RhY2tbMF0uY29sdW1uICYmICFpc1VuZGVmaW5lZChleC5jb2x1bW5OdW1iZXIpKSB7XG4gICAgICAgICAgICAvLyBGaXJlRm94IHVzZXMgdGhpcyBhd2Vzb21lIGNvbHVtbk51bWJlciBwcm9wZXJ0eSBmb3IgaXRzIHRvcCBmcmFtZVxuICAgICAgICAgICAgLy8gQWxzbyBub3RlLCBGaXJlZm94J3MgY29sdW1uIG51bWJlciBpcyAwLWJhc2VkIGFuZCBldmVyeXRoaW5nIGVsc2UgZXhwZWN0cyAxLWJhc2VkLFxuICAgICAgICAgICAgLy8gc28gYWRkaW5nIDFcbiAgICAgICAgICAgIHN0YWNrWzBdLmNvbHVtbiA9IGV4LmNvbHVtbk51bWJlciArIDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ25hbWUnOiBleC5uYW1lLFxuICAgICAgICAgICAgJ21lc3NhZ2UnOiBleC5tZXNzYWdlLFxuICAgICAgICAgICAgJ3VybCc6IGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICAnc3RhY2snOiBzdGFja1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGVzIHN0YWNrIHRyYWNlIGluZm9ybWF0aW9uIGZyb20gdGhlIHN0YWNrdHJhY2UgcHJvcGVydHkuXG4gICAgICogT3BlcmEgMTAgdXNlcyB0aGlzIHByb3BlcnR5LlxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGV4XG4gICAgICogQHJldHVybiB7P09iamVjdC48c3RyaW5nLCAqPn0gU3RhY2sgdHJhY2UgaW5mb3JtYXRpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29tcHV0ZVN0YWNrVHJhY2VGcm9tU3RhY2t0cmFjZVByb3AoZXgpIHtcbiAgICAgICAgLy8gQWNjZXNzIGFuZCBzdG9yZSB0aGUgc3RhY2t0cmFjZSBwcm9wZXJ0eSBiZWZvcmUgZG9pbmcgQU5ZVEhJTkdcbiAgICAgICAgLy8gZWxzZSB0byBpdCBiZWNhdXNlIE9wZXJhIGlzIG5vdCB2ZXJ5IGdvb2QgYXQgcHJvdmlkaW5nIGl0XG4gICAgICAgIC8vIHJlbGlhYmx5IGluIG90aGVyIGNpcmN1bXN0YW5jZXMuXG4gICAgICAgIHZhciBzdGFja3RyYWNlID0gZXguc3RhY2t0cmFjZTtcblxuICAgICAgICB2YXIgdGVzdFJFID0gLyBsaW5lIChcXGQrKSwgY29sdW1uIChcXGQrKSBpbiAoPzo8YW5vbnltb3VzIGZ1bmN0aW9uOiAoW14+XSspPnwoW15cXCldKykpXFwoKC4qKVxcKSBpbiAoLiopOlxccyokL2ksXG4gICAgICAgICAgICBsaW5lcyA9IHN0YWNrdHJhY2Uuc3BsaXQoJ1xcbicpLFxuICAgICAgICAgICAgc3RhY2sgPSBbXSxcbiAgICAgICAgICAgIHBhcnRzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gbGluZXMubGVuZ3RoOyBpIDwgajsgaSArPSAyKSB7XG4gICAgICAgICAgICBpZiAoKHBhcnRzID0gdGVzdFJFLmV4ZWMobGluZXNbaV0pKSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAnbGluZSc6ICtwYXJ0c1sxXSxcbiAgICAgICAgICAgICAgICAgICAgJ2NvbHVtbic6ICtwYXJ0c1syXSxcbiAgICAgICAgICAgICAgICAgICAgJ2Z1bmMnOiBwYXJ0c1szXSB8fCBwYXJ0c1s0XSxcbiAgICAgICAgICAgICAgICAgICAgJ2FyZ3MnOiBwYXJ0c1s1XSA/IHBhcnRzWzVdLnNwbGl0KCcsJykgOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgJ3VybCc6IHBhcnRzWzZdXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmICghZWxlbWVudC5mdW5jICYmIGVsZW1lbnQubGluZSkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmZ1bmMgPSBndWVzc0Z1bmN0aW9uTmFtZShlbGVtZW50LnVybCwgZWxlbWVudC5saW5lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQubGluZSkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jb250ZXh0ID0gZ2F0aGVyQ29udGV4dChlbGVtZW50LnVybCwgZWxlbWVudC5saW5lKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjKSB7fVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghZWxlbWVudC5jb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY29udGV4dCA9IFtsaW5lc1tpICsgMV1dO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goZWxlbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ25hbWUnOiBleC5uYW1lLFxuICAgICAgICAgICAgJ21lc3NhZ2UnOiBleC5tZXNzYWdlLFxuICAgICAgICAgICAgJ3VybCc6IGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICAnc3RhY2snOiBzdGFja1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5PVCBURVNURUQuXG4gICAgICogQ29tcHV0ZXMgc3RhY2sgdHJhY2UgaW5mb3JtYXRpb24gZnJvbSBhbiBlcnJvciBtZXNzYWdlIHRoYXQgaW5jbHVkZXNcbiAgICAgKiB0aGUgc3RhY2sgdHJhY2UuXG4gICAgICogT3BlcmEgOSBhbmQgZWFybGllciB1c2UgdGhpcyBtZXRob2QgaWYgdGhlIG9wdGlvbiB0byBzaG93IHN0YWNrXG4gICAgICogdHJhY2VzIGlzIHR1cm5lZCBvbiBpbiBvcGVyYTpjb25maWcuXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXhcbiAgICAgKiBAcmV0dXJuIHs/T2JqZWN0LjxzdHJpbmcsICo+fSBTdGFjayBpbmZvcm1hdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb21wdXRlU3RhY2tUcmFjZUZyb21PcGVyYU11bHRpTGluZU1lc3NhZ2UoZXgpIHtcbiAgICAgICAgLy8gT3BlcmEgaW5jbHVkZXMgYSBzdGFjayB0cmFjZSBpbnRvIHRoZSBleGNlcHRpb24gbWVzc2FnZS4gQW4gZXhhbXBsZSBpczpcbiAgICAgICAgLy9cbiAgICAgICAgLy8gU3RhdGVtZW50IG9uIGxpbmUgMzogVW5kZWZpbmVkIHZhcmlhYmxlOiB1bmRlZmluZWRGdW5jXG4gICAgICAgIC8vIEJhY2t0cmFjZTpcbiAgICAgICAgLy8gICBMaW5lIDMgb2YgbGlua2VkIHNjcmlwdCBmaWxlOi8vbG9jYWxob3N0L1VzZXJzL2FuZHJleXZpdC9Qcm9qZWN0cy9UcmFjZUtpdC9qYXZhc2NyaXB0LWNsaWVudC9zYW1wbGUuanM6IEluIGZ1bmN0aW9uIHp6elxuICAgICAgICAvLyAgICAgICAgIHVuZGVmaW5lZEZ1bmMoYSk7XG4gICAgICAgIC8vICAgTGluZSA3IG9mIGlubGluZSMxIHNjcmlwdCBpbiBmaWxlOi8vbG9jYWxob3N0L1VzZXJzL2FuZHJleXZpdC9Qcm9qZWN0cy9UcmFjZUtpdC9qYXZhc2NyaXB0LWNsaWVudC9zYW1wbGUuaHRtbDogSW4gZnVuY3Rpb24geXl5XG4gICAgICAgIC8vICAgICAgICAgICB6enooeCwgeSwgeik7XG4gICAgICAgIC8vICAgTGluZSAzIG9mIGlubGluZSMxIHNjcmlwdCBpbiBmaWxlOi8vbG9jYWxob3N0L1VzZXJzL2FuZHJleXZpdC9Qcm9qZWN0cy9UcmFjZUtpdC9qYXZhc2NyaXB0LWNsaWVudC9zYW1wbGUuaHRtbDogSW4gZnVuY3Rpb24geHh4XG4gICAgICAgIC8vICAgICAgICAgICB5eXkoYSwgYSwgYSk7XG4gICAgICAgIC8vICAgTGluZSAxIG9mIGZ1bmN0aW9uIHNjcmlwdFxuICAgICAgICAvLyAgICAgdHJ5IHsgeHh4KCdoaScpOyByZXR1cm4gZmFsc2U7IH0gY2F0Y2goZXgpIHsgVHJhY2VLaXQucmVwb3J0KGV4KTsgfVxuICAgICAgICAvLyAgIC4uLlxuXG4gICAgICAgIHZhciBsaW5lcyA9IGV4Lm1lc3NhZ2Uuc3BsaXQoJ1xcbicpO1xuICAgICAgICBpZiAobGluZXMubGVuZ3RoIDwgNCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbGluZVJFMSA9IC9eXFxzKkxpbmUgKFxcZCspIG9mIGxpbmtlZCBzY3JpcHQgKCg/OmZpbGV8aHR0cHM/KVxcUyspKD86OiBpbiBmdW5jdGlvbiAoXFxTKykpP1xccyokL2ksXG4gICAgICAgICAgICBsaW5lUkUyID0gL15cXHMqTGluZSAoXFxkKykgb2YgaW5saW5lIyhcXGQrKSBzY3JpcHQgaW4gKCg/OmZpbGV8aHR0cHM/KVxcUyspKD86OiBpbiBmdW5jdGlvbiAoXFxTKykpP1xccyokL2ksXG4gICAgICAgICAgICBsaW5lUkUzID0gL15cXHMqTGluZSAoXFxkKykgb2YgZnVuY3Rpb24gc2NyaXB0XFxzKiQvaSxcbiAgICAgICAgICAgIHN0YWNrID0gW10sXG4gICAgICAgICAgICBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpLFxuICAgICAgICAgICAgaW5saW5lU2NyaXB0QmxvY2tzID0gW10sXG4gICAgICAgICAgICBwYXJ0cyxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBsZW4sXG4gICAgICAgICAgICBzb3VyY2U7XG5cbiAgICAgICAgZm9yIChpIGluIHNjcmlwdHMpIHtcbiAgICAgICAgICAgIGlmIChoYXNLZXkoc2NyaXB0cywgaSkgJiYgIXNjcmlwdHNbaV0uc3JjKSB7XG4gICAgICAgICAgICAgICAgaW5saW5lU2NyaXB0QmxvY2tzLnB1c2goc2NyaXB0c1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAyLCBsZW4gPSBsaW5lcy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMikge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSBudWxsO1xuICAgICAgICAgICAgaWYgKChwYXJ0cyA9IGxpbmVSRTEuZXhlYyhsaW5lc1tpXSkpKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ3VybCc6IHBhcnRzWzJdLFxuICAgICAgICAgICAgICAgICAgICAnZnVuYyc6IHBhcnRzWzNdLFxuICAgICAgICAgICAgICAgICAgICAnbGluZSc6ICtwYXJ0c1sxXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChwYXJ0cyA9IGxpbmVSRTIuZXhlYyhsaW5lc1tpXSkpKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ3VybCc6IHBhcnRzWzNdLFxuICAgICAgICAgICAgICAgICAgICAnZnVuYyc6IHBhcnRzWzRdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgcmVsYXRpdmVMaW5lID0gKCtwYXJ0c1sxXSk7IC8vIHJlbGF0aXZlIHRvIHRoZSBzdGFydCBvZiB0aGUgPFNDUklQVD4gYmxvY2tcbiAgICAgICAgICAgICAgICB2YXIgc2NyaXB0ID0gaW5saW5lU2NyaXB0QmxvY2tzW3BhcnRzWzJdIC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKHNjcmlwdCkge1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2UgPSBnZXRTb3VyY2UoaXRlbS51cmwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgPSBzb3VyY2Uuam9pbignXFxuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcG9zID0gc291cmNlLmluZGV4T2Yoc2NyaXB0LmlubmVyVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocG9zID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmxpbmUgPSByZWxhdGl2ZUxpbmUgKyBzb3VyY2Uuc3Vic3RyaW5nKDAsIHBvcykuc3BsaXQoJ1xcbicpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKHBhcnRzID0gbGluZVJFMy5leGVjKGxpbmVzW2ldKSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWYucmVwbGFjZSgvIy4qJC8sICcnKSxcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IHBhcnRzWzFdO1xuICAgICAgICAgICAgICAgIHZhciByZSA9IG5ldyBSZWdFeHAoZXNjYXBlQ29kZUFzUmVnRXhwRm9yTWF0Y2hpbmdJbnNpZGVIVE1MKGxpbmVzW2kgKyAxXSkpO1xuICAgICAgICAgICAgICAgIHNvdXJjZSA9IGZpbmRTb3VyY2VJblVybHMocmUsIFt1cmxdKTtcbiAgICAgICAgICAgICAgICBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICAndXJsJzogdXJsLFxuICAgICAgICAgICAgICAgICAgICAnbGluZSc6IHNvdXJjZSA/IHNvdXJjZS5saW5lIDogbGluZSxcbiAgICAgICAgICAgICAgICAgICAgJ2Z1bmMnOiAnJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtLmZ1bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5mdW5jID0gZ3Vlc3NGdW5jdGlvbk5hbWUoaXRlbS51cmwsIGl0ZW0ubGluZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gZ2F0aGVyQ29udGV4dChpdGVtLnVybCwgaXRlbS5saW5lKTtcbiAgICAgICAgICAgICAgICB2YXIgbWlkbGluZSA9IChjb250ZXh0ID8gY29udGV4dFtNYXRoLmZsb29yKGNvbnRleHQubGVuZ3RoIC8gMildIDogbnVsbCk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHQgJiYgbWlkbGluZS5yZXBsYWNlKC9eXFxzKi8sICcnKSA9PT0gbGluZXNbaSArIDFdLnJlcGxhY2UoL15cXHMqLywgJycpKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKGNvbnRleHQpIGFsZXJ0KFwiQ29udGV4dCBtaXNtYXRjaC4gQ29ycmVjdCBtaWRsaW5lOlxcblwiICsgbGluZXNbaSsxXSArIFwiXFxuXFxuTWlkbGluZTpcXG5cIiArIG1pZGxpbmUgKyBcIlxcblxcbkNvbnRleHQ6XFxuXCIgKyBjb250ZXh0LmpvaW4oXCJcXG5cIikgKyBcIlxcblxcblVSTDpcXG5cIiArIGl0ZW0udXJsKTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jb250ZXh0ID0gW2xpbmVzW2kgKyAxXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBjb3VsZCBub3QgcGFyc2UgbXVsdGlsaW5lIGV4Y2VwdGlvbiBtZXNzYWdlIGFzIE9wZXJhIHN0YWNrIHRyYWNlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgJ25hbWUnOiBleC5uYW1lLFxuICAgICAgICAgICAgJ21lc3NhZ2UnOiBsaW5lc1swXSxcbiAgICAgICAgICAgICd1cmwnOiBkb2N1bWVudC5sb2NhdGlvbi5ocmVmLFxuICAgICAgICAgICAgJ3N0YWNrJzogc3RhY2tcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBmaXJzdCBmcmFtZSB0byBpbmNvbXBsZXRlIHN0YWNrIHRyYWNlcy5cbiAgICAgKiBTYWZhcmkgYW5kIElFIHJlcXVpcmUgdGhpcyB0byBnZXQgY29tcGxldGUgZGF0YSBvbiB0aGUgZmlyc3QgZnJhbWUuXG4gICAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZywgKj59IHN0YWNrSW5mbyBTdGFjayB0cmFjZSBpbmZvcm1hdGlvbiBmcm9tXG4gICAgICogb25lIG9mIHRoZSBjb21wdXRlKiBtZXRob2RzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGhlIFVSTCBvZiB0aGUgc2NyaXB0IHRoYXQgY2F1c2VkIGFuIGVycm9yLlxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpfSBsaW5lTm8gVGhlIGxpbmUgbnVtYmVyIG9mIHRoZSBzY3JpcHQgdGhhdFxuICAgICAqIGNhdXNlZCBhbiBlcnJvci5cbiAgICAgKiBAcGFyYW0ge3N0cmluZz19IG1lc3NhZ2UgVGhlIGVycm9yIGdlbmVyYXRlZCBieSB0aGUgYnJvd3Nlciwgd2hpY2hcbiAgICAgKiBob3BlZnVsbHkgY29udGFpbnMgdGhlIG5hbWUgb2YgdGhlIG9iamVjdCB0aGF0IGNhdXNlZCB0aGUgZXJyb3IuXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIHN0YWNrIGluZm9ybWF0aW9uIHdhc1xuICAgICAqIGF1Z21lbnRlZC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhdWdtZW50U3RhY2tUcmFjZVdpdGhJbml0aWFsRWxlbWVudChzdGFja0luZm8sIHVybCwgbGluZU5vLCBtZXNzYWdlKSB7XG4gICAgICAgIHZhciBpbml0aWFsID0ge1xuICAgICAgICAgICAgJ3VybCc6IHVybCxcbiAgICAgICAgICAgICdsaW5lJzogbGluZU5vXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGluaXRpYWwudXJsICYmIGluaXRpYWwubGluZSkge1xuICAgICAgICAgICAgc3RhY2tJbmZvLmluY29tcGxldGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKCFpbml0aWFsLmZ1bmMpIHtcbiAgICAgICAgICAgICAgICBpbml0aWFsLmZ1bmMgPSBndWVzc0Z1bmN0aW9uTmFtZShpbml0aWFsLnVybCwgaW5pdGlhbC5saW5lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpbml0aWFsLmNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpbml0aWFsLmNvbnRleHQgPSBnYXRoZXJDb250ZXh0KGluaXRpYWwudXJsLCBpbml0aWFsLmxpbmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVmZXJlbmNlID0gLyAnKFteJ10rKScgLy5leGVjKG1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKHJlZmVyZW5jZSkge1xuICAgICAgICAgICAgICAgIGluaXRpYWwuY29sdW1uID0gZmluZFNvdXJjZUluTGluZShyZWZlcmVuY2VbMV0sIGluaXRpYWwudXJsLCBpbml0aWFsLmxpbmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3RhY2tJbmZvLnN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhY2tJbmZvLnN0YWNrWzBdLnVybCA9PT0gaW5pdGlhbC51cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YWNrSW5mby5zdGFja1swXS5saW5lID09PSBpbml0aWFsLmxpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gYWxyZWFkeSBpbiBzdGFjayB0cmFjZVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFzdGFja0luZm8uc3RhY2tbMF0ubGluZSAmJiBzdGFja0luZm8uc3RhY2tbMF0uZnVuYyA9PT0gaW5pdGlhbC5mdW5jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja0luZm8uc3RhY2tbMF0ubGluZSA9IGluaXRpYWwubGluZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrSW5mby5zdGFja1swXS5jb250ZXh0ID0gaW5pdGlhbC5jb250ZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGFja0luZm8uc3RhY2sudW5zaGlmdChpbml0aWFsKTtcbiAgICAgICAgICAgIHN0YWNrSW5mby5wYXJ0aWFsID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhY2tJbmZvLmluY29tcGxldGUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGVzIHN0YWNrIHRyYWNlIGluZm9ybWF0aW9uIGJ5IHdhbGtpbmcgdGhlIGFyZ3VtZW50cy5jYWxsZXJcbiAgICAgKiBjaGFpbiBhdCB0aGUgdGltZSB0aGUgZXhjZXB0aW9uIG9jY3VycmVkLiBUaGlzIHdpbGwgY2F1c2UgZWFybGllclxuICAgICAqIGZyYW1lcyB0byBiZSBtaXNzZWQgYnV0IGlzIHRoZSBvbmx5IHdheSB0byBnZXQgYW55IHN0YWNrIHRyYWNlIGluXG4gICAgICogU2FmYXJpIGFuZCBJRS4gVGhlIHRvcCBmcmFtZSBpcyByZXN0b3JlZCBieVxuICAgICAqIHtAbGluayBhdWdtZW50U3RhY2tUcmFjZVdpdGhJbml0aWFsRWxlbWVudH0uXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXhcbiAgICAgKiBAcmV0dXJuIHs/T2JqZWN0LjxzdHJpbmcsICo+fSBTdGFjayB0cmFjZSBpbmZvcm1hdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb21wdXRlU3RhY2tUcmFjZUJ5V2Fsa2luZ0NhbGxlckNoYWluKGV4LCBkZXB0aCkge1xuICAgICAgICB2YXIgZnVuY3Rpb25OYW1lID0gL2Z1bmN0aW9uXFxzKyhbXyRhLXpBLVpcXHhBMC1cXHVGRkZGXVtfJGEtekEtWjAtOVxceEEwLVxcdUZGRkZdKik/XFxzKlxcKC9pLFxuICAgICAgICAgICAgc3RhY2sgPSBbXSxcbiAgICAgICAgICAgIGZ1bmNzID0ge30sXG4gICAgICAgICAgICByZWN1cnNpb24gPSBmYWxzZSxcbiAgICAgICAgICAgIHBhcnRzLFxuICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgIHNvdXJjZTtcblxuICAgICAgICBmb3IgKHZhciBjdXJyID0gY29tcHV0ZVN0YWNrVHJhY2VCeVdhbGtpbmdDYWxsZXJDaGFpbi5jYWxsZXI7IGN1cnIgJiYgIXJlY3Vyc2lvbjsgY3VyciA9IGN1cnIuY2FsbGVyKSB7XG4gICAgICAgICAgICBpZiAoY3VyciA9PT0gY29tcHV0ZVN0YWNrVHJhY2UgfHwgY3VyciA9PT0gVHJhY2VLaXQucmVwb3J0KSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3NraXBwaW5nIGludGVybmFsIGZ1bmN0aW9uJyk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgJ3VybCc6IG51bGwsXG4gICAgICAgICAgICAgICAgJ2Z1bmMnOiBVTktOT1dOX0ZVTkNUSU9OLFxuICAgICAgICAgICAgICAgICdsaW5lJzogbnVsbCxcbiAgICAgICAgICAgICAgICAnY29sdW1uJzogbnVsbFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGN1cnIubmFtZSkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZnVuYyA9IGN1cnIubmFtZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKHBhcnRzID0gZnVuY3Rpb25OYW1lLmV4ZWMoY3Vyci50b1N0cmluZygpKSkpIHtcbiAgICAgICAgICAgICAgICBpdGVtLmZ1bmMgPSBwYXJ0c1sxXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKChzb3VyY2UgPSBmaW5kU291cmNlQnlGdW5jdGlvbkJvZHkoY3VycikpKSB7XG4gICAgICAgICAgICAgICAgaXRlbS51cmwgPSBzb3VyY2UudXJsO1xuICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9IHNvdXJjZS5saW5lO1xuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0uZnVuYyA9PT0gVU5LTk9XTl9GVU5DVElPTikge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmZ1bmMgPSBndWVzc0Z1bmN0aW9uTmFtZShpdGVtLnVybCwgaXRlbS5saW5lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVmZXJlbmNlID0gLyAnKFteJ10rKScgLy5leGVjKGV4Lm1lc3NhZ2UgfHwgZXguZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgIGlmIChyZWZlcmVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jb2x1bW4gPSBmaW5kU291cmNlSW5MaW5lKHJlZmVyZW5jZVsxXSwgc291cmNlLnVybCwgc291cmNlLmxpbmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZ1bmNzWycnICsgY3Vycl0pIHtcbiAgICAgICAgICAgICAgICByZWN1cnNpb24gPSB0cnVlO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgZnVuY3NbJycgKyBjdXJyXSA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YWNrLnB1c2goaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVwdGgpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdkZXB0aCBpcyAnICsgZGVwdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3N0YWNrIGlzICcgKyBzdGFjay5sZW5ndGgpO1xuICAgICAgICAgICAgc3RhY2suc3BsaWNlKDAsIGRlcHRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXN1bHQgPSB7XG4gICAgICAgICAgICAnbmFtZSc6IGV4Lm5hbWUsXG4gICAgICAgICAgICAnbWVzc2FnZSc6IGV4Lm1lc3NhZ2UsXG4gICAgICAgICAgICAndXJsJzogZG9jdW1lbnQubG9jYXRpb24uaHJlZixcbiAgICAgICAgICAgICdzdGFjayc6IHN0YWNrXG4gICAgICAgIH07XG4gICAgICAgIGF1Z21lbnRTdGFja1RyYWNlV2l0aEluaXRpYWxFbGVtZW50KHJlc3VsdCwgZXguc291cmNlVVJMIHx8IGV4LmZpbGVOYW1lLCBleC5saW5lIHx8IGV4LmxpbmVOdW1iZXIsIGV4Lm1lc3NhZ2UgfHwgZXguZGVzY3JpcHRpb24pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXB1dGVzIGEgc3RhY2sgdHJhY2UgZm9yIGFuIGV4Y2VwdGlvbi5cbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBleFxuICAgICAqIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpPX0gZGVwdGhcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb21wdXRlU3RhY2tUcmFjZShleCwgZGVwdGgpIHtcbiAgICAgICAgdmFyIHN0YWNrID0gbnVsbDtcbiAgICAgICAgZGVwdGggPSAoZGVwdGggPT0gbnVsbCA/IDAgOiArZGVwdGgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBUaGlzIG11c3QgYmUgdHJpZWQgZmlyc3QgYmVjYXVzZSBPcGVyYSAxMCAqZGVzdHJveXMqXG4gICAgICAgICAgICAvLyBpdHMgc3RhY2t0cmFjZSBwcm9wZXJ0eSBpZiB5b3UgdHJ5IHRvIGFjY2VzcyB0aGUgc3RhY2tcbiAgICAgICAgICAgIC8vIHByb3BlcnR5IGZpcnN0ISFcbiAgICAgICAgICAgIHN0YWNrID0gY29tcHV0ZVN0YWNrVHJhY2VGcm9tU3RhY2t0cmFjZVByb3AoZXgpO1xuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZGVidWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YWNrID0gY29tcHV0ZVN0YWNrVHJhY2VGcm9tU3RhY2tQcm9wKGV4KTtcbiAgICAgICAgICAgIGlmIChzdGFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGFjaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGRlYnVnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGFjayA9IGNvbXB1dGVTdGFja1RyYWNlRnJvbU9wZXJhTXVsdGlMaW5lTWVzc2FnZShleCk7XG4gICAgICAgICAgICBpZiAoc3RhY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChkZWJ1Zykge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhY2sgPSBjb21wdXRlU3RhY2tUcmFjZUJ5V2Fsa2luZ0NhbGxlckNoYWluKGV4LCBkZXB0aCArIDEpO1xuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZGVidWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvZ3MgYSBzdGFja3RyYWNlIHN0YXJ0aW5nIGZyb20gdGhlIHByZXZpb3VzIGNhbGwgYW5kIHdvcmtpbmcgZG93bi5cbiAgICAgKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKT19IGRlcHRoIEhvdyBtYW55IGZyYW1lcyBkZWVwIHRvIHRyYWNlLlxuICAgICAqIEByZXR1cm4ge09iamVjdC48c3RyaW5nLCAqPn0gU3RhY2sgdHJhY2UgaW5mb3JtYXRpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29tcHV0ZVN0YWNrVHJhY2VPZkNhbGxlcihkZXB0aCkge1xuICAgICAgICBkZXB0aCA9IChkZXB0aCA9PSBudWxsID8gMCA6ICtkZXB0aCkgKyAxOyAvLyBcIisgMVwiIGJlY2F1c2UgXCJvZkNhbGxlclwiIHNob3VsZCBkcm9wIG9uZSBmcmFtZVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gY29tcHV0ZVN0YWNrVHJhY2UoZXgsIGRlcHRoICsgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wdXRlU3RhY2tUcmFjZS5hdWdtZW50U3RhY2tUcmFjZVdpdGhJbml0aWFsRWxlbWVudCA9IGF1Z21lbnRTdGFja1RyYWNlV2l0aEluaXRpYWxFbGVtZW50O1xuICAgIGNvbXB1dGVTdGFja1RyYWNlLmd1ZXNzRnVuY3Rpb25OYW1lID0gZ3Vlc3NGdW5jdGlvbk5hbWU7XG4gICAgY29tcHV0ZVN0YWNrVHJhY2UuZ2F0aGVyQ29udGV4dCA9IGdhdGhlckNvbnRleHQ7XG4gICAgY29tcHV0ZVN0YWNrVHJhY2Uub2ZDYWxsZXIgPSBjb21wdXRlU3RhY2tUcmFjZU9mQ2FsbGVyO1xuXG4gICAgcmV0dXJuIGNvbXB1dGVTdGFja1RyYWNlO1xufSgpKTtcblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBGaXJzdCwgY2hlY2sgZm9yIEpTT04gc3VwcG9ydFxuLy8gSWYgdGhlcmUgaXMgbm8gSlNPTiwgd2Ugbm8tb3AgdGhlIGNvcmUgZmVhdHVyZXMgb2YgUmF2ZW5cbi8vIHNpbmNlIEpTT04gaXMgcmVxdWlyZWQgdG8gZW5jb2RlIHRoZSBwYXlsb2FkXG52YXIgX1JhdmVuID0gd2luZG93LlJhdmVuLFxuICAgIGhhc0pTT04gPSAhISh3aW5kb3cuSlNPTiAmJiB3aW5kb3cuSlNPTi5zdHJpbmdpZnkpLFxuICAgIGxhc3RDYXB0dXJlZEV4Y2VwdGlvbixcbiAgICBsYXN0RXZlbnRJZCxcbiAgICBnbG9iYWxTZXJ2ZXIsXG4gICAgZ2xvYmFsVXNlcixcbiAgICBnbG9iYWxLZXksXG4gICAgZ2xvYmFsUHJvamVjdCxcbiAgICBnbG9iYWxPcHRpb25zID0ge1xuICAgICAgICBsb2dnZXI6ICdqYXZhc2NyaXB0JyxcbiAgICAgICAgaWdub3JlRXJyb3JzOiBbXSxcbiAgICAgICAgaWdub3JlVXJsczogW10sXG4gICAgICAgIHdoaXRlbGlzdFVybHM6IFtdLFxuICAgICAgICBpbmNsdWRlUGF0aHM6IFtdLFxuICAgICAgICBjb2xsZWN0V2luZG93RXJyb3JzOiB0cnVlLFxuICAgICAgICB0YWdzOiB7fSxcbiAgICAgICAgZXh0cmE6IHt9XG4gICAgfSxcbiAgICBhdXRoUXVlcnlTdHJpbmcsXG4gICAgaXNSYXZlbkluc3RhbGxlZCA9IGZhbHNlO1xuXG4vKlxuICogVGhlIGNvcmUgUmF2ZW4gc2luZ2xldG9uXG4gKlxuICogQHRoaXMge1JhdmVufVxuICovXG52YXIgUmF2ZW4gPSB7XG4gICAgVkVSU0lPTjogJzEuMS4xNicsXG5cbiAgICBkZWJ1ZzogdHJ1ZSxcblxuICAgIC8qXG4gICAgICogQWxsb3cgbXVsdGlwbGUgdmVyc2lvbnMgb2YgUmF2ZW4gdG8gYmUgaW5zdGFsbGVkLlxuICAgICAqIFN0cmlwIFJhdmVuIGZyb20gdGhlIGdsb2JhbCBjb250ZXh0IGFuZCByZXR1cm5zIHRoZSBpbnN0YW5jZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1JhdmVufVxuICAgICAqL1xuICAgIG5vQ29uZmxpY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cuUmF2ZW4gPSBfUmF2ZW47XG4gICAgICAgIHJldHVybiBSYXZlbjtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBDb25maWd1cmUgUmF2ZW4gd2l0aCBhIERTTiBhbmQgZXh0cmEgb3B0aW9uc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRzbiBUaGUgcHVibGljIFNlbnRyeSBEU05cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBPcHRpb25hbCBzZXQgb2Ygb2YgZ2xvYmFsIG9wdGlvbnMgW29wdGlvbmFsXVxuICAgICAqIEByZXR1cm4ge1JhdmVufVxuICAgICAqL1xuICAgIGNvbmZpZzogZnVuY3Rpb24oZHNuLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChnbG9iYWxTZXJ2ZXIpIHtcbiAgICAgICAgICAgIGxvZ0RlYnVnKCdlcnJvcicsICdFcnJvcjogUmF2ZW4gaGFzIGFscmVhZHkgYmVlbiBjb25maWd1cmVkJyk7XG4gICAgICAgICAgICByZXR1cm4gUmF2ZW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkc24pIHJldHVybiBSYXZlbjtcblxuICAgICAgICB2YXIgdXJpID0gcGFyc2VEU04oZHNuKSxcbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IHVyaS5wYXRoLmxhc3RJbmRleE9mKCcvJyksXG4gICAgICAgICAgICBwYXRoID0gdXJpLnBhdGguc3Vic3RyKDEsIGxhc3RTbGFzaCk7XG5cbiAgICAgICAgLy8gbWVyZ2UgaW4gb3B0aW9uc1xuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgZWFjaChvcHRpb25zLCBmdW5jdGlvbihrZXksIHZhbHVlKXtcbiAgICAgICAgICAgICAgICBnbG9iYWxPcHRpb25zW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gXCJTY3JpcHQgZXJyb3IuXCIgaXMgaGFyZCBjb2RlZCBpbnRvIGJyb3dzZXJzIGZvciBlcnJvcnMgdGhhdCBpdCBjYW4ndCByZWFkLlxuICAgICAgICAvLyB0aGlzIGlzIHRoZSByZXN1bHQgb2YgYSBzY3JpcHQgYmVpbmcgcHVsbGVkIGluIGZyb20gYW4gZXh0ZXJuYWwgZG9tYWluIGFuZCBDT1JTLlxuICAgICAgICBnbG9iYWxPcHRpb25zLmlnbm9yZUVycm9ycy5wdXNoKCdTY3JpcHQgZXJyb3IuJyk7XG4gICAgICAgIGdsb2JhbE9wdGlvbnMuaWdub3JlRXJyb3JzLnB1c2goJ1NjcmlwdCBlcnJvcicpO1xuXG4gICAgICAgIC8vIE90aGVyIHZhcmlhbnRzIG9mIGV4dGVybmFsIHNjcmlwdCBlcnJvcnM6XG4gICAgICAgIGdsb2JhbE9wdGlvbnMuaWdub3JlRXJyb3JzLnB1c2goJ0phdmFzY3JpcHQgZXJyb3I6IFNjcmlwdCBlcnJvciBvbiBsaW5lIDAnKTtcbiAgICAgICAgZ2xvYmFsT3B0aW9ucy5pZ25vcmVFcnJvcnMucHVzaCgnSmF2YXNjcmlwdCBlcnJvcjogU2NyaXB0IGVycm9yLiBvbiBsaW5lIDAnKTtcblxuICAgICAgICAvLyBqb2luIHJlZ2V4cCBydWxlcyBpbnRvIG9uZSBiaWcgcnVsZVxuICAgICAgICBnbG9iYWxPcHRpb25zLmlnbm9yZUVycm9ycyA9IGpvaW5SZWdFeHAoZ2xvYmFsT3B0aW9ucy5pZ25vcmVFcnJvcnMpO1xuICAgICAgICBnbG9iYWxPcHRpb25zLmlnbm9yZVVybHMgPSBnbG9iYWxPcHRpb25zLmlnbm9yZVVybHMubGVuZ3RoID8gam9pblJlZ0V4cChnbG9iYWxPcHRpb25zLmlnbm9yZVVybHMpIDogZmFsc2U7XG4gICAgICAgIGdsb2JhbE9wdGlvbnMud2hpdGVsaXN0VXJscyA9IGdsb2JhbE9wdGlvbnMud2hpdGVsaXN0VXJscy5sZW5ndGggPyBqb2luUmVnRXhwKGdsb2JhbE9wdGlvbnMud2hpdGVsaXN0VXJscykgOiBmYWxzZTtcbiAgICAgICAgZ2xvYmFsT3B0aW9ucy5pbmNsdWRlUGF0aHMgPSBqb2luUmVnRXhwKGdsb2JhbE9wdGlvbnMuaW5jbHVkZVBhdGhzKTtcblxuICAgICAgICBnbG9iYWxLZXkgPSB1cmkudXNlcjtcbiAgICAgICAgZ2xvYmFsUHJvamVjdCA9IHVyaS5wYXRoLnN1YnN0cihsYXN0U2xhc2ggKyAxKTtcblxuICAgICAgICAvLyBhc3NlbWJsZSB0aGUgZW5kcG9pbnQgZnJvbSB0aGUgdXJpIHBpZWNlc1xuICAgICAgICBnbG9iYWxTZXJ2ZXIgPSAnLy8nICsgdXJpLmhvc3QgK1xuICAgICAgICAgICAgICAgICAgICAgICh1cmkucG9ydCA/ICc6JyArIHVyaS5wb3J0IDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAnLycgKyBwYXRoICsgJ2FwaS8nICsgZ2xvYmFsUHJvamVjdCArICcvc3RvcmUvJztcblxuICAgICAgICBpZiAodXJpLnByb3RvY29sKSB7XG4gICAgICAgICAgICBnbG9iYWxTZXJ2ZXIgPSB1cmkucHJvdG9jb2wgKyAnOicgKyBnbG9iYWxTZXJ2ZXI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZ2xvYmFsT3B0aW9ucy5mZXRjaENvbnRleHQpIHtcbiAgICAgICAgICAgIFRyYWNlS2l0LnJlbW90ZUZldGNoaW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnbG9iYWxPcHRpb25zLmxpbmVzT2ZDb250ZXh0KSB7XG4gICAgICAgICAgICBUcmFjZUtpdC5saW5lc09mQ29udGV4dCA9IGdsb2JhbE9wdGlvbnMubGluZXNPZkNvbnRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICBUcmFjZUtpdC5jb2xsZWN0V2luZG93RXJyb3JzID0gISFnbG9iYWxPcHRpb25zLmNvbGxlY3RXaW5kb3dFcnJvcnM7XG5cbiAgICAgICAgc2V0QXV0aFF1ZXJ5U3RyaW5nKCk7XG5cbiAgICAgICAgLy8gcmV0dXJuIGZvciBjaGFpbmluZ1xuICAgICAgICByZXR1cm4gUmF2ZW47XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogSW5zdGFsbHMgYSBnbG9iYWwgd2luZG93Lm9uZXJyb3IgZXJyb3IgaGFuZGxlclxuICAgICAqIHRvIGNhcHR1cmUgYW5kIHJlcG9ydCB1bmNhdWdodCBleGNlcHRpb25zLlxuICAgICAqIEF0IHRoaXMgcG9pbnQsIGluc3RhbGwoKSBpcyByZXF1aXJlZCB0byBiZSBjYWxsZWQgZHVlXG4gICAgICogdG8gdGhlIHdheSBUcmFjZUtpdCBpcyBzZXQgdXAuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtSYXZlbn1cbiAgICAgKi9cbiAgICBpbnN0YWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGlzU2V0dXAoKSAmJiAhaXNSYXZlbkluc3RhbGxlZCkge1xuICAgICAgICAgICAgVHJhY2VLaXQucmVwb3J0LnN1YnNjcmliZShoYW5kbGVTdGFja0luZm8pO1xuICAgICAgICAgICAgaXNSYXZlbkluc3RhbGxlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUmF2ZW47XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogV3JhcCBjb2RlIHdpdGhpbiBhIGNvbnRleHQgc28gUmF2ZW4gY2FuIGNhcHR1cmUgZXJyb3JzXG4gICAgICogcmVsaWFibHkgYWNyb3NzIGRvbWFpbnMgdGhhdCBpcyBleGVjdXRlZCBpbW1lZGlhdGVseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIEEgc3BlY2lmaWMgc2V0IG9mIG9wdGlvbnMgZm9yIHRoaXMgY29udGV4dCBbb3B0aW9uYWxdXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZnVuYyBUaGUgY2FsbGJhY2sgdG8gYmUgaW1tZWRpYXRlbHkgZXhlY3V0ZWQgd2l0aGluIHRoZSBjb250ZXh0XG4gICAgICogQHBhcmFtIHthcnJheX0gYXJncyBBbiBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgY2FsbGVkIHdpdGggdGhlIGNhbGxiYWNrIFtvcHRpb25hbF1cbiAgICAgKi9cbiAgICBjb250ZXh0OiBmdW5jdGlvbihvcHRpb25zLCBmdW5jLCBhcmdzKSB7XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBhcmdzID0gZnVuYyB8fCBbXTtcbiAgICAgICAgICAgIGZ1bmMgPSBvcHRpb25zO1xuICAgICAgICAgICAgb3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBSYXZlbi53cmFwKG9wdGlvbnMsIGZ1bmMpLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIFdyYXAgY29kZSB3aXRoaW4gYSBjb250ZXh0IGFuZCByZXR1cm5zIGJhY2sgYSBuZXcgZnVuY3Rpb24gdG8gYmUgZXhlY3V0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIEEgc3BlY2lmaWMgc2V0IG9mIG9wdGlvbnMgZm9yIHRoaXMgY29udGV4dCBbb3B0aW9uYWxdXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gYmUgd3JhcHBlZCBpbiBhIG5ldyBjb250ZXh0XG4gICAgICogQHJldHVybiB7ZnVuY3Rpb259IFRoZSBuZXdseSB3cmFwcGVkIGZ1bmN0aW9ucyB3aXRoIGEgY29udGV4dFxuICAgICAqL1xuICAgIHdyYXA6IGZ1bmN0aW9uKG9wdGlvbnMsIGZ1bmMpIHtcbiAgICAgICAgLy8gMSBhcmd1bWVudCBoYXMgYmVlbiBwYXNzZWQsIGFuZCBpdCdzIG5vdCBhIGZ1bmN0aW9uXG4gICAgICAgIC8vIHNvIGp1c3QgcmV0dXJuIGl0XG4gICAgICAgIGlmIChpc1VuZGVmaW5lZChmdW5jKSAmJiAhaXNGdW5jdGlvbihvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBvcHRpb25zIGlzIG9wdGlvbmFsXG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBmdW5jID0gb3B0aW9ucztcbiAgICAgICAgICAgIG9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSd2ZSBwYXNzZWQgYWxvbmcgMiBhcmd1bWVudHMsIGFuZCB0aGUgc2Vjb25kIG9uZVxuICAgICAgICAvLyBpcyBub3QgYSBmdW5jdGlvbiBlaXRoZXIsIHNvIHdlJ2xsIGp1c3QgcmV0dXJuIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihmdW5jKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBkb24ndCB3YW5uYSB3cmFwIGl0IHR3aWNlIVxuICAgICAgICBpZiAoZnVuYy5fX3JhdmVuX18pIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gd3JhcHBlZCgpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW10sIGkgPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGRlZXAgPSAhb3B0aW9ucyB8fCBvcHRpb25zICYmIG9wdGlvbnMuZGVlcCAhPT0gZmFsc2U7XG4gICAgICAgICAgICAvLyBSZWN1cnNpdmVseSB3cmFwIGFsbCBvZiBhIGZ1bmN0aW9uJ3MgYXJndW1lbnRzIHRoYXQgYXJlXG4gICAgICAgICAgICAvLyBmdW5jdGlvbnMgdGhlbXNlbHZlcy5cblxuICAgICAgICAgICAgd2hpbGUoaS0tKSBhcmdzW2ldID0gZGVlcCA/IFJhdmVuLndyYXAob3B0aW9ucywgYXJndW1lbnRzW2ldKSA6IGFyZ3VtZW50c1tpXTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvKmpzaGludCAtVzA0MCovXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICBSYXZlbi5jYXB0dXJlRXhjZXB0aW9uKGUsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb3B5IG92ZXIgcHJvcGVydGllcyBvZiB0aGUgb2xkIGZ1bmN0aW9uXG4gICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIGZ1bmMpIHtcbiAgICAgICAgICAgIGlmIChoYXNLZXkoZnVuYywgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgd3JhcHBlZFtwcm9wZXJ0eV0gPSBmdW5jW3Byb3BlcnR5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNpZ25hbCB0aGF0IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gd3JhcHBlZCBhbHJlYWR5XG4gICAgICAgIC8vIGZvciBib3RoIGRlYnVnZ2luZyBhbmQgdG8gcHJldmVudCBpdCB0byBiZWluZyB3cmFwcGVkIHR3aWNlXG4gICAgICAgIHdyYXBwZWQuX19yYXZlbl9fID0gdHJ1ZTtcbiAgICAgICAgd3JhcHBlZC5fX2lubmVyX18gPSBmdW5jO1xuXG4gICAgICAgIHJldHVybiB3cmFwcGVkO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIFVuaW5zdGFsbHMgdGhlIGdsb2JhbCBlcnJvciBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHJldHVybiB7UmF2ZW59XG4gICAgICovXG4gICAgdW5pbnN0YWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgVHJhY2VLaXQucmVwb3J0LnVuaW5zdGFsbCgpO1xuICAgICAgICBpc1JhdmVuSW5zdGFsbGVkID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIFJhdmVuO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIE1hbnVhbGx5IGNhcHR1cmUgYW4gZXhjZXB0aW9uIGFuZCBzZW5kIGl0IG92ZXIgdG8gU2VudHJ5XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Vycm9yfSBleCBBbiBleGNlcHRpb24gdG8gYmUgbG9nZ2VkXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBzcGVjaWZpYyBzZXQgb2Ygb3B0aW9ucyBmb3IgdGhpcyBlcnJvciBbb3B0aW9uYWxdXG4gICAgICogQHJldHVybiB7UmF2ZW59XG4gICAgICovXG4gICAgY2FwdHVyZUV4Y2VwdGlvbjogZnVuY3Rpb24oZXgsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gSWYgbm90IGFuIEVycm9yIGlzIHBhc3NlZCB0aHJvdWdoLCByZWNhbGwgYXMgYSBtZXNzYWdlIGluc3RlYWRcbiAgICAgICAgaWYgKCEoZXggaW5zdGFuY2VvZiBFcnJvcikpIHJldHVybiBSYXZlbi5jYXB0dXJlTWVzc2FnZShleCwgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gU3RvcmUgdGhlIHJhdyBleGNlcHRpb24gb2JqZWN0IGZvciBwb3RlbnRpYWwgZGVidWdnaW5nIGFuZCBpbnRyb3NwZWN0aW9uXG4gICAgICAgIGxhc3RDYXB0dXJlZEV4Y2VwdGlvbiA9IGV4O1xuXG4gICAgICAgIC8vIFRyYWNlS2l0LnJlcG9ydCB3aWxsIHJlLXJhaXNlIGFueSBleGNlcHRpb24gcGFzc2VkIHRvIGl0LFxuICAgICAgICAvLyB3aGljaCBtZWFucyB5b3UgaGF2ZSB0byB3cmFwIGl0IGluIHRyeS9jYXRjaC4gSW5zdGVhZCwgd2VcbiAgICAgICAgLy8gY2FuIHdyYXAgaXQgaGVyZSBhbmQgb25seSByZS1yYWlzZSBpZiBUcmFjZUtpdC5yZXBvcnRcbiAgICAgICAgLy8gcmFpc2VzIGFuIGV4Y2VwdGlvbiBkaWZmZXJlbnQgZnJvbSB0aGUgb25lIHdlIGFza2VkIHRvXG4gICAgICAgIC8vIHJlcG9ydCBvbi5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIFRyYWNlS2l0LnJlcG9ydChleCwgb3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2goZXgxKSB7XG4gICAgICAgICAgICBpZihleCAhPT0gZXgxKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXgxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFJhdmVuO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIE1hbnVhbGx5IHNlbmQgYSBtZXNzYWdlIHRvIFNlbnRyeVxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1zZyBBIHBsYWluIG1lc3NhZ2UgdG8gYmUgY2FwdHVyZWQgaW4gU2VudHJ5XG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBzcGVjaWZpYyBzZXQgb2Ygb3B0aW9ucyBmb3IgdGhpcyBtZXNzYWdlIFtvcHRpb25hbF1cbiAgICAgKiBAcmV0dXJuIHtSYXZlbn1cbiAgICAgKi9cbiAgICBjYXB0dXJlTWVzc2FnZTogZnVuY3Rpb24obXNnLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIEZpcmUgYXdheSFcbiAgICAgICAgc2VuZChcbiAgICAgICAgICAgIG9iamVjdE1lcmdlKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBtc2cgKyAnJyAgLy8gTWFrZSBzdXJlIGl0J3MgYWN0dWFsbHkgYSBzdHJpbmdcbiAgICAgICAgICAgIH0sIG9wdGlvbnMpXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIFJhdmVuO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIFNldC9jbGVhciBhIHVzZXIgdG8gYmUgc2VudCBhbG9uZyB3aXRoIHRoZSBwYXlsb2FkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHVzZXIgQW4gb2JqZWN0IHJlcHJlc2VudGluZyB1c2VyIGRhdGEgW29wdGlvbmFsXVxuICAgICAqIEByZXR1cm4ge1JhdmVufVxuICAgICAqL1xuICAgIHNldFVzZXJDb250ZXh0OiBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgZ2xvYmFsVXNlciA9IHVzZXI7XG5cbiAgICAgICByZXR1cm4gUmF2ZW47XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogU2V0IGV4dHJhIGF0dHJpYnV0ZXMgdG8gYmUgc2VudCBhbG9uZyB3aXRoIHRoZSBwYXlsb2FkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV4dHJhIEFuIG9iamVjdCByZXByZXNlbnRpbmcgZXh0cmEgZGF0YSBbb3B0aW9uYWxdXG4gICAgICogQHJldHVybiB7UmF2ZW59XG4gICAgICovXG4gICAgc2V0RXh0cmFDb250ZXh0OiBmdW5jdGlvbihleHRyYSkge1xuICAgICAgIGdsb2JhbE9wdGlvbnMuZXh0cmEgPSBleHRyYSB8fCB7fTtcblxuICAgICAgIHJldHVybiBSYXZlbjtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBTZXQgdGFncyB0byBiZSBzZW50IGFsb25nIHdpdGggdGhlIHBheWxvYWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdGFncyBBbiBvYmplY3QgcmVwcmVzZW50aW5nIHRhZ3MgW29wdGlvbmFsXVxuICAgICAqIEByZXR1cm4ge1JhdmVufVxuICAgICAqL1xuICAgIHNldFRhZ3NDb250ZXh0OiBmdW5jdGlvbih0YWdzKSB7XG4gICAgICAgZ2xvYmFsT3B0aW9ucy50YWdzID0gdGFncyB8fCB7fTtcblxuICAgICAgIHJldHVybiBSYXZlbjtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBHZXQgdGhlIGxhdGVzdCByYXcgZXhjZXB0aW9uIHRoYXQgd2FzIGNhcHR1cmVkIGJ5IFJhdmVuLlxuICAgICAqXG4gICAgICogQHJldHVybiB7ZXJyb3J9XG4gICAgICovXG4gICAgbGFzdEV4Y2VwdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBsYXN0Q2FwdHVyZWRFeGNlcHRpb247XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogR2V0IHRoZSBsYXN0IGV2ZW50IGlkXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgbGFzdEV2ZW50SWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbGFzdEV2ZW50SWQ7XG4gICAgfVxufTtcblxuUmF2ZW4uc2V0VXNlciA9IFJhdmVuLnNldFVzZXJDb250ZXh0OyAvLyBUbyBiZSBkZXByZWNhdGVkXG5cbmZ1bmN0aW9uIHRyaWdnZXJFdmVudChldmVudFR5cGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgZXZlbnQsIGtleTtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgZXZlbnRUeXBlID0gJ3JhdmVuJyArIGV2ZW50VHlwZS5zdWJzdHIoMCwxKS50b1VwcGVyQ2FzZSgpICsgZXZlbnRUeXBlLnN1YnN0cigxKTtcblxuICAgIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuICAgICAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJyk7XG4gICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudFR5cGUsIHRydWUsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKTtcbiAgICAgICAgZXZlbnQuZXZlbnRUeXBlID0gZXZlbnRUeXBlO1xuICAgIH1cblxuICAgIGZvciAoa2V5IGluIG9wdGlvbnMpIGlmIChoYXNLZXkob3B0aW9ucywga2V5KSkge1xuICAgICAgICBldmVudFtrZXldID0gb3B0aW9uc1trZXldO1xuICAgIH1cblxuICAgIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuICAgICAgICAvLyBJRTkgaWYgc3RhbmRhcmRzXG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElFOCByZWdhcmRsZXNzIG9mIFF1aXJrcyBvciBTdGFuZGFyZHNcbiAgICAgICAgLy8gSUU5IGlmIHF1aXJrc1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZG9jdW1lbnQuZmlyZUV2ZW50KCdvbicgKyBldmVudC5ldmVudFR5cGUudG9Mb3dlckNhc2UoKSwgZXZlbnQpO1xuICAgICAgICB9IGNhdGNoKGUpIHt9XG4gICAgfVxufVxuXG52YXIgZHNuS2V5cyA9ICdzb3VyY2UgcHJvdG9jb2wgdXNlciBwYXNzIGhvc3QgcG9ydCBwYXRoJy5zcGxpdCgnICcpLFxuICAgIGRzblBhdHRlcm4gPSAvXig/OihcXHcrKTopP1xcL1xcLyhcXHcrKSg6XFx3Kyk/QChbXFx3XFwuLV0rKSg/OjooXFxkKykpPyhcXC8uKikvO1xuXG5mdW5jdGlvbiBSYXZlbkNvbmZpZ0Vycm9yKG1lc3NhZ2UpIHtcbiAgICB0aGlzLm5hbWUgPSAnUmF2ZW5Db25maWdFcnJvcic7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbn1cblJhdmVuQ29uZmlnRXJyb3IucHJvdG90eXBlID0gbmV3IEVycm9yKCk7XG5SYXZlbkNvbmZpZ0Vycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJhdmVuQ29uZmlnRXJyb3I7XG5cbi8qKioqIFByaXZhdGUgZnVuY3Rpb25zICoqKiovXG5mdW5jdGlvbiBwYXJzZURTTihzdHIpIHtcbiAgICB2YXIgbSA9IGRzblBhdHRlcm4uZXhlYyhzdHIpLFxuICAgICAgICBkc24gPSB7fSxcbiAgICAgICAgaSA9IDc7XG5cbiAgICB0cnkge1xuICAgICAgICB3aGlsZSAoaS0tKSBkc25bZHNuS2V5c1tpXV0gPSBtW2ldIHx8ICcnO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgICB0aHJvdyBuZXcgUmF2ZW5Db25maWdFcnJvcignSW52YWxpZCBEU046ICcgKyBzdHIpO1xuICAgIH1cblxuICAgIGlmIChkc24ucGFzcylcbiAgICAgICAgdGhyb3cgbmV3IFJhdmVuQ29uZmlnRXJyb3IoJ0RvIG5vdCBzcGVjaWZ5IHlvdXIgcHJpdmF0ZSBrZXkgaW4gdGhlIERTTiEnKTtcblxuICAgIHJldHVybiBkc247XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKHdoYXQpIHtcbiAgICByZXR1cm4gdHlwZW9mIHdoYXQgPT09ICd1bmRlZmluZWQnO1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHdoYXQpIHtcbiAgICByZXR1cm4gdHlwZW9mIHdoYXQgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKHdoYXQpIHtcbiAgICByZXR1cm4gdHlwZW9mIHdoYXQgPT09ICdzdHJpbmcnO1xufVxuXG5mdW5jdGlvbiBpc0VtcHR5T2JqZWN0KHdoYXQpIHtcbiAgICBmb3IgKHZhciBrIGluIHdoYXQpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBoYXNLZXksIGEgYmV0dGVyIGZvcm0gb2YgaGFzT3duUHJvcGVydHlcbiAqIEV4YW1wbGU6IGhhc0tleShNYWluSG9zdE9iamVjdCwgcHJvcGVydHkpID09PSB0cnVlL2ZhbHNlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGhvc3Qgb2JqZWN0IHRvIGNoZWNrIHByb3BlcnR5XG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRvIGNoZWNrXG4gKi9cbmZ1bmN0aW9uIGhhc0tleShvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpO1xufVxuXG5mdW5jdGlvbiBlYWNoKG9iaiwgY2FsbGJhY2spIHtcbiAgICB2YXIgaSwgajtcblxuICAgIGlmIChpc1VuZGVmaW5lZChvYmoubGVuZ3RoKSkge1xuICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoaGFzS2V5KG9iaiwgaSkpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKG51bGwsIGksIG9ialtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBqID0gb2JqLmxlbmd0aDtcbiAgICAgICAgaWYgKGopIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKG51bGwsIGksIG9ialtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuZnVuY3Rpb24gc2V0QXV0aFF1ZXJ5U3RyaW5nKCkge1xuICAgIGF1dGhRdWVyeVN0cmluZyA9XG4gICAgICAgICc/c2VudHJ5X3ZlcnNpb249NCcgK1xuICAgICAgICAnJnNlbnRyeV9jbGllbnQ9cmF2ZW4tanMvJyArIFJhdmVuLlZFUlNJT04gK1xuICAgICAgICAnJnNlbnRyeV9rZXk9JyArIGdsb2JhbEtleTtcbn1cblxuXG5mdW5jdGlvbiBoYW5kbGVTdGFja0luZm8oc3RhY2tJbmZvLCBvcHRpb25zKSB7XG4gICAgdmFyIGZyYW1lcyA9IFtdO1xuXG4gICAgaWYgKHN0YWNrSW5mby5zdGFjayAmJiBzdGFja0luZm8uc3RhY2subGVuZ3RoKSB7XG4gICAgICAgIGVhY2goc3RhY2tJbmZvLnN0YWNrLCBmdW5jdGlvbihpLCBzdGFjaykge1xuICAgICAgICAgICAgdmFyIGZyYW1lID0gbm9ybWFsaXplRnJhbWUoc3RhY2spO1xuICAgICAgICAgICAgaWYgKGZyYW1lKSB7XG4gICAgICAgICAgICAgICAgZnJhbWVzLnB1c2goZnJhbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB0cmlnZ2VyRXZlbnQoJ2hhbmRsZScsIHtcbiAgICAgICAgc3RhY2tJbmZvOiBzdGFja0luZm8sXG4gICAgICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgICB9KTtcblxuICAgIHByb2Nlc3NFeGNlcHRpb24oXG4gICAgICAgIHN0YWNrSW5mby5uYW1lLFxuICAgICAgICBzdGFja0luZm8ubWVzc2FnZSxcbiAgICAgICAgc3RhY2tJbmZvLnVybCxcbiAgICAgICAgc3RhY2tJbmZvLmxpbmVubyxcbiAgICAgICAgZnJhbWVzLFxuICAgICAgICBvcHRpb25zXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRnJhbWUoZnJhbWUpIHtcbiAgICBpZiAoIWZyYW1lLnVybCkgcmV0dXJuO1xuXG4gICAgLy8gbm9ybWFsaXplIHRoZSBmcmFtZXMgZGF0YVxuICAgIHZhciBub3JtYWxpemVkID0ge1xuICAgICAgICBmaWxlbmFtZTogICBmcmFtZS51cmwsXG4gICAgICAgIGxpbmVubzogICAgIGZyYW1lLmxpbmUsXG4gICAgICAgIGNvbG5vOiAgICAgIGZyYW1lLmNvbHVtbixcbiAgICAgICAgJ2Z1bmN0aW9uJzogZnJhbWUuZnVuYyB8fCAnPydcbiAgICB9LCBjb250ZXh0ID0gZXh0cmFjdENvbnRleHRGcm9tRnJhbWUoZnJhbWUpLCBpO1xuXG4gICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGtleXMgPSBbJ3ByZV9jb250ZXh0JywgJ2NvbnRleHRfbGluZScsICdwb3N0X2NvbnRleHQnXTtcbiAgICAgICAgaSA9IDM7XG4gICAgICAgIHdoaWxlIChpLS0pIG5vcm1hbGl6ZWRba2V5c1tpXV0gPSBjb250ZXh0W2ldO1xuICAgIH1cblxuICAgIG5vcm1hbGl6ZWQuaW5fYXBwID0gISggLy8gZGV0ZXJtaW5lIGlmIGFuIGV4Y2VwdGlvbiBjYW1lIGZyb20gb3V0c2lkZSBvZiBvdXIgYXBwXG4gICAgICAgIC8vIGZpcnN0IHdlIGNoZWNrIHRoZSBnbG9iYWwgaW5jbHVkZVBhdGhzIGxpc3QuXG4gICAgICAgICFnbG9iYWxPcHRpb25zLmluY2x1ZGVQYXRocy50ZXN0KG5vcm1hbGl6ZWQuZmlsZW5hbWUpIHx8XG4gICAgICAgIC8vIE5vdyB3ZSBjaGVjayBmb3IgZnVuLCBpZiB0aGUgZnVuY3Rpb24gbmFtZSBpcyBSYXZlbiBvciBUcmFjZUtpdFxuICAgICAgICAvKFJhdmVufFRyYWNlS2l0KVxcLi8udGVzdChub3JtYWxpemVkWydmdW5jdGlvbiddKSB8fFxuICAgICAgICAvLyBmaW5hbGx5LCB3ZSBkbyBhIGxhc3QgZGl0Y2ggZWZmb3J0IGFuZCBjaGVjayBmb3IgcmF2ZW4ubWluLmpzXG4gICAgICAgIC9yYXZlblxcLihtaW5cXC4pP2pzJC8udGVzdChub3JtYWxpemVkLmZpbGVuYW1lKVxuICAgICk7XG5cbiAgICByZXR1cm4gbm9ybWFsaXplZDtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdENvbnRleHRGcm9tRnJhbWUoZnJhbWUpIHtcbiAgICAvLyBpbW1lZGlhdGVseSBjaGVjayBpZiB3ZSBzaG91bGQgZXZlbiBhdHRlbXB0IHRvIHBhcnNlIGEgY29udGV4dFxuICAgIGlmICghZnJhbWUuY29udGV4dCB8fCAhZ2xvYmFsT3B0aW9ucy5mZXRjaENvbnRleHQpIHJldHVybjtcblxuICAgIHZhciBjb250ZXh0ID0gZnJhbWUuY29udGV4dCxcbiAgICAgICAgcGl2b3QgPSB+fihjb250ZXh0Lmxlbmd0aCAvIDIpLFxuICAgICAgICBpID0gY29udGV4dC5sZW5ndGgsIGlzTWluaWZpZWQgPSBmYWxzZTtcblxuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgLy8gV2UncmUgbWFraW5nIGEgZ3Vlc3MgdG8gc2VlIGlmIHRoZSBzb3VyY2UgaXMgbWluaWZpZWQgb3Igbm90LlxuICAgICAgICAvLyBUbyBkbyB0aGF0LCB3ZSBtYWtlIHRoZSBhc3N1bXB0aW9uIGlmICphbnkqIG9mIHRoZSBsaW5lcyBwYXNzZWRcbiAgICAgICAgLy8gaW4gYXJlIGdyZWF0ZXIgdGhhbiAzMDAgY2hhcmFjdGVycyBsb25nLCB3ZSBiYWlsLlxuICAgICAgICAvLyBTZW50cnkgd2lsbCBzZWUgdGhhdCB0aGVyZSBpc24ndCBhIGNvbnRleHRcbiAgICAgICAgaWYgKGNvbnRleHRbaV0ubGVuZ3RoID4gMzAwKSB7XG4gICAgICAgICAgICBpc01pbmlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzTWluaWZpZWQpIHtcbiAgICAgICAgLy8gVGhlIHNvdXJjZSBpcyBtaW5pZmllZCBhbmQgd2UgZG9uJ3Qga25vdyB3aGljaCBjb2x1bW4uIEZ1Y2sgaXQuXG4gICAgICAgIGlmIChpc1VuZGVmaW5lZChmcmFtZS5jb2x1bW4pKSByZXR1cm47XG5cbiAgICAgICAgLy8gSWYgdGhlIHNvdXJjZSBpcyBtaW5pZmllZCBhbmQgaGFzIGEgZnJhbWUgY29sdW1uXG4gICAgICAgIC8vIHdlIHRha2UgYSBjaHVuayBvZiB0aGUgb2ZmZW5kaW5nIGxpbmUgdG8gaG9wZWZ1bGx5IHNoZWQgc29tZSBsaWdodFxuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgW10sICAvLyBubyBwcmVfY29udGV4dFxuICAgICAgICAgICAgY29udGV4dFtwaXZvdF0uc3Vic3RyKGZyYW1lLmNvbHVtbiwgNTApLCAvLyBncmFiIDUwIGNoYXJhY3RlcnMsIHN0YXJ0aW5nIGF0IHRoZSBvZmZlbmRpbmcgY29sdW1uXG4gICAgICAgICAgICBbXSAgIC8vIG5vIHBvc3RfY29udGV4dFxuICAgICAgICBdO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICAgIGNvbnRleHQuc2xpY2UoMCwgcGl2b3QpLCAgICAvLyBwcmVfY29udGV4dFxuICAgICAgICBjb250ZXh0W3Bpdm90XSwgICAgICAgICAgICAgLy8gY29udGV4dF9saW5lXG4gICAgICAgIGNvbnRleHQuc2xpY2UocGl2b3QgKyAxKSAgICAvLyBwb3N0X2NvbnRleHRcbiAgICBdO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzRXhjZXB0aW9uKHR5cGUsIG1lc3NhZ2UsIGZpbGV1cmwsIGxpbmVubywgZnJhbWVzLCBvcHRpb25zKSB7XG4gICAgdmFyIHN0YWNrdHJhY2UsIGxhYmVsLCBpO1xuXG4gICAgLy8gSW4gc29tZSBpbnN0YW5jZXMgbWVzc2FnZSBpcyBub3QgYWN0dWFsbHkgYSBzdHJpbmcsIG5vIGlkZWEgd2h5LFxuICAgIC8vIHNvIHdlIHdhbnQgdG8gYWx3YXlzIGNvZXJjZSBpdCB0byBvbmUuXG4gICAgbWVzc2FnZSArPSAnJztcblxuICAgIC8vIFNvbWV0aW1lcyBhbiBleGNlcHRpb24gaXMgZ2V0dGluZyBsb2dnZWQgaW4gU2VudHJ5IGFzXG4gICAgLy8gPG5vIG1lc3NhZ2UgdmFsdWU+XG4gICAgLy8gVGhpcyBjYW4gb25seSBtZWFuIHRoYXQgdGhlIG1lc3NhZ2Ugd2FzIGZhbHNleSBzaW5jZSB0aGlzIHZhbHVlXG4gICAgLy8gaXMgaGFyZGNvZGVkIGludG8gU2VudHJ5IGl0c2VsZi5cbiAgICAvLyBBdCB0aGlzIHBvaW50LCBpZiB0aGUgbWVzc2FnZSBpcyBmYWxzZXksIHdlIGJhaWwgc2luY2UgaXQncyB1c2VsZXNzXG4gICAgaWYgKHR5cGUgPT09ICdFcnJvcicgJiYgIW1lc3NhZ2UpIHJldHVybjtcblxuICAgIGlmIChnbG9iYWxPcHRpb25zLmlnbm9yZUVycm9ycy50ZXN0KG1lc3NhZ2UpKSByZXR1cm47XG5cbiAgICBpZiAoZnJhbWVzICYmIGZyYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgZmlsZXVybCA9IGZyYW1lc1swXS5maWxlbmFtZSB8fCBmaWxldXJsO1xuICAgICAgICAvLyBTZW50cnkgZXhwZWN0cyBmcmFtZXMgb2xkZXN0IHRvIG5ld2VzdFxuICAgICAgICAvLyBhbmQgSlMgc2VuZHMgdGhlbSBhcyBuZXdlc3QgdG8gb2xkZXN0XG4gICAgICAgIGZyYW1lcy5yZXZlcnNlKCk7XG4gICAgICAgIHN0YWNrdHJhY2UgPSB7ZnJhbWVzOiBmcmFtZXN9O1xuICAgIH0gZWxzZSBpZiAoZmlsZXVybCkge1xuICAgICAgICBzdGFja3RyYWNlID0ge1xuICAgICAgICAgICAgZnJhbWVzOiBbe1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxldXJsLFxuICAgICAgICAgICAgICAgIGxpbmVubzogbGluZW5vLFxuICAgICAgICAgICAgICAgIGluX2FwcDogdHJ1ZVxuICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBUcnVuY2F0ZSB0aGUgbWVzc2FnZSB0byBhIG1heCBvZiBjaGFyYWN0ZXJzXG4gICAgbWVzc2FnZSA9IHRydW5jYXRlKG1lc3NhZ2UsIDEwMCk7XG5cbiAgICBpZiAoZ2xvYmFsT3B0aW9ucy5pZ25vcmVVcmxzICYmIGdsb2JhbE9wdGlvbnMuaWdub3JlVXJscy50ZXN0KGZpbGV1cmwpKSByZXR1cm47XG4gICAgaWYgKGdsb2JhbE9wdGlvbnMud2hpdGVsaXN0VXJscyAmJiAhZ2xvYmFsT3B0aW9ucy53aGl0ZWxpc3RVcmxzLnRlc3QoZmlsZXVybCkpIHJldHVybjtcblxuICAgIGxhYmVsID0gbGluZW5vID8gbWVzc2FnZSArICcgYXQgJyArIGxpbmVubyA6IG1lc3NhZ2U7XG5cbiAgICAvLyBGaXJlIGF3YXkhXG4gICAgc2VuZChcbiAgICAgICAgb2JqZWN0TWVyZ2Uoe1xuICAgICAgICAgICAgLy8gc2VudHJ5LmludGVyZmFjZXMuRXhjZXB0aW9uXG4gICAgICAgICAgICBleGNlcHRpb246IHtcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBtZXNzYWdlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gc2VudHJ5LmludGVyZmFjZXMuU3RhY2t0cmFjZVxuICAgICAgICAgICAgc3RhY2t0cmFjZTogc3RhY2t0cmFjZSxcbiAgICAgICAgICAgIGN1bHByaXQ6IGZpbGV1cmwsXG4gICAgICAgICAgICBtZXNzYWdlOiBsYWJlbFxuICAgICAgICB9LCBvcHRpb25zKVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIG9iamVjdE1lcmdlKG9iajEsIG9iajIpIHtcbiAgICBpZiAoIW9iajIpIHtcbiAgICAgICAgcmV0dXJuIG9iajE7XG4gICAgfVxuICAgIGVhY2gob2JqMiwgZnVuY3Rpb24oa2V5LCB2YWx1ZSl7XG4gICAgICAgIG9iajFba2V5XSA9IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiBvYmoxO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzdHIsIG1heCkge1xuICAgIHJldHVybiBzdHIubGVuZ3RoIDw9IG1heCA/IHN0ciA6IHN0ci5zdWJzdHIoMCwgbWF4KSArICdcXHUyMDI2Jztcbn1cblxuZnVuY3Rpb24gZ2V0SHR0cERhdGEoKSB7XG4gICAgdmFyIGh0dHAgPSB7XG4gICAgICAgIHVybDogZG9jdW1lbnQubG9jYXRpb24uaHJlZixcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiBuYXZpZ2F0b3IudXNlckFnZW50XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKGRvY3VtZW50LnJlZmVycmVyKSB7XG4gICAgICAgIGh0dHAuaGVhZGVycy5SZWZlcmVyID0gZG9jdW1lbnQucmVmZXJyZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGh0dHA7XG59XG5cbmZ1bmN0aW9uIHNlbmQoZGF0YSkge1xuICAgIGlmICghaXNTZXR1cCgpKSByZXR1cm47XG5cbiAgICBkYXRhID0gb2JqZWN0TWVyZ2Uoe1xuICAgICAgICBwcm9qZWN0OiBnbG9iYWxQcm9qZWN0LFxuICAgICAgICBsb2dnZXI6IGdsb2JhbE9wdGlvbnMubG9nZ2VyLFxuICAgICAgICBzaXRlOiBnbG9iYWxPcHRpb25zLnNpdGUsXG4gICAgICAgIHBsYXRmb3JtOiAnamF2YXNjcmlwdCcsXG4gICAgICAgIC8vIHNlbnRyeS5pbnRlcmZhY2VzLkh0dHBcbiAgICAgICAgcmVxdWVzdDogZ2V0SHR0cERhdGEoKVxuICAgIH0sIGRhdGEpO1xuXG4gICAgLy8gTWVyZ2UgaW4gdGhlIHRhZ3MgYW5kIGV4dHJhIHNlcGFyYXRlbHkgc2luY2Ugb2JqZWN0TWVyZ2UgZG9lc24ndCBoYW5kbGUgYSBkZWVwIG1lcmdlXG4gICAgZGF0YS50YWdzID0gb2JqZWN0TWVyZ2UoZ2xvYmFsT3B0aW9ucy50YWdzLCBkYXRhLnRhZ3MpO1xuICAgIGRhdGEuZXh0cmEgPSBvYmplY3RNZXJnZShnbG9iYWxPcHRpb25zLmV4dHJhLCBkYXRhLmV4dHJhKTtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBubyB0YWdzL2V4dHJhLCBzdHJpcCB0aGUga2V5IGZyb20gdGhlIHBheWxvYWQgYWxsdG9ndGhlci5cbiAgICBpZiAoaXNFbXB0eU9iamVjdChkYXRhLnRhZ3MpKSBkZWxldGUgZGF0YS50YWdzO1xuICAgIGlmIChpc0VtcHR5T2JqZWN0KGRhdGEuZXh0cmEpKSBkZWxldGUgZGF0YS5leHRyYTtcblxuICAgIGlmIChnbG9iYWxVc2VyKSB7XG4gICAgICAgIC8vIHNlbnRyeS5pbnRlcmZhY2VzLlVzZXJcbiAgICAgICAgZGF0YS51c2VyID0gZ2xvYmFsVXNlcjtcbiAgICB9XG5cbiAgICBpZiAoaXNGdW5jdGlvbihnbG9iYWxPcHRpb25zLmRhdGFDYWxsYmFjaykpIHtcbiAgICAgICAgZGF0YSA9IGdsb2JhbE9wdGlvbnMuZGF0YUNhbGxiYWNrKGRhdGEpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHRoZSByZXF1ZXN0IHNob3VsZCBiZSBmaWx0ZXJlZCBvciBub3RcbiAgICBpZiAoaXNGdW5jdGlvbihnbG9iYWxPcHRpb25zLnNob3VsZFNlbmRDYWxsYmFjaykgJiYgIWdsb2JhbE9wdGlvbnMuc2hvdWxkU2VuZENhbGxiYWNrKGRhdGEpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTZW5kIGFsb25nIGFuIGV2ZW50X2lkIGlmIG5vdCBleHBsaWNpdGx5IHBhc3NlZC5cbiAgICAvLyBUaGlzIGV2ZW50X2lkIGNhbiBiZSB1c2VkIHRvIHJlZmVyZW5jZSB0aGUgZXJyb3Igd2l0aGluIFNlbnRyeSBpdHNlbGYuXG4gICAgLy8gU2V0IGxhc3RFdmVudElkIGFmdGVyIHdlIGtub3cgdGhlIGVycm9yIHNob3VsZCBhY3R1YWxseSBiZSBzZW50XG4gICAgbGFzdEV2ZW50SWQgPSBkYXRhLmV2ZW50X2lkIHx8IChkYXRhLmV2ZW50X2lkID0gdXVpZDQoKSk7XG5cbiAgICBtYWtlUmVxdWVzdChkYXRhKTtcbn1cblxuXG5mdW5jdGlvbiBtYWtlUmVxdWVzdChkYXRhKSB7XG4gICAgdmFyIGltZyA9IG5ldyBJbWFnZSgpLFxuICAgICAgICBzcmMgPSBnbG9iYWxTZXJ2ZXIgKyBhdXRoUXVlcnlTdHJpbmcgKyAnJnNlbnRyeV9kYXRhPScgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uIHN1Y2Nlc3MoKSB7XG4gICAgICAgIHRyaWdnZXJFdmVudCgnc3VjY2VzcycsIHtcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBzcmM6IHNyY1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGltZy5vbmVycm9yID0gaW1nLm9uYWJvcnQgPSBmdW5jdGlvbiBmYWlsdXJlKCkge1xuICAgICAgICB0cmlnZ2VyRXZlbnQoJ2ZhaWx1cmUnLCB7XG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgc3JjOiBzcmNcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBpbWcuc3JjID0gc3JjO1xufVxuXG5mdW5jdGlvbiBpc1NldHVwKCkge1xuICAgIGlmICghaGFzSlNPTikgcmV0dXJuIGZhbHNlOyAgLy8gbmVlZHMgSlNPTiBzdXBwb3J0XG4gICAgaWYgKCFnbG9iYWxTZXJ2ZXIpIHtcbiAgICAgICAgbG9nRGVidWcoJ2Vycm9yJywgJ0Vycm9yOiBSYXZlbiBoYXMgbm90IGJlZW4gY29uZmlndXJlZC4nKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gam9pblJlZ0V4cChwYXR0ZXJucykge1xuICAgIC8vIENvbWJpbmUgYW4gYXJyYXkgb2YgcmVndWxhciBleHByZXNzaW9ucyBhbmQgc3RyaW5ncyBpbnRvIG9uZSBsYXJnZSByZWdleHBcbiAgICAvLyBCZSBtYWQuXG4gICAgdmFyIHNvdXJjZXMgPSBbXSxcbiAgICAgICAgaSA9IDAsIGxlbiA9IHBhdHRlcm5zLmxlbmd0aCxcbiAgICAgICAgcGF0dGVybjtcblxuICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcGF0dGVybiA9IHBhdHRlcm5zW2ldO1xuICAgICAgICBpZiAoaXNTdHJpbmcocGF0dGVybikpIHtcbiAgICAgICAgICAgIC8vIElmIGl0J3MgYSBzdHJpbmcsIHdlIG5lZWQgdG8gZXNjYXBlIGl0XG4gICAgICAgICAgICAvLyBUYWtlbiBmcm9tOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L0d1aWRlL1JlZ3VsYXJfRXhwcmVzc2lvbnNcbiAgICAgICAgICAgIHNvdXJjZXMucHVzaChwYXR0ZXJuLnJlcGxhY2UoLyhbLiorP149IToke30oKXxcXFtcXF1cXC9cXFxcXSkvZywgXCJcXFxcJDFcIikpO1xuICAgICAgICB9IGVsc2UgaWYgKHBhdHRlcm4gJiYgcGF0dGVybi5zb3VyY2UpIHtcbiAgICAgICAgICAgIC8vIElmIGl0J3MgYSByZWdleHAgYWxyZWFkeSwgd2Ugd2FudCB0byBleHRyYWN0IHRoZSBzb3VyY2VcbiAgICAgICAgICAgIHNvdXJjZXMucHVzaChwYXR0ZXJuLnNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW50ZW50aW9uYWxseSBza2lwIG90aGVyIGNhc2VzXG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVnRXhwKHNvdXJjZXMuam9pbignfCcpLCAnaScpO1xufVxuXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9ob3ctdG8tY3JlYXRlLWEtZ3VpZC11dWlkLWluLWphdmFzY3JpcHQvMjExNzUyMyMyMTE3NTIzXG5mdW5jdGlvbiB1dWlkNCgpIHtcbiAgICByZXR1cm4gJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDAsXG4gICAgICAgICAgICB2ID0gYyA9PSAneCcgPyByIDogKHImMHgzfDB4OCk7XG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gbG9nRGVidWcobGV2ZWwsIG1lc3NhZ2UpIHtcbiAgICBpZiAod2luZG93LmNvbnNvbGUgJiYgY29uc29sZVtsZXZlbF0gJiYgUmF2ZW4uZGVidWcpIHtcbiAgICAgICAgY29uc29sZVtsZXZlbF0obWVzc2FnZSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZnRlckxvYWQoKSB7XG4gICAgLy8gQXR0ZW1wdCB0byBpbml0aWFsaXplIFJhdmVuIG9uIGxvYWRcbiAgICB2YXIgUmF2ZW5Db25maWcgPSB3aW5kb3cuUmF2ZW5Db25maWc7XG4gICAgaWYgKFJhdmVuQ29uZmlnKSB7XG4gICAgICAgIFJhdmVuLmNvbmZpZyhSYXZlbkNvbmZpZy5kc24sIFJhdmVuQ29uZmlnLmNvbmZpZykuaW5zdGFsbCgpO1xuICAgIH1cbn1cbmFmdGVyTG9hZCgpO1xuXG4vLyBFeHBvc2UgUmF2ZW4gdG8gdGhlIHdvcmxkXG53aW5kb3cuUmF2ZW4gPSBSYXZlbjtcblxuLy8gQU1EXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCdyYXZlbicsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIFJhdmVuOyB9KTtcbn1cblxufSkodGhpcyk7XG4iLCIvKiFcbiAgKiBSZXF3ZXN0ISBBIGdlbmVyYWwgcHVycG9zZSBYSFIgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICogbGljZW5zZSBNSVQgKGMpIER1c3RpbiBEaWF6IDIwMTRcbiAgKiBodHRwczovL2dpdGh1Yi5jb20vZGVkL3JlcXdlc3RcbiAgKi9cblxuIWZ1bmN0aW9uIChuYW1lLCBjb250ZXh0LCBkZWZpbml0aW9uKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKVxuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGRlZmluaXRpb24pXG4gIGVsc2UgY29udGV4dFtuYW1lXSA9IGRlZmluaXRpb24oKVxufSgncmVxd2VzdCcsIHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuICB2YXIgd2luID0gd2luZG93XG4gICAgLCBkb2MgPSBkb2N1bWVudFxuICAgICwgaHR0cHNSZSA9IC9eaHR0cC9cbiAgICAsIHByb3RvY29sUmUgPSAvKF5cXHcrKTpcXC9cXC8vXG4gICAgLCB0d29IdW5kbyA9IC9eKDIwXFxkfDEyMjMpJC8gLy9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMDQ2OTcyL21zaWUtcmV0dXJucy1zdGF0dXMtY29kZS1vZi0xMjIzLWZvci1hamF4LXJlcXVlc3RcbiAgICAsIGJ5VGFnID0gJ2dldEVsZW1lbnRzQnlUYWdOYW1lJ1xuICAgICwgcmVhZHlTdGF0ZSA9ICdyZWFkeVN0YXRlJ1xuICAgICwgY29udGVudFR5cGUgPSAnQ29udGVudC1UeXBlJ1xuICAgICwgcmVxdWVzdGVkV2l0aCA9ICdYLVJlcXVlc3RlZC1XaXRoJ1xuICAgICwgaGVhZCA9IGRvY1tieVRhZ10oJ2hlYWQnKVswXVxuICAgICwgdW5pcWlkID0gMFxuICAgICwgY2FsbGJhY2tQcmVmaXggPSAncmVxd2VzdF8nICsgKCtuZXcgRGF0ZSgpKVxuICAgICwgbGFzdFZhbHVlIC8vIGRhdGEgc3RvcmVkIGJ5IHRoZSBtb3N0IHJlY2VudCBKU09OUCBjYWxsYmFja1xuICAgICwgeG1sSHR0cFJlcXVlc3QgPSAnWE1MSHR0cFJlcXVlc3QnXG4gICAgLCB4RG9tYWluUmVxdWVzdCA9ICdYRG9tYWluUmVxdWVzdCdcbiAgICAsIG5vb3AgPSBmdW5jdGlvbiAoKSB7fVxuXG4gICAgLCBpc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT0gJ2Z1bmN0aW9uJ1xuICAgICAgICA/IEFycmF5LmlzQXJyYXlcbiAgICAgICAgOiBmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgcmV0dXJuIGEgaW5zdGFuY2VvZiBBcnJheVxuICAgICAgICAgIH1cblxuICAgICwgZGVmYXVsdEhlYWRlcnMgPSB7XG4gICAgICAgICAgJ2NvbnRlbnRUeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbiAgICAgICAgLCAncmVxdWVzdGVkV2l0aCc6IHhtbEh0dHBSZXF1ZXN0XG4gICAgICAgICwgJ2FjY2VwdCc6IHtcbiAgICAgICAgICAgICAgJyonOiAgJ3RleHQvamF2YXNjcmlwdCwgdGV4dC9odG1sLCBhcHBsaWNhdGlvbi94bWwsIHRleHQveG1sLCAqLyonXG4gICAgICAgICAgICAsICd4bWwnOiAgJ2FwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwnXG4gICAgICAgICAgICAsICdodG1sJzogJ3RleHQvaHRtbCdcbiAgICAgICAgICAgICwgJ3RleHQnOiAndGV4dC9wbGFpbidcbiAgICAgICAgICAgICwgJ2pzb24nOiAnYXBwbGljYXRpb24vanNvbiwgdGV4dC9qYXZhc2NyaXB0J1xuICAgICAgICAgICAgLCAnanMnOiAgICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0LCB0ZXh0L2phdmFzY3JpcHQnXG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgLCB4aHIgPSBmdW5jdGlvbihvKSB7XG4gICAgICAgIC8vIGlzIGl0IHgtZG9tYWluXG4gICAgICAgIGlmIChvWydjcm9zc09yaWdpbiddID09PSB0cnVlKSB7XG4gICAgICAgICAgdmFyIHhociA9IHdpblt4bWxIdHRwUmVxdWVzdF0gPyBuZXcgWE1MSHR0cFJlcXVlc3QoKSA6IG51bGxcbiAgICAgICAgICBpZiAoeGhyICYmICd3aXRoQ3JlZGVudGlhbHMnIGluIHhocikge1xuICAgICAgICAgICAgcmV0dXJuIHhoclxuICAgICAgICAgIH0gZWxzZSBpZiAod2luW3hEb21haW5SZXF1ZXN0XSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBYRG9tYWluUmVxdWVzdCgpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGNyb3NzLW9yaWdpbiByZXF1ZXN0cycpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHdpblt4bWxIdHRwUmVxdWVzdF0pIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFhNTEh0dHBSZXF1ZXN0KClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICwgZ2xvYmFsU2V0dXBPcHRpb25zID0ge1xuICAgICAgICBkYXRhRmlsdGVyOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgIH1cbiAgICAgIH1cblxuICBmdW5jdGlvbiBzdWNjZWVkKHIpIHtcbiAgICB2YXIgcHJvdG9jb2wgPSBwcm90b2NvbFJlLmV4ZWMoci51cmwpO1xuICAgIHByb3RvY29sID0gKHByb3RvY29sICYmIHByb3RvY29sWzFdKSB8fCB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2w7XG4gICAgcmV0dXJuIGh0dHBzUmUudGVzdChwcm90b2NvbCkgPyB0d29IdW5kby50ZXN0KHIucmVxdWVzdC5zdGF0dXMpIDogISFyLnJlcXVlc3QucmVzcG9uc2U7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVSZWFkeVN0YXRlKHIsIHN1Y2Nlc3MsIGVycm9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIHVzZSBfYWJvcnRlZCB0byBtaXRpZ2F0ZSBhZ2FpbnN0IElFIGVyciBjMDBjMDIzZlxuICAgICAgLy8gKGNhbid0IHJlYWQgcHJvcHMgb24gYWJvcnRlZCByZXF1ZXN0IG9iamVjdHMpXG4gICAgICBpZiAoci5fYWJvcnRlZCkgcmV0dXJuIGVycm9yKHIucmVxdWVzdClcbiAgICAgIGlmIChyLnJlcXVlc3QgJiYgci5yZXF1ZXN0W3JlYWR5U3RhdGVdID09IDQpIHtcbiAgICAgICAgci5yZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG5vb3BcbiAgICAgICAgaWYgKHN1Y2NlZWQocikpIHN1Y2Nlc3Moci5yZXF1ZXN0KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZXJyb3Ioci5yZXF1ZXN0KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEhlYWRlcnMoaHR0cCwgbykge1xuICAgIHZhciBoZWFkZXJzID0gb1snaGVhZGVycyddIHx8IHt9XG4gICAgICAsIGhcblxuICAgIGhlYWRlcnNbJ0FjY2VwdCddID0gaGVhZGVyc1snQWNjZXB0J11cbiAgICAgIHx8IGRlZmF1bHRIZWFkZXJzWydhY2NlcHQnXVtvWyd0eXBlJ11dXG4gICAgICB8fCBkZWZhdWx0SGVhZGVyc1snYWNjZXB0J11bJyonXVxuXG4gICAgdmFyIGlzQUZvcm1EYXRhID0gdHlwZW9mIEZvcm1EYXRhID09PSAnZnVuY3Rpb24nICYmIChvWydkYXRhJ10gaW5zdGFuY2VvZiBGb3JtRGF0YSk7XG4gICAgLy8gYnJlYWtzIGNyb3NzLW9yaWdpbiByZXF1ZXN0cyB3aXRoIGxlZ2FjeSBicm93c2Vyc1xuICAgIGlmICghb1snY3Jvc3NPcmlnaW4nXSAmJiAhaGVhZGVyc1tyZXF1ZXN0ZWRXaXRoXSkgaGVhZGVyc1tyZXF1ZXN0ZWRXaXRoXSA9IGRlZmF1bHRIZWFkZXJzWydyZXF1ZXN0ZWRXaXRoJ11cbiAgICBpZiAoIWhlYWRlcnNbY29udGVudFR5cGVdICYmICFpc0FGb3JtRGF0YSkgaGVhZGVyc1tjb250ZW50VHlwZV0gPSBvWydjb250ZW50VHlwZSddIHx8IGRlZmF1bHRIZWFkZXJzWydjb250ZW50VHlwZSddXG4gICAgZm9yIChoIGluIGhlYWRlcnMpXG4gICAgICBoZWFkZXJzLmhhc093blByb3BlcnR5KGgpICYmICdzZXRSZXF1ZXN0SGVhZGVyJyBpbiBodHRwICYmIGh0dHAuc2V0UmVxdWVzdEhlYWRlcihoLCBoZWFkZXJzW2hdKVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0Q3JlZGVudGlhbHMoaHR0cCwgbykge1xuICAgIGlmICh0eXBlb2Ygb1snd2l0aENyZWRlbnRpYWxzJ10gIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBodHRwLndpdGhDcmVkZW50aWFscyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGh0dHAud2l0aENyZWRlbnRpYWxzID0gISFvWyd3aXRoQ3JlZGVudGlhbHMnXVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYWxDYWxsYmFjayhkYXRhKSB7XG4gICAgbGFzdFZhbHVlID0gZGF0YVxuICB9XG5cbiAgZnVuY3Rpb24gdXJsYXBwZW5kICh1cmwsIHMpIHtcbiAgICByZXR1cm4gdXJsICsgKC9cXD8vLnRlc3QodXJsKSA/ICcmJyA6ICc/JykgKyBzXG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVKc29ucChvLCBmbiwgZXJyLCB1cmwpIHtcbiAgICB2YXIgcmVxSWQgPSB1bmlxaWQrK1xuICAgICAgLCBjYmtleSA9IG9bJ2pzb25wQ2FsbGJhY2snXSB8fCAnY2FsbGJhY2snIC8vIHRoZSAnY2FsbGJhY2snIGtleVxuICAgICAgLCBjYnZhbCA9IG9bJ2pzb25wQ2FsbGJhY2tOYW1lJ10gfHwgcmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeChyZXFJZClcbiAgICAgICwgY2JyZWcgPSBuZXcgUmVnRXhwKCcoKF58XFxcXD98JiknICsgY2JrZXkgKyAnKT0oW14mXSspJylcbiAgICAgICwgbWF0Y2ggPSB1cmwubWF0Y2goY2JyZWcpXG4gICAgICAsIHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgICAgLCBsb2FkZWQgPSAwXG4gICAgICAsIGlzSUUxMCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignTVNJRSAxMC4wJykgIT09IC0xXG5cbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGlmIChtYXRjaFszXSA9PT0gJz8nKSB7XG4gICAgICAgIHVybCA9IHVybC5yZXBsYWNlKGNicmVnLCAnJDE9JyArIGNidmFsKSAvLyB3aWxkY2FyZCBjYWxsYmFjayBmdW5jIG5hbWVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNidmFsID0gbWF0Y2hbM10gLy8gcHJvdmlkZWQgY2FsbGJhY2sgZnVuYyBuYW1lXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybCA9IHVybGFwcGVuZCh1cmwsIGNia2V5ICsgJz0nICsgY2J2YWwpIC8vIG5vIGNhbGxiYWNrIGRldGFpbHMsIGFkZCAnZW1cbiAgICB9XG5cbiAgICB3aW5bY2J2YWxdID0gZ2VuZXJhbENhbGxiYWNrXG5cbiAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnXG4gICAgc2NyaXB0LnNyYyA9IHVybFxuICAgIHNjcmlwdC5hc3luYyA9IHRydWVcbiAgICBpZiAodHlwZW9mIHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgIT09ICd1bmRlZmluZWQnICYmICFpc0lFMTApIHtcbiAgICAgIC8vIG5lZWQgdGhpcyBmb3IgSUUgZHVlIHRvIG91dC1vZi1vcmRlciBvbnJlYWR5c3RhdGVjaGFuZ2UoKSwgYmluZGluZyBzY3JpcHRcbiAgICAgIC8vIGV4ZWN1dGlvbiB0byBhbiBldmVudCBsaXN0ZW5lciBnaXZlcyB1cyBjb250cm9sIG92ZXIgd2hlbiB0aGUgc2NyaXB0XG4gICAgICAvLyBpcyBleGVjdXRlZC4gU2VlIGh0dHA6Ly9qYXVib3VyZy5uZXQvMjAxMC8wNy9sb2FkaW5nLXNjcmlwdC1hcy1vbmNsaWNrLWhhbmRsZXItb2YuaHRtbFxuICAgICAgc2NyaXB0Lmh0bWxGb3IgPSBzY3JpcHQuaWQgPSAnX3JlcXdlc3RfJyArIHJlcUlkXG4gICAgfVxuXG4gICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoKHNjcmlwdFtyZWFkeVN0YXRlXSAmJiBzY3JpcHRbcmVhZHlTdGF0ZV0gIT09ICdjb21wbGV0ZScgJiYgc2NyaXB0W3JlYWR5U3RhdGVdICE9PSAnbG9hZGVkJykgfHwgbG9hZGVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsXG4gICAgICBzY3JpcHQub25jbGljayAmJiBzY3JpcHQub25jbGljaygpXG4gICAgICAvLyBDYWxsIHRoZSB1c2VyIGNhbGxiYWNrIHdpdGggdGhlIGxhc3QgdmFsdWUgc3RvcmVkIGFuZCBjbGVhbiB1cCB2YWx1ZXMgYW5kIHNjcmlwdHMuXG4gICAgICBmbihsYXN0VmFsdWUpXG4gICAgICBsYXN0VmFsdWUgPSB1bmRlZmluZWRcbiAgICAgIGhlYWQucmVtb3ZlQ2hpbGQoc2NyaXB0KVxuICAgICAgbG9hZGVkID0gMVxuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgc2NyaXB0IHRvIHRoZSBET00gaGVhZFxuICAgIGhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuXG4gICAgLy8gRW5hYmxlIEpTT05QIHRpbWVvdXRcbiAgICByZXR1cm4ge1xuICAgICAgYWJvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IHNjcmlwdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsXG4gICAgICAgIGVycih7fSwgJ1JlcXVlc3QgaXMgYWJvcnRlZDogdGltZW91dCcsIHt9KVxuICAgICAgICBsYXN0VmFsdWUgPSB1bmRlZmluZWRcbiAgICAgICAgaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICAgIGxvYWRlZCA9IDFcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZXRSZXF1ZXN0KGZuLCBlcnIpIHtcbiAgICB2YXIgbyA9IHRoaXMub1xuICAgICAgLCBtZXRob2QgPSAob1snbWV0aG9kJ10gfHwgJ0dFVCcpLnRvVXBwZXJDYXNlKClcbiAgICAgICwgdXJsID0gdHlwZW9mIG8gPT09ICdzdHJpbmcnID8gbyA6IG9bJ3VybCddXG4gICAgICAvLyBjb252ZXJ0IG5vbi1zdHJpbmcgb2JqZWN0cyB0byBxdWVyeS1zdHJpbmcgZm9ybSB1bmxlc3Mgb1sncHJvY2Vzc0RhdGEnXSBpcyBmYWxzZVxuICAgICAgLCBkYXRhID0gKG9bJ3Byb2Nlc3NEYXRhJ10gIT09IGZhbHNlICYmIG9bJ2RhdGEnXSAmJiB0eXBlb2Ygb1snZGF0YSddICE9PSAnc3RyaW5nJylcbiAgICAgICAgPyByZXF3ZXN0LnRvUXVlcnlTdHJpbmcob1snZGF0YSddKVxuICAgICAgICA6IChvWydkYXRhJ10gfHwgbnVsbClcbiAgICAgICwgaHR0cFxuICAgICAgLCBzZW5kV2FpdCA9IGZhbHNlXG5cbiAgICAvLyBpZiB3ZSdyZSB3b3JraW5nIG9uIGEgR0VUIHJlcXVlc3QgYW5kIHdlIGhhdmUgZGF0YSB0aGVuIHdlIHNob3VsZCBhcHBlbmRcbiAgICAvLyBxdWVyeSBzdHJpbmcgdG8gZW5kIG9mIFVSTCBhbmQgbm90IHBvc3QgZGF0YVxuICAgIGlmICgob1sndHlwZSddID09ICdqc29ucCcgfHwgbWV0aG9kID09ICdHRVQnKSAmJiBkYXRhKSB7XG4gICAgICB1cmwgPSB1cmxhcHBlbmQodXJsLCBkYXRhKVxuICAgICAgZGF0YSA9IG51bGxcbiAgICB9XG5cbiAgICBpZiAob1sndHlwZSddID09ICdqc29ucCcpIHJldHVybiBoYW5kbGVKc29ucChvLCBmbiwgZXJyLCB1cmwpXG5cbiAgICAvLyBnZXQgdGhlIHhociBmcm9tIHRoZSBmYWN0b3J5IGlmIHBhc3NlZFxuICAgIC8vIGlmIHRoZSBmYWN0b3J5IHJldHVybnMgbnVsbCwgZmFsbC1iYWNrIHRvIG91cnNcbiAgICBodHRwID0gKG8ueGhyICYmIG8ueGhyKG8pKSB8fCB4aHIobylcblxuICAgIGh0dHAub3BlbihtZXRob2QsIHVybCwgb1snYXN5bmMnXSA9PT0gZmFsc2UgPyBmYWxzZSA6IHRydWUpXG4gICAgc2V0SGVhZGVycyhodHRwLCBvKVxuICAgIHNldENyZWRlbnRpYWxzKGh0dHAsIG8pXG4gICAgaWYgKHdpblt4RG9tYWluUmVxdWVzdF0gJiYgaHR0cCBpbnN0YW5jZW9mIHdpblt4RG9tYWluUmVxdWVzdF0pIHtcbiAgICAgICAgaHR0cC5vbmxvYWQgPSBmblxuICAgICAgICBodHRwLm9uZXJyb3IgPSBlcnJcbiAgICAgICAgLy8gTk9URTogc2VlXG4gICAgICAgIC8vIGh0dHA6Ly9zb2NpYWwubXNkbi5taWNyb3NvZnQuY29tL0ZvcnVtcy9lbi1VUy9pZXdlYmRldmVsb3BtZW50L3RocmVhZC8zMGVmM2FkZC03NjdjLTQ0MzYtYjhhOS1mMWNhMTliNDgxMmVcbiAgICAgICAgaHR0cC5vbnByb2dyZXNzID0gZnVuY3Rpb24oKSB7fVxuICAgICAgICBzZW5kV2FpdCA9IHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgaHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBoYW5kbGVSZWFkeVN0YXRlKHRoaXMsIGZuLCBlcnIpXG4gICAgfVxuICAgIG9bJ2JlZm9yZSddICYmIG9bJ2JlZm9yZSddKGh0dHApXG4gICAgaWYgKHNlbmRXYWl0KSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaHR0cC5zZW5kKGRhdGEpXG4gICAgICB9LCAyMDApXG4gICAgfSBlbHNlIHtcbiAgICAgIGh0dHAuc2VuZChkYXRhKVxuICAgIH1cbiAgICByZXR1cm4gaHR0cFxuICB9XG5cbiAgZnVuY3Rpb24gUmVxd2VzdChvLCBmbikge1xuICAgIHRoaXMubyA9IG9cbiAgICB0aGlzLmZuID0gZm5cblxuICAgIGluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0VHlwZShoZWFkZXIpIHtcbiAgICAvLyBqc29uLCBqYXZhc2NyaXB0LCB0ZXh0L3BsYWluLCB0ZXh0L2h0bWwsIHhtbFxuICAgIGlmIChoZWFkZXIubWF0Y2goJ2pzb24nKSkgcmV0dXJuICdqc29uJ1xuICAgIGlmIChoZWFkZXIubWF0Y2goJ2phdmFzY3JpcHQnKSkgcmV0dXJuICdqcydcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCd0ZXh0JykpIHJldHVybiAnaHRtbCdcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCd4bWwnKSkgcmV0dXJuICd4bWwnXG4gIH1cblxuICBmdW5jdGlvbiBpbml0KG8sIGZuKSB7XG5cbiAgICB0aGlzLnVybCA9IHR5cGVvZiBvID09ICdzdHJpbmcnID8gbyA6IG9bJ3VybCddXG4gICAgdGhpcy50aW1lb3V0ID0gbnVsbFxuXG4gICAgLy8gd2hldGhlciByZXF1ZXN0IGhhcyBiZWVuIGZ1bGZpbGxlZCBmb3IgcHVycG9zZVxuICAgIC8vIG9mIHRyYWNraW5nIHRoZSBQcm9taXNlc1xuICAgIHRoaXMuX2Z1bGZpbGxlZCA9IGZhbHNlXG4gICAgLy8gc3VjY2VzcyBoYW5kbGVyc1xuICAgIHRoaXMuX3N1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24oKXt9XG4gICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycyA9IFtdXG4gICAgLy8gZXJyb3IgaGFuZGxlcnNcbiAgICB0aGlzLl9lcnJvckhhbmRsZXJzID0gW11cbiAgICAvLyBjb21wbGV0ZSAoYm90aCBzdWNjZXNzIGFuZCBmYWlsKSBoYW5kbGVyc1xuICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMgPSBbXVxuICAgIHRoaXMuX2VycmVkID0gZmFsc2VcbiAgICB0aGlzLl9yZXNwb25zZUFyZ3MgPSB7fVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgICBmbiA9IGZuIHx8IGZ1bmN0aW9uICgpIHt9XG5cbiAgICBpZiAob1sndGltZW91dCddKSB7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5hYm9ydCgpXG4gICAgICB9LCBvWyd0aW1lb3V0J10pXG4gICAgfVxuXG4gICAgaWYgKG9bJ3N1Y2Nlc3MnXSkge1xuICAgICAgdGhpcy5fc3VjY2Vzc0hhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9bJ3N1Y2Nlc3MnXS5hcHBseShvLCBhcmd1bWVudHMpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9bJ2Vycm9yJ10pIHtcbiAgICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9bJ2Vycm9yJ10uYXBwbHkobywgYXJndW1lbnRzKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAob1snY29tcGxldGUnXSkge1xuICAgICAgdGhpcy5fY29tcGxldGVIYW5kbGVycy5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb1snY29tcGxldGUnXS5hcHBseShvLCBhcmd1bWVudHMpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXBsZXRlIChyZXNwKSB7XG4gICAgICBvWyd0aW1lb3V0J10gJiYgY2xlYXJUaW1lb3V0KHNlbGYudGltZW91dClcbiAgICAgIHNlbGYudGltZW91dCA9IG51bGxcbiAgICAgIHdoaWxlIChzZWxmLl9jb21wbGV0ZUhhbmRsZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2VsZi5fY29tcGxldGVIYW5kbGVycy5zaGlmdCgpKHJlc3ApXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyAocmVzcCkge1xuICAgICAgdmFyIHR5cGUgPSBvWyd0eXBlJ10gfHwgcmVzcCAmJiBzZXRUeXBlKHJlc3AuZ2V0UmVzcG9uc2VIZWFkZXIoJ0NvbnRlbnQtVHlwZScpKSAvLyByZXNwIGNhbiBiZSB1bmRlZmluZWQgaW4gSUVcbiAgICAgIHJlc3AgPSAodHlwZSAhPT0gJ2pzb25wJykgPyBzZWxmLnJlcXVlc3QgOiByZXNwXG4gICAgICAvLyB1c2UgZ2xvYmFsIGRhdGEgZmlsdGVyIG9uIHJlc3BvbnNlIHRleHRcbiAgICAgIHZhciBmaWx0ZXJlZFJlc3BvbnNlID0gZ2xvYmFsU2V0dXBPcHRpb25zLmRhdGFGaWx0ZXIocmVzcC5yZXNwb25zZVRleHQsIHR5cGUpXG4gICAgICAgICwgciA9IGZpbHRlcmVkUmVzcG9uc2VcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3AucmVzcG9uc2VUZXh0ID0gclxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBjYW4ndCBhc3NpZ24gdGhpcyBpbiBJRTw9OCwganVzdCBpZ25vcmVcbiAgICAgIH1cbiAgICAgIGlmIChyKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICdqc29uJzpcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzcCA9IHdpbi5KU09OID8gd2luLkpTT04ucGFyc2UocikgOiBldmFsKCcoJyArIHIgKyAnKScpXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3IocmVzcCwgJ0NvdWxkIG5vdCBwYXJzZSBKU09OIGluIHJlc3BvbnNlJywgZXJyKVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdqcyc6XG4gICAgICAgICAgcmVzcCA9IGV2YWwocilcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICdodG1sJzpcbiAgICAgICAgICByZXNwID0gclxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3htbCc6XG4gICAgICAgICAgcmVzcCA9IHJlc3AucmVzcG9uc2VYTUxcbiAgICAgICAgICAgICAgJiYgcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yIC8vIElFIHRyb2xvbG9cbiAgICAgICAgICAgICAgJiYgcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yLmVycm9yQ29kZVxuICAgICAgICAgICAgICAmJiByZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IucmVhc29uXG4gICAgICAgICAgICA/IG51bGxcbiAgICAgICAgICAgIDogcmVzcC5yZXNwb25zZVhNTFxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLnJlc3AgPSByZXNwXG4gICAgICBzZWxmLl9mdWxmaWxsZWQgPSB0cnVlXG4gICAgICBmbihyZXNwKVxuICAgICAgc2VsZi5fc3VjY2Vzc0hhbmRsZXIocmVzcClcbiAgICAgIHdoaWxlIChzZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmVzcCA9IHNlbGYuX2Z1bGZpbGxtZW50SGFuZGxlcnMuc2hpZnQoKShyZXNwKVxuICAgICAgfVxuXG4gICAgICBjb21wbGV0ZShyZXNwKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKHJlc3AsIG1zZywgdCkge1xuICAgICAgcmVzcCA9IHNlbGYucmVxdWVzdFxuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLnJlc3AgPSByZXNwXG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MubXNnID0gbXNnXG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MudCA9IHRcbiAgICAgIHNlbGYuX2VycmVkID0gdHJ1ZVxuICAgICAgd2hpbGUgKHNlbGYuX2Vycm9ySGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBzZWxmLl9lcnJvckhhbmRsZXJzLnNoaWZ0KCkocmVzcCwgbXNnLCB0KVxuICAgICAgfVxuICAgICAgY29tcGxldGUocmVzcClcbiAgICB9XG5cbiAgICB0aGlzLnJlcXVlc3QgPSBnZXRSZXF1ZXN0LmNhbGwodGhpcywgc3VjY2VzcywgZXJyb3IpXG4gIH1cblxuICBSZXF3ZXN0LnByb3RvdHlwZSA9IHtcbiAgICBhYm9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5fYWJvcnRlZCA9IHRydWVcbiAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpXG4gICAgfVxuXG4gICwgcmV0cnk6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGluaXQuY2FsbCh0aGlzLCB0aGlzLm8sIHRoaXMuZm4pXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU21hbGwgZGV2aWF0aW9uIGZyb20gdGhlIFByb21pc2VzIEEgQ29tbW9uSnMgc3BlY2lmaWNhdGlvblxuICAgICAqIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1Byb21pc2VzL0FcbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIGB0aGVuYCB3aWxsIGV4ZWN1dGUgdXBvbiBzdWNjZXNzZnVsIHJlcXVlc3RzXG4gICAgICovXG4gICwgdGhlbjogZnVuY3Rpb24gKHN1Y2Nlc3MsIGZhaWwpIHtcbiAgICAgIHN1Y2Nlc3MgPSBzdWNjZXNzIHx8IGZ1bmN0aW9uICgpIHt9XG4gICAgICBmYWlsID0gZmFpbCB8fCBmdW5jdGlvbiAoKSB7fVxuICAgICAgaWYgKHRoaXMuX2Z1bGZpbGxlZCkge1xuICAgICAgICB0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCA9IHN1Y2Nlc3ModGhpcy5fcmVzcG9uc2VBcmdzLnJlc3ApXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX2VycmVkKSB7XG4gICAgICAgIGZhaWwodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AsIHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csIHRoaXMuX3Jlc3BvbnNlQXJncy50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycy5wdXNoKHN1Y2Nlc3MpXG4gICAgICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChmYWlsKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBgYWx3YXlzYCB3aWxsIGV4ZWN1dGUgd2hldGhlciB0aGUgcmVxdWVzdCBzdWNjZWVkcyBvciBmYWlsc1xuICAgICAqL1xuICAsIGFsd2F5czogZnVuY3Rpb24gKGZuKSB7XG4gICAgICBpZiAodGhpcy5fZnVsZmlsbGVkIHx8IHRoaXMuX2VycmVkKSB7XG4gICAgICAgIGZuKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fY29tcGxldGVIYW5kbGVycy5wdXNoKGZuKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBgZmFpbGAgd2lsbCBleGVjdXRlIHdoZW4gdGhlIHJlcXVlc3QgZmFpbHNcbiAgICAgKi9cbiAgLCBmYWlsOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIGlmICh0aGlzLl9lcnJlZCkge1xuICAgICAgICBmbih0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCwgdGhpcy5fcmVzcG9uc2VBcmdzLm1zZywgdGhpcy5fcmVzcG9uc2VBcmdzLnQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZm4pXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cbiAgLCAnY2F0Y2gnOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHJldHVybiB0aGlzLmZhaWwoZm4pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVxd2VzdChvLCBmbikge1xuICAgIHJldHVybiBuZXcgUmVxd2VzdChvLCBmbilcbiAgfVxuXG4gIC8vIG5vcm1hbGl6ZSBuZXdsaW5lIHZhcmlhbnRzIGFjY29yZGluZyB0byBzcGVjIC0+IENSTEZcbiAgZnVuY3Rpb24gbm9ybWFsaXplKHMpIHtcbiAgICByZXR1cm4gcyA/IHMucmVwbGFjZSgvXFxyP1xcbi9nLCAnXFxyXFxuJykgOiAnJ1xuICB9XG5cbiAgZnVuY3Rpb24gc2VyaWFsKGVsLCBjYikge1xuICAgIHZhciBuID0gZWwubmFtZVxuICAgICAgLCB0ID0gZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAsIG9wdENiID0gZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAvLyBJRSBnaXZlcyB2YWx1ZT1cIlwiIGV2ZW4gd2hlcmUgdGhlcmUgaXMgbm8gdmFsdWUgYXR0cmlidXRlXG4gICAgICAgICAgLy8gJ3NwZWNpZmllZCcgcmVmOiBodHRwOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMy1Db3JlL2NvcmUuaHRtbCNJRC04NjI1MjkyNzNcbiAgICAgICAgICBpZiAobyAmJiAhb1snZGlzYWJsZWQnXSlcbiAgICAgICAgICAgIGNiKG4sIG5vcm1hbGl6ZShvWydhdHRyaWJ1dGVzJ11bJ3ZhbHVlJ10gJiYgb1snYXR0cmlidXRlcyddWyd2YWx1ZSddWydzcGVjaWZpZWQnXSA/IG9bJ3ZhbHVlJ10gOiBvWyd0ZXh0J10pKVxuICAgICAgICB9XG4gICAgICAsIGNoLCByYSwgdmFsLCBpXG5cbiAgICAvLyBkb24ndCBzZXJpYWxpemUgZWxlbWVudHMgdGhhdCBhcmUgZGlzYWJsZWQgb3Igd2l0aG91dCBhIG5hbWVcbiAgICBpZiAoZWwuZGlzYWJsZWQgfHwgIW4pIHJldHVyblxuXG4gICAgc3dpdGNoICh0KSB7XG4gICAgY2FzZSAnaW5wdXQnOlxuICAgICAgaWYgKCEvcmVzZXR8YnV0dG9ufGltYWdlfGZpbGUvaS50ZXN0KGVsLnR5cGUpKSB7XG4gICAgICAgIGNoID0gL2NoZWNrYm94L2kudGVzdChlbC50eXBlKVxuICAgICAgICByYSA9IC9yYWRpby9pLnRlc3QoZWwudHlwZSlcbiAgICAgICAgdmFsID0gZWwudmFsdWVcbiAgICAgICAgLy8gV2ViS2l0IGdpdmVzIHVzIFwiXCIgaW5zdGVhZCBvZiBcIm9uXCIgaWYgYSBjaGVja2JveCBoYXMgbm8gdmFsdWUsIHNvIGNvcnJlY3QgaXQgaGVyZVxuICAgICAgICA7KCEoY2ggfHwgcmEpIHx8IGVsLmNoZWNrZWQpICYmIGNiKG4sIG5vcm1hbGl6ZShjaCAmJiB2YWwgPT09ICcnID8gJ29uJyA6IHZhbCkpXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGNhc2UgJ3RleHRhcmVhJzpcbiAgICAgIGNiKG4sIG5vcm1hbGl6ZShlbC52YWx1ZSkpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBpZiAoZWwudHlwZS50b0xvd2VyQ2FzZSgpID09PSAnc2VsZWN0LW9uZScpIHtcbiAgICAgICAgb3B0Q2IoZWwuc2VsZWN0ZWRJbmRleCA+PSAwID8gZWwub3B0aW9uc1tlbC5zZWxlY3RlZEluZGV4XSA6IG51bGwpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwOyBlbC5sZW5ndGggJiYgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZWwub3B0aW9uc1tpXS5zZWxlY3RlZCAmJiBvcHRDYihlbC5vcHRpb25zW2ldKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIC8vIGNvbGxlY3QgdXAgYWxsIGZvcm0gZWxlbWVudHMgZm91bmQgZnJvbSB0aGUgcGFzc2VkIGFyZ3VtZW50IGVsZW1lbnRzIGFsbFxuICAvLyB0aGUgd2F5IGRvd24gdG8gY2hpbGQgZWxlbWVudHM7IHBhc3MgYSAnPGZvcm0+JyBvciBmb3JtIGZpZWxkcy5cbiAgLy8gY2FsbGVkIHdpdGggJ3RoaXMnPWNhbGxiYWNrIHRvIHVzZSBmb3Igc2VyaWFsKCkgb24gZWFjaCBlbGVtZW50XG4gIGZ1bmN0aW9uIGVhY2hGb3JtRWxlbWVudCgpIHtcbiAgICB2YXIgY2IgPSB0aGlzXG4gICAgICAsIGUsIGlcbiAgICAgICwgc2VyaWFsaXplU3VidGFncyA9IGZ1bmN0aW9uIChlLCB0YWdzKSB7XG4gICAgICAgICAgdmFyIGksIGosIGZhXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZhID0gZVtieVRhZ10odGFnc1tpXSlcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBmYS5sZW5ndGg7IGorKykgc2VyaWFsKGZhW2pdLCBjYilcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGUgPSBhcmd1bWVudHNbaV1cbiAgICAgIGlmICgvaW5wdXR8c2VsZWN0fHRleHRhcmVhL2kudGVzdChlLnRhZ05hbWUpKSBzZXJpYWwoZSwgY2IpXG4gICAgICBzZXJpYWxpemVTdWJ0YWdzKGUsIFsgJ2lucHV0JywgJ3NlbGVjdCcsICd0ZXh0YXJlYScgXSlcbiAgICB9XG4gIH1cblxuICAvLyBzdGFuZGFyZCBxdWVyeSBzdHJpbmcgc3R5bGUgc2VyaWFsaXphdGlvblxuICBmdW5jdGlvbiBzZXJpYWxpemVRdWVyeVN0cmluZygpIHtcbiAgICByZXR1cm4gcmVxd2VzdC50b1F1ZXJ5U3RyaW5nKHJlcXdlc3Quc2VyaWFsaXplQXJyYXkuYXBwbHkobnVsbCwgYXJndW1lbnRzKSlcbiAgfVxuXG4gIC8vIHsgJ25hbWUnOiAndmFsdWUnLCAuLi4gfSBzdHlsZSBzZXJpYWxpemF0aW9uXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZUhhc2goKSB7XG4gICAgdmFyIGhhc2ggPSB7fVxuICAgIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgIGlmIChuYW1lIGluIGhhc2gpIHtcbiAgICAgICAgaGFzaFtuYW1lXSAmJiAhaXNBcnJheShoYXNoW25hbWVdKSAmJiAoaGFzaFtuYW1lXSA9IFtoYXNoW25hbWVdXSlcbiAgICAgICAgaGFzaFtuYW1lXS5wdXNoKHZhbHVlKVxuICAgICAgfSBlbHNlIGhhc2hbbmFtZV0gPSB2YWx1ZVxuICAgIH0sIGFyZ3VtZW50cylcbiAgICByZXR1cm4gaGFzaFxuICB9XG5cbiAgLy8gWyB7IG5hbWU6ICduYW1lJywgdmFsdWU6ICd2YWx1ZScgfSwgLi4uIF0gc3R5bGUgc2VyaWFsaXphdGlvblxuICByZXF3ZXN0LnNlcmlhbGl6ZUFycmF5ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcnIgPSBbXVxuICAgIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbiAobmFtZSwgdmFsdWUpIHtcbiAgICAgIGFyci5wdXNoKHtuYW1lOiBuYW1lLCB2YWx1ZTogdmFsdWV9KVxuICAgIH0sIGFyZ3VtZW50cylcbiAgICByZXR1cm4gYXJyXG4gIH1cblxuICByZXF3ZXN0LnNlcmlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gICAgdmFyIG9wdCwgZm5cbiAgICAgICwgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMClcblxuICAgIG9wdCA9IGFyZ3MucG9wKClcbiAgICBvcHQgJiYgb3B0Lm5vZGVUeXBlICYmIGFyZ3MucHVzaChvcHQpICYmIChvcHQgPSBudWxsKVxuICAgIG9wdCAmJiAob3B0ID0gb3B0LnR5cGUpXG5cbiAgICBpZiAob3B0ID09ICdtYXAnKSBmbiA9IHNlcmlhbGl6ZUhhc2hcbiAgICBlbHNlIGlmIChvcHQgPT0gJ2FycmF5JykgZm4gPSByZXF3ZXN0LnNlcmlhbGl6ZUFycmF5XG4gICAgZWxzZSBmbiA9IHNlcmlhbGl6ZVF1ZXJ5U3RyaW5nXG5cbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxuXG4gIHJlcXdlc3QudG9RdWVyeVN0cmluZyA9IGZ1bmN0aW9uIChvLCB0cmFkKSB7XG4gICAgdmFyIHByZWZpeCwgaVxuICAgICAgLCB0cmFkaXRpb25hbCA9IHRyYWQgfHwgZmFsc2VcbiAgICAgICwgcyA9IFtdXG4gICAgICAsIGVuYyA9IGVuY29kZVVSSUNvbXBvbmVudFxuICAgICAgLCBhZGQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgIC8vIElmIHZhbHVlIGlzIGEgZnVuY3Rpb24sIGludm9rZSBpdCBhbmQgcmV0dXJuIGl0cyB2YWx1ZVxuICAgICAgICAgIHZhbHVlID0gKCdmdW5jdGlvbicgPT09IHR5cGVvZiB2YWx1ZSkgPyB2YWx1ZSgpIDogKHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlKVxuICAgICAgICAgIHNbcy5sZW5ndGhdID0gZW5jKGtleSkgKyAnPScgKyBlbmModmFsdWUpXG4gICAgICAgIH1cbiAgICAvLyBJZiBhbiBhcnJheSB3YXMgcGFzc2VkIGluLCBhc3N1bWUgdGhhdCBpdCBpcyBhbiBhcnJheSBvZiBmb3JtIGVsZW1lbnRzLlxuICAgIGlmIChpc0FycmF5KG8pKSB7XG4gICAgICBmb3IgKGkgPSAwOyBvICYmIGkgPCBvLmxlbmd0aDsgaSsrKSBhZGQob1tpXVsnbmFtZSddLCBvW2ldWyd2YWx1ZSddKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0cmFkaXRpb25hbCwgZW5jb2RlIHRoZSBcIm9sZFwiIHdheSAodGhlIHdheSAxLjMuMiBvciBvbGRlclxuICAgICAgLy8gZGlkIGl0KSwgb3RoZXJ3aXNlIGVuY29kZSBwYXJhbXMgcmVjdXJzaXZlbHkuXG4gICAgICBmb3IgKHByZWZpeCBpbiBvKSB7XG4gICAgICAgIGlmIChvLmhhc093blByb3BlcnR5KHByZWZpeCkpIGJ1aWxkUGFyYW1zKHByZWZpeCwgb1twcmVmaXhdLCB0cmFkaXRpb25hbCwgYWRkKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNwYWNlcyBzaG91bGQgYmUgKyBhY2NvcmRpbmcgdG8gc3BlY1xuICAgIHJldHVybiBzLmpvaW4oJyYnKS5yZXBsYWNlKC8lMjAvZywgJysnKVxuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRQYXJhbXMocHJlZml4LCBvYmosIHRyYWRpdGlvbmFsLCBhZGQpIHtcbiAgICB2YXIgbmFtZSwgaSwgdlxuICAgICAgLCByYnJhY2tldCA9IC9cXFtcXF0kL1xuXG4gICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgLy8gU2VyaWFsaXplIGFycmF5IGl0ZW0uXG4gICAgICBmb3IgKGkgPSAwOyBvYmogJiYgaSA8IG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgICB2ID0gb2JqW2ldXG4gICAgICAgIGlmICh0cmFkaXRpb25hbCB8fCByYnJhY2tldC50ZXN0KHByZWZpeCkpIHtcbiAgICAgICAgICAvLyBUcmVhdCBlYWNoIGFycmF5IGl0ZW0gYXMgYSBzY2FsYXIuXG4gICAgICAgICAgYWRkKHByZWZpeCwgdilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBidWlsZFBhcmFtcyhwcmVmaXggKyAnWycgKyAodHlwZW9mIHYgPT09ICdvYmplY3QnID8gaSA6ICcnKSArICddJywgdiwgdHJhZGl0aW9uYWwsIGFkZClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob2JqICYmIG9iai50b1N0cmluZygpID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgLy8gU2VyaWFsaXplIG9iamVjdCBpdGVtLlxuICAgICAgZm9yIChuYW1lIGluIG9iaikge1xuICAgICAgICBidWlsZFBhcmFtcyhwcmVmaXggKyAnWycgKyBuYW1lICsgJ10nLCBvYmpbbmFtZV0sIHRyYWRpdGlvbmFsLCBhZGQpXG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU2VyaWFsaXplIHNjYWxhciBpdGVtLlxuICAgICAgYWRkKHByZWZpeCwgb2JqKVxuICAgIH1cbiAgfVxuXG4gIHJlcXdlc3QuZ2V0Y2FsbGJhY2tQcmVmaXggPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrUHJlZml4XG4gIH1cblxuICAvLyBqUXVlcnkgYW5kIFplcHRvIGNvbXBhdGliaWxpdHksIGRpZmZlcmVuY2VzIGNhbiBiZSByZW1hcHBlZCBoZXJlIHNvIHlvdSBjYW4gY2FsbFxuICAvLyAuYWpheC5jb21wYXQob3B0aW9ucywgY2FsbGJhY2spXG4gIHJlcXdlc3QuY29tcGF0ID0gZnVuY3Rpb24gKG8sIGZuKSB7XG4gICAgaWYgKG8pIHtcbiAgICAgIG9bJ3R5cGUnXSAmJiAob1snbWV0aG9kJ10gPSBvWyd0eXBlJ10pICYmIGRlbGV0ZSBvWyd0eXBlJ11cbiAgICAgIG9bJ2RhdGFUeXBlJ10gJiYgKG9bJ3R5cGUnXSA9IG9bJ2RhdGFUeXBlJ10pXG4gICAgICBvWydqc29ucENhbGxiYWNrJ10gJiYgKG9bJ2pzb25wQ2FsbGJhY2tOYW1lJ10gPSBvWydqc29ucENhbGxiYWNrJ10pICYmIGRlbGV0ZSBvWydqc29ucENhbGxiYWNrJ11cbiAgICAgIG9bJ2pzb25wJ10gJiYgKG9bJ2pzb25wQ2FsbGJhY2snXSA9IG9bJ2pzb25wJ10pXG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVxd2VzdChvLCBmbilcbiAgfVxuXG4gIHJlcXdlc3QuYWpheFNldHVwID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIGZvciAodmFyIGsgaW4gb3B0aW9ucykge1xuICAgICAgZ2xvYmFsU2V0dXBPcHRpb25zW2tdID0gb3B0aW9uc1trXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXF3ZXN0XG59KTtcbiIsInZhciByZXF3ZXN0ID0gcmVxdWlyZSgnLi4vdmVuZG9yL3JlcXdlc3QubWluJyk7XG5cbi8vIFwiaHR0cDovL2xvY2FsaG9zdDozMDAxL3NlYXJjaD9xPWF1dGhvcnM6JTIyUmljaGFyZCUyME1jR3JlZ29yJTIyXCJcblxuZnVuY3Rpb24gc2V0Q29udGV4dChwYXRoLCBkaXNwbGF5KSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oY29udGV4dEtleSwgcGF0aCk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oY29udGV4dFRpdGxlS2V5LCBkaXNwbGF5KTtcbn1cblxudmFyIG9uQXJ0aWNsZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgcmV0dXJuIC9eXFwvW2EtZjAtOV0rLSguKikvLnRlc3QocGF0aCk7IC8vICcyN2E1ZTI4Ni00MzE0LTExZTQtOGE0My0wMDE0NGZlYWJkYzAnOyBcbn07XG5cbnZhciAkID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufTtcblxudmFyIGVtaXQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ2VtaXR0aW5nJywgbmFtZSwgZGF0YSk7XG4gICAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICAgIGlmIChkYXRhKSB7XG4gICAgICAgIGV2ZW50LmRldGFpbCA9IGRhdGE7XG4gICAgfVxuICAgIHRvcC5kb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cbmZ1bmN0aW9uIGV4dHJhY3RTZWFyY2hUZXJtKHF1ZXJ5U3RyaW5nKSB7XG4gICAgcmV0dXJuIHF1ZXJ5U3RyaW5nLm1hdGNoKC9xPShbXiZdKikvKVsxXTtcbn1cblxudmFyIGNvbnRleHRLZXkgPSAnZnQuc3RyZWFtLmNvbnRleHQudXJsJztcbnZhciBjb250ZXh0VGl0bGVLZXkgPSAnZnQuc3RyZWFtLmNvbnRleHQuZGlzcGxheSc7XG52YXIgZGlzcGxheSwgY29udGV4dDtcblxuLyogMS4gaW4gc3RyZWFtIG1vZGUgc3RvcmUgdGhlIGNvbnRleHQgVVJMIGFuZCBjb250ZW50IGRpc3BsYXkgbmFtZSAqL1xuaWYgKCFvbkFydGljbGUobG9jYXRpb24ucGF0aG5hbWUpKSB7XG4gICAgLy8gRXZlcnkgdGltZSB5b3UgaGl0IGEgbmV3IHN0cmVhbSwgeW91IGVudGVyIGEgbmV3IGNvbnRleHRcbiAgICBjb250ZXh0ID0gZXh0cmFjdFNlYXJjaFRlcm0obG9jYXRpb24uc2VhcmNoKTtcbiAgICBkaXNwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnanMtY29udGV4dCcpWzBdLnRleHRDb250ZW50LnRyaW0oKTtcbiAgICBzZXRDb250ZXh0KGNvbnRleHQsIGRpc3BsYXkpO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGNvbnRleHRUaXRsZUtleSwgZGlzcGxheSk7XG4gICAgZW1pdCgnc3RyZWFtOm9wZW4nLCB7aWQ6IGNvbnRleHR9KTtcbn0gZWxzZSB7XG4gICAgY29udGV4dCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGNvbnRleHRLZXkpO1xuICAgIGRpc3BsYXkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShjb250ZXh0VGl0bGVLZXkpO1xuICAgIGlmKCFjb250ZXh0KSB7IFxuICAgICAgICAvL0lmIHRoZXkgY29tZSBkaXJlY3RseSB0byBhbiBhcnRpY2xlIHdpdGggbm8gaGlzdG9yeSwgdXNlIHRoZSBmaXJzdCB0aGVtZSBmb3IgdGhpcyBhcnRpY2xlXG4gICAgICAgIGNvbnRleHQgPSBleHRyYWN0U2VhcmNoVGVybShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXJ0aWNsZS1jYXJkX190aGVtZXMgYScpLmdldEF0dHJpYnV0ZSgnaHJlZicpKTtcbiAgICAgICAgZGlzcGxheSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcnRpY2xlLWNhcmRfX3RoZW1lcyBhJykudGV4dENvbnRlbnQudHJpbSgpO1xuICAgICAgICBzZXRDb250ZXh0KGNvbnRleHQsIGRpc3BsYXkpO1xuICAgIH1cbn1cblxuLyogMi4gaW4gYXJ0aWNsZSB2aWV3IHJlbmRlciB0aGUgY29udGV4dCBtZW51IGZ1bGwgbW9kZSAqLyAgICBcbmlmIChvbkFydGljbGUobG9jYXRpb24ucGF0aG5hbWUpICYmIGNvbnRleHQpIHtcbiAgICAkKCcuanMtY29udGV4dCcpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oY29udGV4dFRpdGxlS2V5KTtcbiAgICB9KTtcblxufVxuXG4vKiAzLiByZXF1ZXN0IGFuZCByZW5kZXIgdGhlIGNvbnRleHQgbmF2aWdhdGlvbiAqL1xucmVxd2VzdCh7XG4gICAgdXJsOiAnL2NvbnRleHQvc2VhcmNoP3E9JyArIGNvbnRleHQsIFxuICAgIGNyb3NzT3JpZ2luOiB0cnVlLCBcbiAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICQoJy5qcy1jb250ZXh0X19jb250YWluZXInKS5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICB2YXIgbXlUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIG15VGFnLmlubmVySFRNTCA9IHJlcztcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKG15VGFnKTsgXG4gICAgICAgICAgICAvL3NjcmlwdHMgd29udCBleGVjdXRlLCBzbyBncmFiIHRoZW0gYW5kIGFwcGVuZCB0byBoZWFkXG4gICAgICAgICAgICB2YXIgc2NyaXB0cyA9IG15VGFnLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgW10uc2xpY2UuY2FsbChzY3JpcHRzKS5tYXAoZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICAgICAgICBzLnNyYyA9IHNjcmlwdC5zcmM7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnaGFzLWNvbnRleHQnKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbiIsIlxudmFyIHJlcXdlc3QgPSByZXF1aXJlKCcuLi8uLi92ZW5kb3IvcmVxd2VzdC5taW4nKTtcblxuLy8gRW5oYW5jZXMgYW55IHRpY2tlciBzeW1ib2wgZm91bmQgb24gdGhlIHBhZ2Ugd2l0aCBsaXZlIHByaWNpbmcgZGF0YVxuZnVuY3Rpb24gaW5pdCAoKSB7XG5cblxuICAgIGNvbnNvbGUubG9nKCdwcm9nIGVuaGFuY2UgdGlja2VyJyk7XG5cbiAgICB2YXIgaG9zdCA9ICdodHRwOi8vbmV4dC1jb21wYW5pZXMtZXQtYWwuaGVyb2t1YXBwLmNvbS92MS9tb3VzZW92ZXIvY29tcGFueS8nO1xuICAgIHZhciBzeW1ib2xzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmFydGljbGUtY2FyZF9fdGlja2VyLXN5bWJvbHNfX2l0ZW0nKTtcblxuICAgIFtdLnNsaWNlLmNhbGwoc3ltYm9scykuZm9yRWFjaChmdW5jdGlvbiAoc3ltYm9sKSB7XG4gICAgICAgIHZhciBjb2RlID0gc3ltYm9sLmdldEF0dHJpYnV0ZSgnZGF0YS10aWNrZXItc3ltYm9scycpO1xuICAgICAgICByZXF3ZXN0KGhvc3QgKyBjb2RlLCBmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgLy8gZGlkIHRoZSBtYXJrZXQgcHJpY2UgZ28gdXA/XG4gICAgICAgICAgICB2YXIgaXNVcCA9IChwYXJzZUZsb2F0KHJlc3AuZGF0YS5sYXRlc3RfY2hhbmdlLnBlcmNlbnRhZ2UpID49IDApID8gJ3VwJyA6ICdkb3duJzsgXG4gICAgICAgICAgICB2YXIgcHJpY2UgPSByZXNwLmRhdGEubGF0ZXN0X3ByaWNlLmFtb3VudDtcbiAgICAgICAgICAgIHZhciBjaGFuZ2UgPSByZXNwLmRhdGEubGF0ZXN0X2NoYW5nZS5wZXJjZW50YWdlO1xuICAgICAgICAgICAgc3ltYm9sLmlubmVySFRNTCA9ICc8c3BhbiBjbGFzcz1cImFydGljbGUtY2FyZF9fdGlja2VyLXN5bWJvbHNfX2l0ZW0tJyArIGlzVXAgKyAnXCI+JyArIHJlc3AuZGF0YS5yZXR1cm5lZF9zeW1ib2wgKyAnICcgKyBwcmljZSArICcgKCcgKyBjaGFuZ2UgICsgJyk8L3NwYW4+JztcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbn1cblxuaW5pdCgpO1xuIiwidmFyIHJlcXdlc3QgPSByZXF1aXJlKCcuLi8uLi92ZW5kb3IvcmVxd2VzdC5taW4nKTtcbiAgICBcbnZhciAkID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufTtcblxuJCgnLmpzLW1vcmUtb24nKS5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgIHJlcXdlc3QoJy9tb3JlLW9uLyAnICsgZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWFydGljbGUtaWQnKSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGVsLmlubmVySFRNTCA9IHJlc3A7XG4gICAgICAgICAgICBpZiAod2luZG93Lk9yaWdhbWkpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuT3JpZ2FtaVsnby1kYXRlJ10uaW5pdChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbCk7XG4gICAgICAgIH0pO1xufSk7XG5cblxuXG4iLCJcbi8vIFRISVMgV0hPTEUgVEhJTkcgSVMgQSBDQVIgQ1JBU0ggQU5EIE5FRURTIFRPIEJFIFNPUlRFRCBPVVRcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoZXZ0KSB7XG5cbiAgICB2YXIgJCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gICAgfTtcblxuICAgIHZhciBvbkFydGljbGUgPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICByZXR1cm4gL15cXC9bYS1mMC05XSstKC4qKS8udGVzdChwYXRoKTsgLy8gJzI3YTVlMjg2LTQzMTQtMTFlNC04YTQzLTAwMTQ0ZmVhYmRjMCc7IFxuICAgIH07XG5cbiAgICB2YXIgZW1pdCA9IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgICAgIGV2ZW50LmluaXRFdmVudChuYW1lLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgIGV2ZW50LmRldGFpbCA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgdG9wLmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH07XG5cblxuICAgIHZhciBjb250ZXh0S2V5ID0gJ2Z0LnN0cmVhbS5jb250ZXh0LnVybCc7XG4gICAgdmFyIGNvbnRleHRUaXRsZUtleSA9ICdmdC5zdHJlYW0uY29udGV4dC5kaXNwbGF5JztcblxuICAgIHZhciBzdHJlYW1QYXRoID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oY29udGV4dEtleSk7XG4gICAgdmFyIHN0cmVhbU5hbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShjb250ZXh0VGl0bGVLZXkpO1xuXG5cbiAgICBmdW5jdGlvbiB0b2dnbGUoa2V5LCBkYXRhLCBzYXZlQnRuKSB7XG4gICAgICAgIHZhciBpc1NhdmVkID0gKHNhdmVCdG4uZ2V0QXR0cmlidXRlKCdkYXRhLWlzLXNhdmVkJykgPT09IFwidHJ1ZVwiKTtcbiAgICAgICAgaWYoaXNTYXZlZCkge1xuICAgICAgICAgICAgZW1pdChrZXkgKyAnOnJlbW92ZScsIGRhdGEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZW1pdChrZXkgKyAnOmFkZCcsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRvZ2dsZUJ1dHRvblN0YXRlKHNhdmVCdG4pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvZ2dsZUJ1dHRvblN0YXRlKHNhdmVCdG4pIHtcbiAgICAgICAgdmFyIGlzU2F2ZWQgPSAoc2F2ZUJ0bi5nZXRBdHRyaWJ1dGUoJ2RhdGEtaXMtc2F2ZWQnKSA9PT0gXCJ0cnVlXCIpO1xuICAgICAgICB2YXIgZXhpc3RpbmdUZXh0ID0gc2F2ZUJ0bi50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICAgIHNhdmVCdG4udGV4dENvbnRlbnQgPSBzYXZlQnRuLmdldEF0dHJpYnV0ZSgnZGF0YS10b2dnbGUtdGV4dCcpO1xuICAgICAgICBzYXZlQnRuLnNldEF0dHJpYnV0ZSgnZGF0YS10b2dnbGUtdGV4dCcsIGV4aXN0aW5nVGV4dCk7XG4gICAgICAgIHNhdmVCdG4uc2V0QXR0cmlidXRlKCdkYXRhLWlzLXNhdmVkJywgaXNTYXZlZCA/ICdmYWxzZScgOiAndHJ1ZScpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0cmlwTGVhZGluZ1NsYXNoKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGgucmVwbGFjZSgvXlxcL3xcXC8kL2csICcnKTtcbiAgICB9XG5cbiAgICAvL09uIGNsaWNrIG9mIHNhdmUgYnV0dG9ucywgdHJpZ2dlciB0aGUgYWRkL3JlbW92ZSBldmVudCBhbmQgdXBkYXRlIHRoZSBVSSBvZiB0aGUgYnV0dG9uXG4gICAgJCgnLmpzLXNhdmVfX2J1dHRvbltkYXRhLXNhdmUtdGFyZ2V0PVwiZmF2b3VyaXRlc1wiXScpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHsgJ3V1aWR2Myc6IHN0cmVhbVBhdGgsICdkaXNwbGF5VGV4dCc6IHN0cmVhbU5hbWUsICdyZXNvdXJjZVR5cGUnOiAnc3RyZWFtJ307XG4gICAgICAgICAgICB0b2dnbGUoJ2Zhdm91cml0ZXMnLCBkYXRhLCBlbCk7XG5cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAkKCcuanMtc2F2ZV9fYnV0dG9uW2RhdGEtc2F2ZS10YXJnZXQ9XCJmb3JsYXRlcnNcIl0nKS5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgdmFyIGhlYWRsaW5lID0gdGhpcy5wYXJlbnRFbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2FydGljbGUtY2FyZF9fbGluaycpWzBdO1xuICAgICAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgJ3V1aWR2Myc6IHN0cmlwTGVhZGluZ1NsYXNoKGhlYWRsaW5lLmdldEF0dHJpYnV0ZSgnaHJlZicpKSwgLy9yZW1vdmUgbGVhZGluZyBzbGFzaCBcbiAgICAgICAgICAgICAgICAnZGlzcGxheVRleHQnOiBoZWFkbGluZS50ZXh0Q29udGVudC50cmltKCksIFxuICAgICAgICAgICAgICAgICdyZXNvdXJjZVR5cGUnOiAnYXJ0aWNsZScgLy9GaXggdG8gYXJ0aWNsZSBmb3Igbm93XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdG9nZ2xlKCdmb3JsYXRlcnMnLCBkYXRhLCBlbCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG5cbiAgICAvL09uIHBhZ2UgbG9hZCwganVzdCB1cGRhdGUgdGhlIFVJIG9mIHRoZSBidXR0b25cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmYXZvdXJpdGVzOmxvYWQnLCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgJCgnLmpzLXNhdmVfX2J1dHRvbltkYXRhLXNhdmUtdGFyZ2V0PVwiZmF2b3VyaXRlc1wiXScpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHZhciBpc1NhdmVkID0gZXZ0LmRldGFpbC5leGlzdHMoc3RyZWFtUGF0aCk7XG4gICAgICAgICAgICBpZihpc1NhdmVkKSB7XG4gICAgICAgICAgICAgICAgdG9nZ2xlQnV0dG9uU3RhdGUoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmb3JsYXRlcnM6bG9hZCcsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAkKCcuanMtc2F2ZV9fYnV0dG9uW2RhdGEtc2F2ZS10YXJnZXQ9XCJmb3JsYXRlcnNcIl0nKS5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICB2YXIgaGVhZGxpbmUgPSBlbC5wYXJlbnRFbGVtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2FydGljbGUtY2FyZF9fbGluaycpWzBdO1xuICAgICAgICAgICAgdmFyIGlzU2F2ZWQgPSBldnQuZGV0YWlsLmV4aXN0cyhzdHJpcExlYWRpbmdTbGFzaChoZWFkbGluZS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSkpO1xuICAgICAgICAgICAgaWYoaXNTYXZlZCkge1xuICAgICAgICAgICAgICAgIHRvZ2dsZUJ1dHRvblN0YXRlKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBzYXZlSGlzdG9yeSgpIHtcbiAgICAgICAgdmFyIGRhdGEsIGhlYWRsaW5lO1xuICAgICAgICBpZihvbkFydGljbGUobG9jYXRpb24ucGF0aG5hbWUpKSB7XG4gICAgICAgICAgICBoZWFkbGluZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcnRpY2xlLWNhcmRfX2hlYWRsaW5lIC5hcnRpY2xlLWNhcmRfX2xpbmsnKTtcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgJ3V1aWR2Myc6IHN0cmlwTGVhZGluZ1NsYXNoKGhlYWRsaW5lLmdldEF0dHJpYnV0ZSgnaHJlZicpKSwgLy9yZW1vdmUgbGVhZGluZyBzbGFzaCBcbiAgICAgICAgICAgICAgICAnZGlzcGxheVRleHQnOiBoZWFkbGluZS50ZXh0Q29udGVudC50cmltKCksIFxuICAgICAgICAgICAgICAgICdyZXNvdXJjZVR5cGUnOiAnYXJ0aWNsZScgLy9GaXggdG8gYXJ0aWNsZSBmb3Igbm93XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IHsgJ3V1aWR2Myc6IHN0cmVhbVBhdGgsICdkaXNwbGF5VGV4dCc6IHN0cmVhbU5hbWUsICdyZXNvdXJjZVR5cGUnOiAnc3RyZWFtJ307XG4gICAgICAgIH1cbiAgICAgICAgZW1pdCgnaGlzdG9yeTphZGQnLCBkYXRhKTtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdoaXN0b3J5OmxvYWQnLCBzYXZlSGlzdG9yeSk7XG5cbn0pO1xuXG5cbiIsIlxuXG4oZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGVtaXQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdlbWl0dGluZycsIG5hbWUsIGRhdGEpO1xuICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICAgICAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgZXZlbnQuZGV0YWlsID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgICB0b3AuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgICAgICB2YXIgdGltZW91dDtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICAgICAgICBpZiAoY2FsbE5vdykgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaW5kQW5jZXN0b3JCeUNsYXNzTmFtZSAoZWwsIGNscykge1xuICAgICAgICB3aGlsZSAoKGVsID0gZWwucGFyZW50Tm9kZSkgJiYgIWhhc0NsYXNzKGVsLCBjbHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gZWw7ICAgIFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciAkID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgICB9O1xuXG4gICAgLy8gUmVsb2FkIHRoZSBzdHJlYW0gd2hlbiBhbiBpbmRleDpvcGVuIGV2ZW50IGlzIGZpcmVkXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignaW5kZXg6b3BlbicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGxvY2F0aW9uLmhyZWYgPSAnL3N0cmVhbS8nICsgZS5kZXRhaWwuc3RyZWFtO1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignaW5kZXg6Y2FwaScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNjYXBpLScgKyBlLmRldGFpbC5jYXBpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrbmFtZSsnKFxcXFxzfCQpJykudGVzdChlbC5jbGFzc05hbWUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKSB7XG4gICAgICAgIGlmICghaGFzQ2xhc3MoZWwsIG5hbWUpKSB7IGVsLmNsYXNzTmFtZSArPSAoZWwuY2xhc3NOYW1lID8gJyAnIDogJycpICtuYW1lOyB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpIHtcbiAgICAgICAgaWYgKGhhc0NsYXNzKGVsLCBuYW1lKSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lPWVsLmNsYXNzTmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoJyhcXFxcc3xeKScrbmFtZSsnKFxcXFxzfCQpJyksJyAnKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b2dnbGVDbGFzcyhlbCwgbmFtZSkge1xuICAgICAgICBpZiAoaGFzQ2xhc3MoZWwsIG5hbWUpKSByZW1vdmVDbGFzcyhlbCwgbmFtZSk7XG4gICAgICAgIGVsc2UgYWRkQ2xhc3MoZWwsIG5hbWUpO1xuICAgIH1cblxuICAgIC8qIEFsbG93IGFsbCBhcnRpY2xlcyB0byBiZSBvcGVuZWQgaW5saW5lICovXG4gICAgLy9UT0RPOiB0aGlzIHdpbGwgaW50ZXJhY3Qgd2l0aCBzaW5nbGUtYXJ0aWNsZSB0b2dnbGUgYmVsb3c7XG4gICAgLy9uZWVkcyBhIHJlZmFjdG9yIHdoZW4gcmUtaW1wbGVtZW50ZWRcbiAgICAkKCcuYXJ0aWNsZS1jYXJkX19tb3JlLmpzLXRvZ2dsZScpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICB0b2dnbGVDbGFzcyhlbCwgJ2pzLWFjdGl2ZScpO1xuICAgICAgICAgICAgZWwudGV4dENvbnRlbnQgPSBoYXNDbGFzcyhlbCwgJ2pzLWFjdGl2ZScpID8gJ0Nsb3NlJyA6ICdPcGVuJztcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLmdldEF0dHJpYnV0ZSgnZGF0YS10b2dnbGUnKTtcbiAgICAgICAgICAgICQodGFyZ2V0KS5tYXAoZnVuY3Rpb24gKGVsbSkge1xuICAgICAgICAgICAgICAgIHRvZ2dsZUNsYXNzKGVsbSwgJ2pzLXNob3cnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qIEFsbG93IHNpbmdsZSBhcnRpY2xlIHRvIGJlIG9wZW5lZCBpbmxpbmUgKi9cbiAgICAkKCcuYXJ0aWNsZS1jYXJkX19leHBhbmQuanMtdG9nZ2xlJykubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdkYXRhLXRvZ2dsZScpLFxuICAgICAgICAgICAgICAgIGFydGljbGUgPSBmaW5kQW5jZXN0b3JCeUNsYXNzTmFtZShlbCwgdGFyZ2V0KSxcbiAgICAgICAgICAgICAgICBpY29uID0gZWwucXVlcnlTZWxlY3RvcignaScpXG4gICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgdG9nZ2xlQ2xhc3MoaWNvbiwgJ2ljb24tYXJyb3ctdXAnKTtcbiAgICAgICAgICAgIHRvZ2dsZUNsYXNzKGljb24sICdpY29uLWFycm93LWRvd24nKTtcbiAgICAgICAgICAgIHRvZ2dsZUNsYXNzKGFydGljbGUucXVlcnlTZWxlY3Rvcih0YXJnZXQpLCAnanMtc2hvdycpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICB2YXIgdHJhY2tzID0gJCgnLmFydGljbGUtY2FyZF9faGVhZGxpbmUnKTtcblxuICAgIGZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnQgKGVsKSB7XG4gICAgICAgIHZhciByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHJldHVybiAoXG5cbiAgICAgICAgICAgIC8vIEZJWE1FIGlzIDI1JSBmcm9tIHRoZSB0b3BcbiAgICAgICAgICAgIHJlY3QudG9wID49IDAgJiZcbiAgICAgICAgICAgIHJlY3QubGVmdCA+PSAwICYmXG4gICAgICAgICAgICByZWN0LmJvdHRvbSA8PSAod2luZG93LmlubmVySGVpZ2h0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpICYmIC8qb3IgJCh3aW5kb3cpLmhlaWdodCgpICovXG4gICAgICAgICAgICByZWN0LnJpZ2h0IDw9ICh3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpIC8qb3IgJCh3aW5kb3cpLndpZHRoKCkgKi9cbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHJlYWRhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFJldHVybiB0aGUgSUQgb2YgdGhlIHVwcGVybW9zdCBoZWFkbGluZSBpbiB0aGUgdmlld3BvcnRcbiAgICAgICAgdmFyIGluVmlldyA9IHRyYWNrcy5maWx0ZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNFbGVtZW50SW5WaWV3cG9ydChlbCk7XG4gICAgICAgIH0pLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5wYXJlbnROb2RlLmlkO1xuICAgICAgICB9KVswXTtcblxuICAgICAgICBpZiAoaW5WaWV3ICYmIGluVmlldy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBlbWl0KCdzdHJlYW06aW52aWV3JywgeyBjYXBpOiBpblZpZXcgIH0gKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3cub25zY3JvbGwgPSBkZWJvdW5jZShyZWFkYWJsZSwgNSwgZmFsc2UpO1xuXG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVxd2VzdCA9IHJlcXVpcmUoJy4uL3ZlbmRvci9yZXF3ZXN0Lm1pbicpO1xuXG5cbnZhciAkID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufTtcblxuXG4kKCd2aWRlbycpLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG5cblxuXHRyZXF3ZXN0KCdodHRwOi8vZnQtbmV4dC1icmlnaHRjb3ZlLXByb3h5LWFwaS5oZXJva3VhcHAuY29tLycgKyBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYnJpZ2h0Y292ZS1yZWYnKSlcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcCkge1xuXHRcdFx0dmFyIGRhdGEgPSBKU09OLnBhcnNlKHJlc3ApO1xuXHRcdCAgXHRlbC5zcmMgPSBkYXRhLnJlbmRpdGlvbnNbMF0udXJsO1xuXHRcdH0sIGZ1bmN0aW9uICgpIHtcblx0XHQgIFx0Y29uc29sZS5sb2coJ2Vycm9yOiAnLCBhcmd1bWVudHMpO1xuXHRcdH0pO1xufSk7XG5cblxuIiwidmFyIFJhdmVuID0gcmVxdWlyZShcIi4vLi4vYm93ZXJfY29tcG9uZW50cy9yYXZlbi1qcy9kaXN0L3JhdmVuLmpzXCIpLlJhdmVuO1xuXG5SYXZlbi5jb25maWcoJ2h0dHBzOi8vMTQzMDcwNDc2NmE4NDBiNGIzNjEzMzY2MjMyNGY0ODlAYXBwLmdldHNlbnRyeS5jb20vMzIyODMnLCB7XG4gICAgd2hpdGVsaXN0VXJsczogWyduZXh0LmZ0LmNvbS9kb2JpLyddXG59KS5pbnN0YWxsKCk7XG5cbnJlcXVpcmUoXCIuLy4uL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC1oZWFkZXIvbWFpbi5qc1wiKTtcbnJlcXVpcmUoJy4vY29tcG9uZW50cy9jb250ZXh0Jyk7XG5yZXF1aXJlKCcuL2NvbXBvbmVudHMvc2F2ZS1idXR0b24vbWFpbicpO1xucmVxdWlyZSgnLi9jb21wb25lbnRzL21vcmUtb24vbWFpbicpO1xucmVxdWlyZSgnLi9jb21wb25lbnRzL2xpdmUtcHJpY2VzL21haW4nKTtcbnJlcXVpcmUoJy4vY29tcG9uZW50cy92aWRlbycpO1xucmVxdWlyZSgnLi9jb21wb25lbnRzL3N0cmVhbS9tYWluJyk7XG5cbiJdfQ==
