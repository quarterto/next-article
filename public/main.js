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
        }
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
                icon = el.querySelector('i');
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
require("./../bower_components/next-header/main.js");
require('./components/context');
require('./components/save-button/main');
require('./components/more-on/main');
require('./components/live-prices/main');
require('./components/video');
require('./components/stream/main');

var Raven = require("./../bower_components/raven-js/dist/raven.js").Raven;

Raven.config('https://1430704766a840b4b36133662324f489@app.getsentry.com/32283', {
    whitelistUrls: ['next.ft.com/dobi/']
}).install();
},{"./../bower_components/next-header/main.js":2,"./../bower_components/raven-js/dist/raven.js":9,"./components/context":11,"./components/live-prices/main":12,"./components/more-on/main":13,"./components/save-button/main":14,"./components/stream/main":15,"./components/video":16}],18:[function(require,module,exports){
module.exports=require(8)
},{}]},{},[17])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvbm9kZV9tb2R1bGVzL29yaWdhbWktYnVpbGQtdG9vbHMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzIiwiL1VzZXJzL2FyanVuLmdhZGhpYS9EZXZlbG9wbWVudC9uZXh0L25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtaGVhZGVyL21haW4uanMiLCIvVXNlcnMvYXJqdW4uZ2FkaGlhL0RldmVsb3BtZW50L25leHQvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC1oZWFkZXIvc3JjL2pzL05vdGlmeS5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL2xpYi9NZS5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL2xpYi9Ob3RpZmljYXRpb25Qb2xsZXIuanMiLCIvVXNlcnMvYXJqdW4uZ2FkaGlhL0RldmVsb3BtZW50L25leHQvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC11c2VyLXByZWZlcmVuY2VzL3NyYy9saWIvVXNlclByZWZlcmVuY2VMaXN0LmpzIiwiL1VzZXJzL2FyanVuLmdhZGhpYS9EZXZlbG9wbWVudC9uZXh0L25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbWFpbi5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL3ZlbmRvci9yZXF3ZXN0Lm1pbi5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9yYXZlbi1qcy9kaXN0L3JhdmVuLmpzIiwiL1VzZXJzL2FyanVuLmdhZGhpYS9EZXZlbG9wbWVudC9uZXh0L25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL3JlcXdlc3QvcmVxd2VzdC5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvY2xpZW50L2NvbXBvbmVudHMvY29udGV4dC5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvY2xpZW50L2NvbXBvbmVudHMvbGl2ZS1wcmljZXMvbWFpbi5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvY2xpZW50L2NvbXBvbmVudHMvbW9yZS1vbi9tYWluLmpzIiwiL1VzZXJzL2FyanVuLmdhZGhpYS9EZXZlbG9wbWVudC9uZXh0L25leHQtZG9iaS9jbGllbnQvY29tcG9uZW50cy9zYXZlLWJ1dHRvbi9tYWluLmpzIiwiL1VzZXJzL2FyanVuLmdhZGhpYS9EZXZlbG9wbWVudC9uZXh0L25leHQtZG9iaS9jbGllbnQvY29tcG9uZW50cy9zdHJlYW0vbWFpbi5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvY2xpZW50L2NvbXBvbmVudHMvdmlkZW8uanMiLCIvVXNlcnMvYXJqdW4uZ2FkaGlhL0RldmVsb3BtZW50L25leHQvbmV4dC1kb2JpL2NsaWVudC9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5eURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ptQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlLCBub2RlOnRydWUqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVsZWdhdGU7XG5cbi8qKlxuICogRE9NIGV2ZW50IGRlbGVnYXRvclxuICpcbiAqIFRoZSBkZWxlZ2F0b3Igd2lsbCBsaXN0ZW5cbiAqIGZvciBldmVudHMgdGhhdCBidWJibGUgdXBcbiAqIHRvIHRoZSByb290IG5vZGUuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKi9cbmZ1bmN0aW9uIERlbGVnYXRlKHJvb3QpIHtcblxuICAvKipcbiAgICogTWFpbnRhaW4gYSBtYXAgb2YgbGlzdGVuZXJcbiAgICogbGlzdHMsIGtleWVkIGJ5IGV2ZW50IG5hbWUuXG4gICAqXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKi9cbiAgdGhpcy5saXN0ZW5lck1hcCA9IFt7fSwge31dO1xuICBpZiAocm9vdCkge1xuICAgIHRoaXMucm9vdChyb290KTtcbiAgfVxuXG4gIC8qKiBAdHlwZSBmdW5jdGlvbigpICovXG4gIHRoaXMuaGFuZGxlID0gRGVsZWdhdGUucHJvdG90eXBlLmhhbmRsZS5iaW5kKHRoaXMpO1xufVxuXG4vKipcbiAqIFN0YXJ0IGxpc3RlbmluZyBmb3IgZXZlbnRzXG4gKiBvbiB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0gIHtOb2RlfHN0cmluZ30gW3Jvb3RdIFRoZSByb290IG5vZGUgb3IgYSBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmcgdGhlIHJvb3Qgbm9kZVxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLnJvb3QgPSBmdW5jdGlvbihyb290KSB7XG4gIHZhciBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXA7XG4gIHZhciBldmVudFR5cGU7XG5cbiAgLy8gUmVtb3ZlIG1hc3RlciBldmVudCBsaXN0ZW5lcnNcbiAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFsxXSkge1xuICAgICAgaWYgKGxpc3RlbmVyTWFwWzFdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFswXSkge1xuICAgICAgaWYgKGxpc3RlbmVyTWFwWzBdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBubyByb290IG9yIHJvb3QgaXMgbm90XG4gIC8vIGEgZG9tIG5vZGUsIHRoZW4gcmVtb3ZlIGludGVybmFsXG4gIC8vIHJvb3QgcmVmZXJlbmNlIGFuZCBleGl0IGhlcmVcbiAgaWYgKCFyb290IHx8ICFyb290LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgICAgZGVsZXRlIHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSByb290IG5vZGUgYXQgd2hpY2hcbiAgICogbGlzdGVuZXJzIGFyZSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHR5cGUgTm9kZVxuICAgKi9cbiAgdGhpcy5yb290RWxlbWVudCA9IHJvb3Q7XG5cbiAgLy8gU2V0IHVwIG1hc3RlciBldmVudCBsaXN0ZW5lcnNcbiAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMV0pIHtcbiAgICBpZiAobGlzdGVuZXJNYXBbMV0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHRydWUpO1xuICAgIH1cbiAgfVxuICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFswXSkge1xuICAgIGlmIChsaXN0ZW5lck1hcFswXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5jYXB0dXJlRm9yVHlwZSA9IGZ1bmN0aW9uKGV2ZW50VHlwZSkge1xuICByZXR1cm4gWydibHVyJywgJ2Vycm9yJywgJ2ZvY3VzJywgJ2xvYWQnLCAncmVzaXplJywgJ3Njcm9sbCddLmluZGV4T2YoZXZlbnRUeXBlKSAhPT0gLTE7XG59O1xuXG4vKipcbiAqIEF0dGFjaCBhIGhhbmRsZXIgdG8gb25lXG4gKiBldmVudCBmb3IgYWxsIGVsZW1lbnRzXG4gKiB0aGF0IG1hdGNoIHRoZSBzZWxlY3RvcixcbiAqIG5vdyBvciBpbiB0aGUgZnV0dXJlXG4gKlxuICogVGhlIGhhbmRsZXIgZnVuY3Rpb24gcmVjZWl2ZXNcbiAqIHRocmVlIGFyZ3VtZW50czogdGhlIERPTSBldmVudFxuICogb2JqZWN0LCB0aGUgbm9kZSB0aGF0IG1hdGNoZWRcbiAqIHRoZSBzZWxlY3RvciB3aGlsZSB0aGUgZXZlbnRcbiAqIHdhcyBidWJibGluZyBhbmQgYSByZWZlcmVuY2VcbiAqIHRvIGl0c2VsZi4gV2l0aGluIHRoZSBoYW5kbGVyLFxuICogJ3RoaXMnIGlzIGVxdWFsIHRvIHRoZSBzZWNvbmRcbiAqIGFyZ3VtZW50LlxuICpcbiAqIFRoZSBub2RlIHRoYXQgYWN0dWFsbHkgcmVjZWl2ZWRcbiAqIHRoZSBldmVudCBjYW4gYmUgYWNjZXNzZWQgdmlhXG4gKiAnZXZlbnQudGFyZ2V0Jy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIExpc3RlbiBmb3IgdGhlc2UgZXZlbnRzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNlbGVjdG9yIE9ubHkgaGFuZGxlIGV2ZW50cyBvbiBlbGVtZW50cyBtYXRjaGluZyB0aGlzIHNlbGVjdG9yLCBpZiB1bmRlZmluZWQgbWF0Y2ggcm9vdCBlbGVtZW50XG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IGhhbmRsZXIgSGFuZGxlciBmdW5jdGlvbiAtIGV2ZW50IGRhdGEgcGFzc2VkIGhlcmUgd2lsbCBiZSBpbiBldmVudC5kYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gW2V2ZW50RGF0YV0gRGF0YSB0byBwYXNzIGluIGV2ZW50LmRhdGFcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgdmFyIHJvb3QsIGxpc3RlbmVyTWFwLCBtYXRjaGVyLCBtYXRjaGVyUGFyYW07XG5cbiAgaWYgKCFldmVudFR5cGUpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGV2ZW50IHR5cGU6ICcgKyBldmVudFR5cGUpO1xuICB9XG5cbiAgLy8gaGFuZGxlciBjYW4gYmUgcGFzc2VkIGFzXG4gIC8vIHRoZSBzZWNvbmQgb3IgdGhpcmQgYXJndW1lbnRcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHVzZUNhcHR1cmUgPSBoYW5kbGVyO1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBzZW5zaWJsZSBkZWZhdWx0c1xuICAvLyBpZiB1c2VDYXB0dXJlIG5vdCBzZXRcbiAgaWYgKHVzZUNhcHR1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgIHVzZUNhcHR1cmUgPSB0aGlzLmNhcHR1cmVGb3JUeXBlKGV2ZW50VHlwZSk7XG4gIH1cblxuICBpZiAodHlwZW9mIGhhbmRsZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdIYW5kbGVyIG11c3QgYmUgYSB0eXBlIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwW3VzZUNhcHR1cmUgPyAxIDogMF07XG5cbiAgLy8gQWRkIG1hc3RlciBoYW5kbGVyIGZvciB0eXBlIGlmIG5vdCBjcmVhdGVkIHlldFxuICBpZiAoIWxpc3RlbmVyTWFwW2V2ZW50VHlwZV0pIHtcbiAgICBpZiAocm9vdCkge1xuICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHVzZUNhcHR1cmUpO1xuICAgIH1cbiAgICBsaXN0ZW5lck1hcFtldmVudFR5cGVdID0gW107XG4gIH1cblxuICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gbnVsbDtcblxuICAgIC8vIENPTVBMRVggLSBtYXRjaGVzUm9vdCBuZWVkcyB0byBoYXZlIGFjY2VzcyB0b1xuICAgIC8vIHRoaXMucm9vdEVsZW1lbnQsIHNvIGJpbmQgdGhlIGZ1bmN0aW9uIHRvIHRoaXMuXG4gICAgbWF0Y2hlciA9IG1hdGNoZXNSb290LmJpbmQodGhpcyk7XG5cbiAgLy8gQ29tcGlsZSBhIG1hdGNoZXIgZm9yIHRoZSBnaXZlbiBzZWxlY3RvclxuICB9IGVsc2UgaWYgKC9eW2Etel0rJC9pLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3I7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXNUYWc7XG4gIH0gZWxzZSBpZiAoL14jW2EtejAtOVxcLV9dKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yLnNsaWNlKDEpO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzSWQ7XG4gIH0gZWxzZSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3I7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXM7XG4gIH1cblxuICAvLyBBZGQgdG8gdGhlIGxpc3Qgb2YgbGlzdGVuZXJzXG4gIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0ucHVzaCh7XG4gICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgbWF0Y2hlcjogbWF0Y2hlcixcbiAgICBtYXRjaGVyUGFyYW06IG1hdGNoZXJQYXJhbVxuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFuIGV2ZW50IGhhbmRsZXJcbiAqIGZvciBlbGVtZW50cyB0aGF0IG1hdGNoXG4gKiB0aGUgc2VsZWN0b3IsIGZvcmV2ZXJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW2V2ZW50VHlwZV0gUmVtb3ZlIGhhbmRsZXJzIGZvciBldmVudHMgbWF0Y2hpbmcgdGhpcyB0eXBlLCBjb25zaWRlcmluZyB0aGUgb3RoZXIgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd9IFtzZWxlY3Rvcl0gSWYgdGhpcyBwYXJhbWV0ZXIgaXMgb21pdHRlZCwgb25seSBoYW5kbGVycyB3aGljaCBtYXRjaCB0aGUgb3RoZXIgdHdvIHdpbGwgYmUgcmVtb3ZlZFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBbaGFuZGxlcl0gSWYgdGhpcyBwYXJhbWV0ZXIgaXMgb21pdHRlZCwgb25seSBoYW5kbGVycyB3aGljaCBtYXRjaCB0aGUgcHJldmlvdXMgdHdvIHdpbGwgYmUgcmVtb3ZlZFxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgdmFyIGksIGxpc3RlbmVyLCBsaXN0ZW5lck1hcCwgbGlzdGVuZXJMaXN0LCBzaW5nbGVFdmVudFR5cGU7XG5cbiAgLy8gSGFuZGxlciBjYW4gYmUgcGFzc2VkIGFzXG4gIC8vIHRoZSBzZWNvbmQgb3IgdGhpcmQgYXJndW1lbnRcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHVzZUNhcHR1cmUgPSBoYW5kbGVyO1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gIH1cblxuICAvLyBJZiB1c2VDYXB0dXJlIG5vdCBzZXQsIHJlbW92ZVxuICAvLyBhbGwgZXZlbnQgbGlzdGVuZXJzXG4gIGlmICh1c2VDYXB0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLm9mZihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB0cnVlKTtcbiAgICB0aGlzLm9mZihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXBbdXNlQ2FwdHVyZSA/IDEgOiAwXTtcbiAgaWYgKCFldmVudFR5cGUpIHtcbiAgICBmb3IgKHNpbmdsZUV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcCkge1xuICAgICAgaWYgKGxpc3RlbmVyTWFwLmhhc093blByb3BlcnR5KHNpbmdsZUV2ZW50VHlwZSkpIHtcbiAgICAgICAgdGhpcy5vZmYoc2luZ2xlRXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lck1hcFtldmVudFR5cGVdO1xuICBpZiAoIWxpc3RlbmVyTGlzdCB8fCAhbGlzdGVuZXJMaXN0Lmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gUmVtb3ZlIG9ubHkgcGFyYW1ldGVyIG1hdGNoZXNcbiAgLy8gaWYgc3BlY2lmaWVkXG4gIGZvciAoaSA9IGxpc3RlbmVyTGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGxpc3RlbmVyID0gbGlzdGVuZXJMaXN0W2ldO1xuXG4gICAgaWYgKCghc2VsZWN0b3IgfHwgc2VsZWN0b3IgPT09IGxpc3RlbmVyLnNlbGVjdG9yKSAmJiAoIWhhbmRsZXIgfHwgaGFuZGxlciA9PT0gbGlzdGVuZXIuaGFuZGxlcikpIHtcbiAgICAgIGxpc3RlbmVyTGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWxsIGxpc3RlbmVycyByZW1vdmVkXG4gIGlmICghbGlzdGVuZXJMaXN0Lmxlbmd0aCkge1xuICAgIGRlbGV0ZSBsaXN0ZW5lck1hcFtldmVudFR5cGVdO1xuXG4gICAgLy8gUmVtb3ZlIHRoZSBtYWluIGhhbmRsZXJcbiAgICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHVzZUNhcHR1cmUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKipcbiAqIEhhbmRsZSBhbiBhcmJpdHJhcnkgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmhhbmRsZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gIHZhciBpLCBsLCB0eXBlID0gZXZlbnQudHlwZSwgcm9vdCwgcGhhc2UsIGxpc3RlbmVyLCByZXR1cm5lZCwgbGlzdGVuZXJMaXN0ID0gW10sIHRhcmdldCwgLyoqIEBjb25zdCAqLyBFVkVOVElHTk9SRSA9ICdmdExhYnNEZWxlZ2F0ZUlnbm9yZSc7XG5cbiAgaWYgKGV2ZW50W0VWRU5USUdOT1JFXSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRhcmdldCA9IGV2ZW50LnRhcmdldDtcblxuICAvLyBIYXJkY29kZSB2YWx1ZSBvZiBOb2RlLlRFWFRfTk9ERVxuICAvLyBhcyBub3QgZGVmaW5lZCBpbiBJRThcbiAgaWYgKHRhcmdldC5ub2RlVHlwZSA9PT0gMykge1xuICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICB9XG5cbiAgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG5cbiAgcGhhc2UgPSBldmVudC5ldmVudFBoYXNlIHx8ICggZXZlbnQudGFyZ2V0ICE9PSBldmVudC5jdXJyZW50VGFyZ2V0ID8gMyA6IDIgKTtcbiAgXG4gIHN3aXRjaCAocGhhc2UpIHtcbiAgICBjYXNlIDE6IC8vRXZlbnQuQ0FQVFVSSU5HX1BIQVNFOlxuICAgICAgbGlzdGVuZXJMaXN0ID0gdGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXTtcbiAgICBicmVhaztcbiAgICBjYXNlIDI6IC8vRXZlbnQuQVRfVEFSR0VUOlxuICAgICAgaWYgKHRoaXMubGlzdGVuZXJNYXBbMF0gJiYgdGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXSkgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJMaXN0LmNvbmNhdCh0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdKTtcbiAgICAgIGlmICh0aGlzLmxpc3RlbmVyTWFwWzFdICYmIHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV0pIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTGlzdC5jb25jYXQodGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXSk7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAzOiAvL0V2ZW50LkJVQkJMSU5HX1BIQVNFOlxuICAgICAgbGlzdGVuZXJMaXN0ID0gdGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXTtcbiAgICBicmVhaztcbiAgfVxuXG4gIC8vIE5lZWQgdG8gY29udGludW91c2x5IGNoZWNrXG4gIC8vIHRoYXQgdGhlIHNwZWNpZmljIGxpc3QgaXNcbiAgLy8gc3RpbGwgcG9wdWxhdGVkIGluIGNhc2Ugb25lXG4gIC8vIG9mIHRoZSBjYWxsYmFja3MgYWN0dWFsbHlcbiAgLy8gY2F1c2VzIHRoZSBsaXN0IHRvIGJlIGRlc3Ryb3llZC5cbiAgbCA9IGxpc3RlbmVyTGlzdC5sZW5ndGg7XG4gIHdoaWxlICh0YXJnZXQgJiYgbCkge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyID0gbGlzdGVuZXJMaXN0W2ldO1xuXG4gICAgICAvLyBCYWlsIGZyb20gdGhpcyBsb29wIGlmXG4gICAgICAvLyB0aGUgbGVuZ3RoIGNoYW5nZWQgYW5kXG4gICAgICAvLyBubyBtb3JlIGxpc3RlbmVycyBhcmVcbiAgICAgIC8vIGRlZmluZWQgYmV0d2VlbiBpIGFuZCBsLlxuICAgICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgZm9yIG1hdGNoIGFuZCBmaXJlXG4gICAgICAvLyB0aGUgZXZlbnQgaWYgdGhlcmUncyBvbmVcbiAgICAgIC8vXG4gICAgICAvLyBUT0RPOk1DRzoyMDEyMDExNzogTmVlZCBhIHdheVxuICAgICAgLy8gdG8gY2hlY2sgaWYgZXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uXG4gICAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgYm90aCBsb29wcy5cbiAgICAgIGlmIChsaXN0ZW5lci5tYXRjaGVyLmNhbGwodGFyZ2V0LCBsaXN0ZW5lci5tYXRjaGVyUGFyYW0sIHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuZWQgPSB0aGlzLmZpcmUoZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICAvLyBTdG9wIHByb3BhZ2F0aW9uIHRvIHN1YnNlcXVlbnRcbiAgICAgIC8vIGNhbGxiYWNrcyBpZiB0aGUgY2FsbGJhY2sgcmV0dXJuZWRcbiAgICAgIC8vIGZhbHNlXG4gICAgICBpZiAocmV0dXJuZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIGV2ZW50W0VWRU5USUdOT1JFXSA9IHRydWU7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPOk1DRzoyMDEyMDExNzogTmVlZCBhIHdheSB0b1xuICAgIC8vIGNoZWNrIGlmIGV2ZW50I3N0b3BQcm9wYWdhdGlvblxuICAgIC8vIHdhcyBjYWxsZWQuIElmIHNvLCBicmVhayBsb29waW5nXG4gICAgLy8gdGhyb3VnaCB0aGUgRE9NLiBTdG9wIGlmIHRoZVxuICAgIC8vIGRlbGVnYXRpb24gcm9vdCBoYXMgYmVlbiByZWFjaGVkXG4gICAgaWYgKHRhcmdldCA9PT0gcm9vdCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgbCA9IGxpc3RlbmVyTGlzdC5sZW5ndGg7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ7XG4gIH1cbn07XG5cbi8qKlxuICogRmlyZSBhIGxpc3RlbmVyIG9uIGEgdGFyZ2V0LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge05vZGV9IHRhcmdldFxuICogQHBhcmFtIHtPYmplY3R9IGxpc3RlbmVyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbihldmVudCwgdGFyZ2V0LCBsaXN0ZW5lcikge1xuICByZXR1cm4gbGlzdGVuZXIuaGFuZGxlci5jYWxsKHRhcmdldCwgZXZlbnQsIHRhcmdldCk7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyBhIGdlbmVyaWMgc2VsZWN0b3IuXG4gKlxuICogQHR5cGUgZnVuY3Rpb24oKVxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIEEgQ1NTIHNlbGVjdG9yXG4gKi9cbnZhciBtYXRjaGVzID0gKGZ1bmN0aW9uKGVsKSB7XG4gIGlmICghZWwpIHJldHVybjtcbiAgdmFyIHAgPSBlbC5wcm90b3R5cGU7XG4gIHJldHVybiAocC5tYXRjaGVzIHx8IHAubWF0Y2hlc1NlbGVjdG9yIHx8IHAud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IHAubW96TWF0Y2hlc1NlbGVjdG9yIHx8IHAubXNNYXRjaGVzU2VsZWN0b3IgfHwgcC5vTWF0Y2hlc1NlbGVjdG9yKTtcbn0oRWxlbWVudCkpO1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyBhIHRhZyBzZWxlY3Rvci5cbiAqXG4gKiBUYWdzIGFyZSBOT1QgY2FzZS1zZW5zaXRpdmUsXG4gKiBleGNlcHQgaW4gWE1MIChhbmQgWE1MLWJhc2VkXG4gKiBsYW5ndWFnZXMgc3VjaCBhcyBYSFRNTCkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZ05hbWUgVGhlIHRhZyBuYW1lIHRvIHRlc3QgYWdhaW5zdFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzVGFnKHRhZ05hbWUsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIHRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIHRoZSByb290LlxuICpcbiAqIEBwYXJhbSB7P1N0cmluZ30gc2VsZWN0b3IgSW4gdGhpcyBjYXNlIHRoaXMgaXMgYWx3YXlzIHBhc3NlZCB0aHJvdWdoIGFzIG51bGwgYW5kIG5vdCB1c2VkXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNSb290KHNlbGVjdG9yLCBlbGVtZW50KSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlKi9cbiAgaWYgKHRoaXMucm9vdEVsZW1lbnQgPT09IHdpbmRvdykgcmV0dXJuIGVsZW1lbnQgPT09IGRvY3VtZW50O1xuICByZXR1cm4gdGhpcy5yb290RWxlbWVudCA9PT0gZWxlbWVudDtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBJRCBvZlxuICogdGhlIGVsZW1lbnQgaW4gJ3RoaXMnXG4gKiBtYXRjaGVzIHRoZSBnaXZlbiBJRC5cbiAqXG4gKiBJRHMgYXJlIGNhc2Utc2Vuc2l0aXZlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBUaGUgSUQgdG8gdGVzdCBhZ2FpbnN0XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNJZChpZCwgZWxlbWVudCkge1xuICByZXR1cm4gaWQgPT09IGVsZW1lbnQuaWQ7XG59XG5cbi8qKlxuICogU2hvcnQgaGFuZCBmb3Igb2ZmKClcbiAqIGFuZCByb290KCksIGllIGJvdGhcbiAqIHdpdGggbm8gcGFyYW1ldGVyc1xuICpcbiAqIEByZXR1cm4gdm9pZFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm9mZigpO1xuICB0aGlzLnJvb3QoKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByZXF3ZXN0ID0gcmVxdWlyZShcIi4vLi4vcmVxd2VzdC9yZXF3ZXN0LmpzXCIpO1xudmFyIERlbGVnYXRlID0gcmVxdWlyZShcIi4vLi4vZG9tLWRlbGVnYXRlL2xpYi9kZWxlZ2F0ZS5qc1wiKTtcbnZhciBoZWFkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuby1oZWFkZXInKTtcbnZhciBteUZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm8taGVhZGVyX19zZWNvbmRhcnktLW15ZnQtanMnKTtcbnZhciBteUZUQnV0dG9uID0gaGVhZGVyLnF1ZXJ5U2VsZWN0b3IoJy5vLWhlYWRlci1idXR0b24tanNbZGF0YS10YXJnZXQtcGFuZWw9XCJteWZ0XCJdJyk7XG52YXIgZGVmYXVsdFBhbmVsID0gaGVhZGVyLmdldEF0dHJpYnV0ZSgnZGF0YS1kZWZhdWx0LXBhbmVsJyk7XG52YXIgZGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUoaGVhZGVyKTtcbnZhciBib2R5RGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUoKTtcbnZhciBOb3RpZnkgPSByZXF1aXJlKCcuL3NyYy9qcy9Ob3RpZnknKTtcbnZhciBuZXh0VXNlclByZWZlcmVuY2VzID0gcmVxdWlyZShcIi4vLi4vbmV4dC11c2VyLXByZWZlcmVuY2VzL3NyYy9tYWluLmpzXCIpO1xuXG5kZWxlZ2F0ZS5vbignY2xpY2snLCAnLm8taGVhZGVyLWJ1dHRvbi1qcycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdC8vIEhBQ0tcblx0dmFyIHRhcmdldFBhbmVsID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS10YXJnZXQtcGFuZWwnKVxuXHRcdHx8IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS10YXJnZXQtcGFuZWwnKVxuXHRcdHx8IGRlZmF1bHRQYW5lbDtcblx0dmFyIGN1cnJlbnRQYW5lbCA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnKTtcblx0aWYgKGN1cnJlbnRQYW5lbCAhPT0gdGFyZ2V0UGFuZWwgJiYgdGFyZ2V0UGFuZWwgIT09IGRlZmF1bHRQYW5lbCkge1xuXHRcdGJvZHlEZWxlZ2F0ZS5yb290KGRvY3VtZW50LmJvZHkpO1xuXHRcdGhlYWRlci5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnLCB0YXJnZXRQYW5lbCk7XG5cdH0gZWxzZSB7XG5cdFx0Ym9keURlbGVnYXRlLnJvb3QoKTtcblx0XHRpZiAoZGVmYXVsdFBhbmVsKSB7XG5cdFx0XHRoZWFkZXIuc2V0QXR0cmlidXRlKCdkYXRhLXBhbmVsJywgZGVmYXVsdFBhbmVsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aGVhZGVyLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1wYW5lbCcpO1xuXHRcdH1cblx0fVxufSk7XG5cbmRlbGVnYXRlLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufSk7XG5cbmJvZHlEZWxlZ2F0ZS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0aWYgKGRlZmF1bHRQYW5lbCkge1xuXHRcdGhlYWRlci5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnLCBkZWZhdWx0UGFuZWwpO1xuXHR9IGVsc2Uge1xuXHRcdGhlYWRlci5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnKTtcblx0fVxufSk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbnM6bG9hZCcsIGZ1bmN0aW9uKGUpIHtcblx0dmFyIHRvdGFsID0gMCwgXG5cdFx0XHRub3RpZmljYXRpb25zID0gZS5kZXRhaWw7XG5cdGZvcih2YXIgc3RyZWFtIGluIG5vdGlmaWNhdGlvbnMpIHtcblx0XHRpZihub3RpZmljYXRpb25zW3N0cmVhbV0pIHtcblx0XHRcdHRvdGFsICs9IG5vdGlmaWNhdGlvbnNbc3RyZWFtXS5sZW5ndGg7XG5cdFx0fVxuXHR9XG5cdGlmKHRvdGFsID4gMCkge1xuXHRcdGlmKG15RlRCdXR0b24uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbm90aWZ5LWJhZGdlJykubGVuZ3RoKSB7XG5cdFx0XHRteUZUQnV0dG9uLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ25vdGlmeS1iYWRnZScpWzBdLnRleHRDb250ZW50ID0gdG90YWw7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG15RlRCdXR0b24uaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCAnPHNwYW4gY2xhc3M9XCJub3RpZnktYmFkZ2VcIj4nK3RvdGFsICsgJzwvc3Bhbj4nKVxuXHRcdH1cblx0fVxufSk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbnM6bmV3JywgZnVuY3Rpb24oZSkge1xuXHR2YXIgdG90YWwgPSAwLCBcblx0XHRcdGRhdGEgPSBlLmRldGFpbDtcblx0XG5cdHZhciBpZCA9IGRhdGEubm90aWZpY2F0aW9uc1swXS5pdGVtO1xuXHRyZXF3ZXN0KHtcblx0XHR1cmw6ICcvJyArIGlkLFxuXHRcdGhlYWRlcnM6IHtcblx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHQnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXG5cdFx0fVxuXHR9KS50aGVuKGZ1bmN0aW9uKHJlcykge1xuXHRcdG5ldyBOb3RpZnkoe1xuXHRcdFx0dGl0bGU6ICdOZXcgYXJ0aWNsZSBpbiAnICsgZGF0YS5zdHJlYW0uZGlzcGxheVRleHQsXG5cdFx0XHRib2R5OiByZXMuaGVhZGxpbmUsXG5cdFx0XHRsaWZlc3BhbjogMTAwMCAqIDEwLFxuXHRcdFx0b25jbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSAnLycgKyByZXMuaWRcblx0XHRcdH1cblx0XHR9KS5zaG93KCk7XG5cdH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG5cdFx0bmV3IE5vdGlmeSh7XG5cdFx0XHR0aXRsZTogJ05ldyBhcnRpY2xlIGluICcgKyBkYXRhLnN0cmVhbS5kaXNwbGF5VGV4dCxcblx0XHRcdGxpZmVzcGFuOiAxMDAwICogMTAsXG5cdFx0XHRvbmNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcvJyArIGRhdGEubm90aWZpY2F0aW9uc1swXS5pdGVtXG5cdFx0XHR9XG5cdFx0fSkuc2hvdygpO1xuXHR9KTtcblxuXG59KTtcblxuXG5cbmZ1bmN0aW9uIHRyYW5zaXRpb25NeUZUQnV0dG9uICh0eXBlKSB7XG5cblx0ZnVuY3Rpb24gbGlzdGVuZXIoKSB7XG5cdFx0bXlGVEJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCd0cmFuc2l0aW9uaW5nJyk7XG5cdFx0bXlGVEJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgbGlzdGVuZXIpO1xuXHR9O1xuXG5cdG15RlRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGxpc3RlbmVyKTtcblx0bXlGVEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCd0cmFuc2l0aW9uaW5nJyk7XG5cdG15RlRCdXR0b24uY2xhc3NMaXN0LmFkZCgnbXlmdC0tJyArIHR5cGUpO1xuXHRteUZUQnV0dG9uLm9mZnNldFdpZHRoOyAvL2ZvcmNlcyByZXBhaW50XG5cblx0bXlGVEJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdteWZ0LS0nICsgdHlwZSk7XG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Zhdm91cml0ZXM6YWRkJywgZnVuY3Rpb24gKGUpIHtcblx0dHJhbnNpdGlvbk15RlRCdXR0b24oJ2FkZC1mYXZvdXJpdGUnKTtcbn0pO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmYXZvdXJpdGVzOnJlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG5cdHRyYW5zaXRpb25NeUZUQnV0dG9uKCdyZW1vdmUtZmF2b3VyaXRlJyk7XG59KTtcblxucmVxd2VzdCgnaHR0cDovL25leHQtY29tcGFuaWVzLWV0LWFsLmhlcm9rdWFwcC5jb20vdjEvdWJlcm5hdi5qc29uJywgZnVuY3Rpb24ocmVzcCkge1xuXHR2YXIgZGF0YSA9IHJlc3AuZGF0YTtcblx0aGVhZGVyLnF1ZXJ5U2VsZWN0b3IoJy5vLWhlYWRlcl9fc2Vjb25kYXJ5LS1tZW51LWpzJykuaW5uZXJIVE1MID0gJzx1bCBjbGFzcz1cInViZXItaW5kZXhcIj4nXG5cdFx0KyBkYXRhLm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdFx0cmV0dXJuICc8bGkgY2xhc3M9XCJ1YmVyLWluZGV4X190aXRsZVwiIGRhdGEtby1ncmlkLWNvbHNwYW49XCI2IE02IEwzIFhMM1wiPidcblx0XHRcdCsgJzxhIGhyZWY9XCInICsgaXRlbS5uZXh0VXJsICsgJ1wiPicgKyBpdGVtLnRpdGxlICsgJzwvYT4nXG5cdFx0XHQrICc8dWwgY2xhc3M9XCJ1YmVyLWluZGV4X19jaGlsZHJlblwiPidcblx0XHRcdCsgaXRlbS5uYXZpZ2F0aW9uSXRlbXMubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XG5cdFx0XHRcdHJldHVybiAnPGxpIGNsYXNzPVwidWJlci1pbmRleF9fY2hpbGRcIj48YSBocmVmPVwiJyArIGNoaWxkLm5leHRVcmwgKyAnXCI+JyArIGNoaWxkLnRpdGxlICsgJzwvYT48L2xpPic7XG5cdFx0XHR9KS5qb2luKCcnKVxuXHRcdFx0KyAnPC91bD4nXG5cdFx0XHQrICc8L2xpPic7XG5cdFx0fSkuam9pbignJyk7XG5cdFx0KyAnPC91bD4nO1xufSk7XG5cbmlmIChteUZ0KSBuZXh0VXNlclByZWZlcmVuY2VzLmluaXQobXlGdCwgeyBub3RpZnk6IHRydWUgfSk7XG4iLCIvKipcbiAqIE1lc3NhZ2UgdGhlIHVzZXJcbiAqXG4gKiA+IG5ldyBOb3RpZnkoeyBodG1sOiBcIllvdSd2ZSBnb3QgbWFpbFwiLCBsaWZlc3BhY2U6IDEwMDAwIH0pLnNob3coKTtcbiAqXG4gKiBUT0RPXG4gKlxuICogIC0gVVggdG8gZGVhbCB3aXRoIG11bHRpcGxlIG1lc3NhZ2VzLlxuICogIC0gVzMgLyBDaHJvbWUgZGVza3RvcCBub3RpZmljYXRpb25zIHBlcm1pc3Npb24uXG4gKiAgLSBBY2tub3dsZWRnZW1lbnQgVVhcbiAqXG4gKi9cbnZhciBOb3RpZnkgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIHRoaXMudGVtcGxhdGUgPSAnPGgzIGNsYXNzPVwibWVzc2FnZV9fdGl0bGVcIj4nICsgbWVzc2FnZS50aXRsZSArICc8aSBjbGFzcz1cIm1lc3NhZ2VfX2Nsb3NlIGljb24gaWNvbl9fY2xvc2VcIj48L2k+PC9oMz48c3BhbiBjbGFzcz1cIm1lc3NhZ2VfX2JvZHlcIj4nICsgbWVzc2FnZS5ib2R5ICsgJzwvc3Bhbj4nO1xuICAgIHRoaXMubGlmZXNwYW4gPSBtZXNzYWdlLmxpZmVzcGFuIHx8IDUwMDA7XG4gICAgdGhpcy5kb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmRvbS5jbGFzc05hbWUgPSAnbWVzc2FnZV9fY29udGFpbmVyJ1xuICAgIHRoaXMuZG9tLmlubmVySFRNTCA9IHRoaXMudGVtcGxhdGU7IFxuICAgIHRoaXMuaGFzRGVza3RvcFBlcm1pc3Npb24gPSBmYWxzZTtcbiAgICB0aGlzLnJvb3QgPSBkb2N1bWVudC5ib2R5O1xuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVOb3RpZmljYXRpb24obWVzc2FnZSkge1xuICAgIHZhciBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKG1lc3NhZ2UudGl0bGUsIHtib2R5OiBtZXNzYWdlLmJvZHl9KTtcbiAgICBub3RpZmljYXRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBtZXNzYWdlLm9uY2xpY2spO1xuICAgIHJldHVybiBub3RpZmljYXRpb247XG59XG5cbk5vdGlmeS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICBcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gZ3JhbnRlZFxuICAgIC8vVE9ETyAtIGVuYWJsZSB0aGlzIGFnYWluIG9uY2Ugd2UndmUgdGhvdWdodCBhYm91dCB0aGUgVVghXG4gICAgaWYgKGZhbHNlICYmIHdpbmRvdy5Ob3RpZmljYXRpb24gJiYgTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgIGNyZWF0ZU5vdGlmaWNhdGlvbihzZWxmLm1lc3NhZ2UpO1xuICAgIH0gZWxzZSBpZiAoZmFsc2UgJiYgd2luZG93Lk5vdGlmaWNhdGlvbiAmJiBOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gXCJkZW5pZWRcIikge1xuICAgICAgXG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAoc3RhdHVzKSB7XG4gICAgICAgICAgICBpZiAoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09IHN0YXR1cykge1xuICAgICAgICAgICAgICAgIE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID0gc3RhdHVzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBncmFudGVkXG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgICAgIGNyZWF0ZU5vdGlmaWNhdGlvbihzZWxmLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNob3dIdG1sTm90aWZpY2F0aW9uKCk7ICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAvLyBkZW5pZWRcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNob3dIdG1sTm90aWZpY2F0aW9uKCk7ICAgIFxuICAgIH1cbn07XG5cbk5vdGlmeS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBGSVhNRSBmb3JnZXQgaWYgSSBuZWVkIHRvIHJlbW92ZSBldmVudCBsaXN0ZW5lciA6KVxuICAgIHRoaXMuZG9tLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5kb20pO1xufTtcblxuTm90aWZ5LnByb3RvdHlwZS5zaG93SHRtbE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMucm9vdC5hcHBlbmRDaGlsZCh0aGlzLmRvbSk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGRlc3Ryb3kgdGhlIGJveCBhZnRlciBhIGZldyBzZWNvbmRzXG4gICAgdmFyIHNlbGZEZXN0cnVjdCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICB9LCB0aGlzLmxpZmVzcGFuKTsgXG5cbiAgICAvLyBBY2tub3dsZWRnbWVudCBVSVxuICAgIHRoaXMuZG9tLnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlX19jbG9zZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGZEZXN0cnVjdCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmRvbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmKGUudGFyZ2V0LmNsYXNzTmFtZS5pbmRleE9mKCdtZXNzYWdlX19jbG9zZScpID49IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLm1lc3NhZ2Uub25jbGljaygpO1xuICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGZEZXN0cnVjdCk7XG4gICAgfSk7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTm90aWZ5OyIsIi8vIFN0b3JlcyBhIHVuaXF1ZSBsaXN0IG9mIHRoaW5ncyAoRWcsIHNlY3Rpb25zLCBmYXZvdXJpdGVzLCBoaXN0b3J5KSBhZ2FpbnN0IGFcbi8vIGtleSBpbiBsb2NhbFN0b3JhZ2VcblxudmFyIHJlcXdlc3QgPSByZXF1aXJlKCcuLi92ZW5kb3IvcmVxd2VzdC5taW4nKTtcblxudmFyIEFQSV9VUkwgPSAnaHR0cDovL2Z0LW5leHQtYXBpLXVzZXItcHJlZnMuaGVyb2t1YXBwLmNvbS91c2VyLyc7XG5cbnZhciBlbWl0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICBpZiAoZGF0YSkge1xuICAgIGV2ZW50LmRldGFpbCA9IGRhdGE7XG4gIH1cbiAgdG9wLmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxuXG52YXIgTWUgPSBmdW5jdGlvbiAoa2V5LCB1c2VySWQpIHtcbiAgaWYgKCFrZXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IHN1cHBseSBhIGtleSAvXlthLXpdKyQvJyk7XG4gIH1cbiAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgdGhpcy5sb2NhbFN0b3JhZ2VLZXkgPSAnZnQubmV4dC51c2VyLicgKyBrZXk7XG5cbiAgaWYodXNlcklkKSB7XG4gICAgdGhpcy5hcGlVUkwgPSBBUElfVVJMICsga2V5O1xuICAgIHRoaXMudXNlcklkID0gdXNlcklkO1xuICB9ICAgICAgXG4gICAgLy9TdGFydCBvZmYgd2l0aCBsb2NhbCBjb3B5Li4uXG4gICAgdGhpcy52YWwgPSB0aGlzLmdldE9yQ3JlYXRlKCk7XG4gICAgLy9UaGVuIHRyeSBhbmQgZmV0Y2ggc2VydmVyIGNvcHlcbiAgICB0aGlzLmZldGNoKCk7XG5cbiAgfTtcblxuICBNZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIGtleSA9IGtleSB8fCB0aGlzLmxvY2FsU3RvcmFnZUtleTtcbiAgICB2YXIgZXhpc3RzID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICBpZiAoZXhpc3RzKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShleGlzdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5nZXRPckNyZWF0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBrZXkgPSBrZXkgfHwgdGhpcy5sb2NhbFN0b3JhZ2VLZXk7XG4gICAgdmFyIHNhdmVkID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZihzYXZlZCkge1xuICAgICAgcmV0dXJuIHNhdmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZW1wdHkgPSBbXTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoZW1wdHkpKTtcbiAgICAgIHJldHVybiBlbXB0eTtcbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgLy9JZiBubyB1c2VySUQgZG9uJ3QgZmV0Y2ggZnJvbSBzZXJ2ZXJcbiAgICBpZighdGhpcy51c2VySWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXF3ZXN0KHtcbiAgICAgIHVybDogdGhpcy5hcGlVUkwsXG4gICAgICB0eXBlOiAnanNvbicsXG4gICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1GVC1VSUQnOiB0aGlzLnVzZXJJZFxuICAgICAgfSxcbiAgICAgIGNyb3NzT3JpZ2luOiB0cnVlXG4gICAgfSkudGhlbihmdW5jdGlvbihmYXZlcykge1xuICAgICAgaWYoZmF2ZXMpIHtcbiAgICAgICAgbWUudmFsID0gZmF2ZXM7XG4gICAgICAgIC8vYWNjZXB0IHRoZSBzZXJ2ZXIgY29weSBhcyAndGhlIHRydXRoJy4uLlxuICAgICAgICBtZS5zYXZlKG1lLnZhbCk7XG4gICAgICAgIC8vYnV0IHRoZW4gcHJvY2VzcyBhbnkgbGVmdG92ZXIgcmVxdWVzdHMgbG9jYWxseVxuICAgICAgICBtZS5wcm9jZXNzUGVuZGluZygnYWRkJyk7XG4gICAgICAgIG1lLnByb2Nlc3NQZW5kaW5nKCdyZW1vdmUnKTtcbiAgICAgICAgbWUucHJvY2Vzc1BlbmRpbmcoJ2NsZWFyJyk7XG4gICAgICB9XG4gICAgfSkuYWx3YXlzKGZ1bmN0aW9uKGVycikge1xuICAgICAgLy90cmlnZ2VyIGxvYWQgYW5kIHVwZGF0ZSBldmVudHNcbiAgICAgIGVtaXQobWUua2V5ICsgJzpsb2FkJywgbWUpO1xuICAgICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTtcbiAgICB9KTsgIFxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gICAga2V5ID0ga2V5IHx8IHRoaXMubG9jYWxTdG9yYWdlS2V5O1xuICAgIGlmKG9iaiAmJiBvYmoubGVuZ3RoKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KG9iaikpOyBcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmFkZFBlbmRpbmcgPSBmdW5jdGlvbihvYmosIGFjdGlvbikge1xuICAgIHZhciBwZW5kaW5nID0gdGhpcy5nZXRPckNyZWF0ZSh0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuJyArIGFjdGlvbik7XG4gICAgcGVuZGluZy5wdXNoKG9iaik7XG4gICAgLy9pZiB3ZSdyZSBhZGRpbmcgc29tZXRoaW5nLCB0aGVuIGdldCByaWQgb2YgYW55IHBlbmRpbmcgY2xlYXIgcmVxdWVzdHNcbiAgICBpZihhY3Rpb24gPT09ICdhZGQnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuY2xlYXInKTtcbiAgICB9XG4gICAgdGhpcy5zYXZlKHBlbmRpbmcsIHRoaXMubG9jYWxTdG9yYWdlS2V5ICsgJy4nICsgYWN0aW9uKTtcbiAgfTtcblxuICBNZS5wcm90b3R5cGUucHJvY2Vzc1BlbmRpbmcgPSBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciBwZW5kaW5nID0gdGhpcy5nZXQodGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLicgKyBhY3Rpb24pO1xuICAgIGlmKHBlbmRpbmcgJiYgcGVuZGluZy5sZW5ndGgpIHtcbiAgICAgIC8vQ2xlYXIgaXMgYSBzcGVjaWFsIGNhc2VcbiAgICAgIGlmKGFjdGlvbiA9PT0gJ2NsZWFyJykge1xuICAgICAgICBpZihwZW5kaW5nW3BlbmRpbmcubGVuZ3RoIC0gMV0gPT09IHRydWUpIHtcbiAgICAgICAgICBtZS5jbGVhcigpO1xuICAgICAgICAgIHBlbmRpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZW5kaW5nLmZvckVhY2goZnVuY3Rpb24oaXRlbVRvQWRkLCBpbmRleCkge1xuICAgICAgICAgICAvLyByZW1vdmUgdGhlIGl0ZW0gZnJvbSB0aGUgdG9kbyBsaXN0IGFuZCBleGVjdXRlIHRoZSBhY3Rpb24gXG4gICAgICAgICAgIHBlbmRpbmcuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgbWVbYWN0aW9uXShpdGVtVG9BZGQpO1xuICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNhdmUocGVuZGluZywgdGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLicgKyBhY3Rpb24pO1xuICAgIH1cblxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB0aGlzLnZhbCA9IHRoaXMuZ2V0T3JDcmVhdGUoKTtcbiAgICBpZiAoIXRoaXMuZXhpc3RzKG9iai51dWlkdjMpKSB7XG4gICAgICB0aGlzLnZhbC5wdXNoKG9iaik7XG4gICAgICB0aGlzLnNhdmUodGhpcy52YWwpO1xuICAgICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTsgLy90cmlnZ2VyIGV2ZW50IHRvIHJlbmRlciBVSVxuXG4gICAgICAvL1NlbmQgYSByZXF1ZXN0IHRvIGFkZCB0byBzZXJ2ZXJcbiAgICAgIGlmKHRoaXMuYXBpVVJMKSB7XG4gICAgICAgIHJlcXdlc3Qoe1xuICAgICAgICAgIHVybDogdGhpcy5hcGlVUkwsXG4gICAgICAgICAgbWV0aG9kOiAncHV0JyxcbiAgICAgICAgICB0eXBlOiAnanNvbicsXG4gICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShvYmopLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdYLUZULVVJRCc6IHRoaXMudXNlcklkXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjcm9zc09yaWdpbjogdHJ1ZVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG1lLmFkZFBlbmRpbmcob2JqLCAnYWRkJyk7IC8vc2VydmVyIHJlcXVlc3QgZmFpbGVkIHNvIHB1c2ggaXQgdG8gdGhlIGxpc3Qgb2YgcGVuZGluZ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgdGhpcy52YWwgPSB0aGlzLmdldE9yQ3JlYXRlKCk7XG4gICAgdGhpcy52YWwgPSB0aGlzLnZhbC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIChpdGVtLnV1aWR2MyAhPT0gb2JqLnV1aWR2Myk7XG4gICAgfSk7XG4gICAgdGhpcy5zYXZlKHRoaXMudmFsKTtcblxuICAgIGVtaXQobWUua2V5ICsgJzp1cGRhdGUnLCBtZSk7IC8vdHJpZ2dlciBldmVudCB0byByZW5kZXIgVUlcblxuICAgIC8vU2VuZCBhIHJlcXVlc3QgdG8gZGVsZXRlIGZyb20gc2VydmVyXG4gICAgaWYodGhpcy5hcGlVUkwpIHtcblxuICAgICAgcmVxd2VzdCh7XG4gICAgICAgIHVybDogdGhpcy5hcGlVUkwgKyAnLycgKyBlbmNvZGVVUkkoZGVjb2RlVVJJKG9iai51dWlkdjMpKSxcbiAgICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgICBtZXRob2Q6ICdkZWxldGUnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ1gtRlQtVUlEJzogdGhpcy51c2VySWRcbiAgICAgICAgfSxcbiAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgIH0pLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1lLmFkZFBlbmRpbmcob2JqLCAncmVtb3ZlJyk7ICAvL3NlcnZlciByZXF1ZXN0IGZhaWxlZCBzbyBwdXNoIGl0IHRvIHRoZSBsaXN0IG9mIHBlbmRpbmdcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuXG4gIE1lLnByb3RvdHlwZS5leGlzdHMgPSBmdW5jdGlvbiAodXVpZCkge1xuICAgIHRoaXMudmFsID0gdGhpcy5nZXRPckNyZWF0ZSgpO1xuICAgIHJldHVybiB0aGlzLnZhbC5zb21lKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS51dWlkdjMgPT09IHV1aWQ7XG4gICAgfSk7XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIHN0YXR1cyA9IGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMubG9jYWxTdG9yYWdlS2V5KTtcbiAgICB0aGlzLnZhbCA9IFtdO1xuXG4gICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTsgLy90cmlnZ2VyIGV2ZW50IHRvIHJlbmRlciBVSVxuXG4gICAgICAvL1NlbmQgYSByZXF1ZXN0IHRvIGRlbGV0ZSBBTEwgZnJvbSBzZXJ2ZXJcbiAgICAgIGlmKHRoaXMuYXBpVVJMKSB7XG5cbiAgICAgICAgcmVxd2VzdCh7XG4gICAgICAgICAgdXJsOiB0aGlzLmFwaVVSTCxcbiAgICAgICAgICB0eXBlOiAnanNvbicsXG4gICAgICAgICAgbWV0aG9kOiAnZGVsZXRlJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnWC1GVC1VSUQnOiB0aGlzLnVzZXJJZFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgICBtZS5hZGRQZW5kaW5nKHRydWUsICdjbGVhcicpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9O1xuXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IE1lO1xuXG4iLCJ2YXIgcmVxd2VzdCA9IHJlcXVpcmUoJy4uL3ZlbmRvci9yZXF3ZXN0Lm1pbicpO1xuXG5cbnZhciBOT1RJRklDQVRJT05TX1VSTCA9ICdodHRwOi8vZnQtbmV4dC1hcGktdXNlci1wcmVmcy5oZXJva3VhcHAuY29tL3VzZXIvbm90aWZpY2F0aW9ucy8nO1xudmFyIGVtaXQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG5cdHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG5cdGlmIChkYXRhKSB7XG5cdFx0ZXZlbnQuZGV0YWlsID0gZGF0YTtcblx0fVxuXHR0b3AuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5cbmZ1bmN0aW9uIGV4dHJhY3RTZWFyY2hUZXJtKHF1ZXJ5U3RyaW5nKSB7XG4gICAgcmV0dXJuIHF1ZXJ5U3RyaW5nLm1hdGNoKC9xPShbXiZdKikvKVsxXTtcbn1cblxudmFyIGdldEN1cnJlbnRTdHJlYW0gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9uQXJ0aWNsZSA9IC9eXFwvW2EtZjAtOV0rLSguKikvLnRlc3QobG9jYXRpb24ucGF0aG5hbWUpOyAvLyAnMjdhNWUyODYtNDMxNC0xMWU0LThhNDMtMDAxNDRmZWFiZGMwJzsgXG4gIGlmKG9uQXJ0aWNsZSB8fCBsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKCcvc2VhcmNoJykgIT09IDApIHsgLy9oYWNreSB3YXkgdG8gZXhjbHVkZSBob21lcGFnZSFcbiAgXHRyZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gIFx0cmV0dXJuIGV4dHJhY3RTZWFyY2hUZXJtKGxvY2F0aW9uLnNlYXJjaCk7XG4gIH1cbn07XG5cblxuZnVuY3Rpb24gTm90aWZpY2F0aW9uUG9sbGVyKHVzZXJQcmVmZXJlbmNlTGlzdCkge1xuXHR0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdCA9IHVzZXJQcmVmZXJlbmNlTGlzdDtcblx0c2V0SW50ZXJ2YWwodGhpcy5wb2xsLmJpbmQodGhpcyksIDEwMDAgKiA2MCAqIDAuMik7IC8vMzAgc2Vjb25kIHBvbGxpbmdcblx0dGhpcy5ub3RpZmljYXRpb25zID0ge307XG5cblx0Ly9DbGVhciBub3RpZmljYXRpb25zIGlmIGEgc3RyZWFtIGhhcyBiZWVuIG9wZW5lbmRcblx0dGhpcy5jdXJyZW50U3RyZWFtID0gZ2V0Q3VycmVudFN0cmVhbSgpO1xuXHRpZihsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKCcvZmF2b3VyaXRlcycpID49IDApIHtcblx0XHR0aGlzLmNsZWFyKClcblx0fVxuXG5cdHRoaXMucG9sbCh0cnVlKTsgLy9wYXNzIGZsYWcgdG8gaW5kaWNhdGUgdGhpcyBpcyB0aGUgZmlyc3QgbG9hZFxuXG59XG5cbk5vdGlmaWNhdGlvblBvbGxlci5wcm90b3R5cGUucG9sbCA9IGZ1bmN0aW9uKGZpcnN0TG9hZCkge1xuXHR2YXIgcG9sbGVyID0gdGhpcztcblx0dmFyIG5vdGlmaWNhdGlvblByb21pc2VzID0gW107XG5cdHZhciBuZXdOb3RpZmljYXRpb25zO1xuXHR0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdC5saXN0LmdldCgpLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XG5cdFx0Ly9kb24ndCBib3RoZXIgZmV0Y2hpbmcgaWYgeW91IGFyZSBvbiB0aGF0IHN0cmVhbSBjdXJyZW50bHlcblx0XHQoZnVuY3Rpb24oc3RyZWFtKSB7XG5cdFx0XHRpZihzdHJlYW0ucmVzb3VyY2VUeXBlICE9PSAnc3RyZWFtJykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRub3RpZmljYXRpb25Qcm9taXNlcy5wdXNoKHJlcXdlc3Qoe1xuXHRcdFx0XHR1cmw6IE5PVElGSUNBVElPTlNfVVJMICsgc3RyZWFtLnV1aWR2Myxcblx0XHRcdFx0dHlwZTogJ2pzb24nLFxuXHRcdFx0XHRtZXRob2Q6ICdnZXQnLFxuXHRcdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdFx0J1gtRlQtVUlEJzogcG9sbGVyLnVzZXJQcmVmZXJlbmNlTGlzdC51c2VySWRcblx0XHRcdFx0fSxcblx0XHRcdFx0Y3Jvc3NPcmlnaW46IHRydWVcblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24obm90aWZpY2F0aW9ucykge1xuXHRcdFx0XHRpZihub3RpZmljYXRpb25zICYmIG5vdGlmaWNhdGlvbnMubGVuZ3RoKSB7XG5cblx0XHRcdFx0XHQvL0lmIHRoZSBzdHJlYW0gaXMgY3VycmVudGx5IG9wZW4sIGVtaXQgYW4gZXZlbnQgd2l0aCB0aGUgbm90aWZpY2F0aW9ucywgYW5kIHRoZW4gY2xlYXIgdGhlbVxuXHRcdFx0XHRcdC8vIChidXQgb25seSBkbyB0aGlzIG9uY2UpXG5cdFx0XHRcdFx0aWYoZmlyc3RMb2FkICYmIHN0cmVhbS51dWlkdjMgPT09IHBvbGxlci5jdXJyZW50U3RyZWFtKSB7XG5cdFx0XHRcdFx0XHRlbWl0KCdub3RpZmljYXRpb25zOm9wZW5lZCcsIHsgdXVpZHYzOiBzdHJlYW0udXVpZHYzLCBub3RpZmljYXRpb25zOiBub3RpZmljYXRpb25zIH0pO1xuXHRcdFx0XHRcdFx0cG9sbGVyLmNsZWFyKHN0cmVhbS51dWlkdjMpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG5ld05vdGlmaWNhdGlvbnMgPSBmaWx0ZXJOZXcocG9sbGVyLm5vdGlmaWNhdGlvbnNbc3RyZWFtLnV1aWR2M10sIG5vdGlmaWNhdGlvbnMpO1xuXG5cdFx0XHRcdFx0aWYoIWZpcnN0TG9hZCAmJiBuZXdOb3RpZmljYXRpb25zLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0ZW1pdCgnbm90aWZpY2F0aW9uczpuZXcnLCB7IHN0cmVhbTogc3RyZWFtLCBub3RpZmljYXRpb25zOiBuZXdOb3RpZmljYXRpb25zIH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRwb2xsZXIubm90aWZpY2F0aW9uc1tzdHJlYW0udXVpZHYzXSA9IG5vdGlmaWNhdGlvbnM7XG5cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZWxldGUgcG9sbGVyLm5vdGlmaWNhdGlvbnNbc3RyZWFtLnV1aWR2M107XG5cdFx0XHRcdH1cblx0XHRcdFx0cG9sbGVyLnJlbmRlcigpO1xuXHRcdFx0fSkpO1xuXG5cdFx0fShzdHJlYW0pKVxuXHRcdFxuXHR9KTtcblxuXHRQcm9taXNlLmFsbChub3RpZmljYXRpb25Qcm9taXNlcykudGhlbihmdW5jdGlvbihzdHJlYW1Ob3RpZmljYXRpb25zKSB7XG5cdFx0aWYocG9sbGVyLm5vdGlmaWNhdGlvbnMpIHtcblx0XHRcdGVtaXQoJ25vdGlmaWNhdGlvbnM6bG9hZCcsIHBvbGxlci5ub3RpZmljYXRpb25zKTtcblx0XHR9XG5cdH0pO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyTmV3KG9yaWdpbmFsTGlzdCwgbmV3TGlzdCkge1xuXHRvcmlnaW5hbExpc3QgPSBvcmlnaW5hbExpc3QgfHwgW107XG5cdG5ld0xpc3QgPSBuZXdMaXN0IHx8IFtdO1xuXHR2YXIgb3JpZ2luYWxJZHMgPSBvcmlnaW5hbExpc3QubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uaWQ7IH0pO1xuXHRyZXR1cm4gbmV3TGlzdC5maWx0ZXIoZnVuY3Rpb24obm90aWYpIHsgcmV0dXJuIChvcmlnaW5hbElkcy5pbmRleE9mKG5vdGlmLmlkKSA8IDApOyB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQmFkZ2UoZWwsIG51bWJlcikge1xuXHR2YXIgYmFkZ2UgPSBlbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdqcy1ub3RpZnktYmFkZ2UnKVswXTtcblx0aWYoIWJhZGdlKSB7XG5cdFx0YmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cdFx0YmFkZ2UuY2xhc3NOYW1lID0gJ25vdGlmeS1iYWRnZSBqcy1ub3RpZnktYmFkZ2UnO1xuXHRcdGVsLmFwcGVuZENoaWxkKGJhZGdlKTtcblx0fVxuXHRpZihudW1iZXIgPiAwKSB7XG5cdFx0YmFkZ2UucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuXHRcdGJhZGdlLnRleHRDb250ZW50ID0gbnVtYmVyO1xuXHR9IGVsc2Uge1xuXHRcdGJhZGdlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnJyk7XG5cdH1cbn1cblxuTm90aWZpY2F0aW9uUG9sbGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcblx0Zm9yKHZhciBzdHJlYW0gaW4gdGhpcy5ub3RpZmljYXRpb25zKSB7XG5cdFx0bGluayA9IHRoaXMudXNlclByZWZlcmVuY2VMaXN0LmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbaHJlZj1cIi9zZWFyY2g/cT0nICsgc3RyZWFtICsgJ1wiXScpO1xuXHRcdGlmKGxpbmspIHtcblx0XHRcdHJlbmRlckJhZGdlKGxpbmssIHRoaXMubm90aWZpY2F0aW9uc1tzdHJlYW1dLmxlbmd0aCk7XG5cdFx0fVxuXHR9XG59O1xuXG5Ob3RpZmljYXRpb25Qb2xsZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24odXVpZCkge1xuXHRpZih1dWlkKSB7XG5cdFx0dGhpcy5ub3RpZmljYXRpb25zW3V1aWRdID0gW107XG5cdFx0cmVxd2VzdCh7XG5cdFx0XHR1cmw6IE5PVElGSUNBVElPTlNfVVJMICsgdXVpZCxcblx0XHRcdHR5cGU6ICdqc29uJyxcblx0XHRcdG1ldGhvZDogJ2RlbGV0ZScsXG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdYLUZULVVJRCc6IHRoaXMudXNlclByZWZlcmVuY2VMaXN0LnVzZXJJZFxuXHRcdFx0fSxcblx0XHRcdGNyb3NzT3JpZ2luOiB0cnVlXG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIHV1aWQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0dGhpcy5ub3RpZmljYXRpb25zID0ge307XG5cdH1cblx0dGhpcy5yZW5kZXIoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTm90aWZpY2F0aW9uUG9sbGVyOyIsInZhciBOb3RpZmljYXRpb25Qb2xsZXIgPSByZXF1aXJlKCcuL05vdGlmaWNhdGlvblBvbGxlcicpO1xudmFyIE1lID0gcmVxdWlyZSgnLi9NZScpO1xuXG52YXIgJCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICByZXR1cm4gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59O1xudmFyIGVtaXQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG4gIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICBldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gIGlmIChkYXRhKSB7XG4gICAgZXZlbnQuZGV0YWlsID0gZGF0YTtcbiAgfVxuICB0b3AuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG52YXIgZ2V0VXNlcklkID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2YWx1ZSA9IFwiOyBcIiArIGRvY3VtZW50LmNvb2tpZTtcbiAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCI7IEZUX1U9XCIpO1xuICB2YXIgZnRVID0gcGFydHMucG9wKCkuc3BsaXQoXCI7XCIpLnNoaWZ0KCk7XG4gIGlmKGZ0VSkge1xuICAgIHJldHVybiBmdFUubWF0Y2goL19FSUQ9KFxcZCspX1BJRC8pWzFdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybjtcbiAgfVxufTtcblxudmFyIFVzZXJQcmVmZXJlbmNlTGlzdCA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgb3B0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMudXNlcklkID0gZ2V0VXNlcklkKCk7XG4gIHRoaXMua2V5ID0gY29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS11c2VyLXByZWZlcmVuY2UtbGlzdCcpO1xuICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgdGhpcy5ub3RpZnkgPSBvcHRzLm5vdGlmeTtcblxufTtcblxuVXNlclByZWZlcmVuY2VMaXN0LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgaWYoIXRoaXMudXNlcklkKSB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5rZXkgKyAnOmFkZCcsIGZ1bmN0aW9uKGV2KSB7XG4gICAgc2VsZi5hZGQoZXYuZGV0YWlsKTtcbiAgfSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5rZXkgKyAnOnJlbW92ZScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgc2VsZi5yZW1vdmUoZXYuZGV0YWlsKTtcbiAgfSk7XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmtleSArICc6Y2xlYXInLCB0aGlzLmNsZWFyLmJpbmQodGhpcykpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMua2V5ICsgJzp1cGRhdGUnLCB0aGlzLnJlbmRlci5iaW5kKHRoaXMpKTtcblxuICAkKCdbZGF0YS1saXN0LXNvdXJjZT1cIicgKyB0aGlzLmtleSArICdcIl0gLmNsZWFyX19idXR0b24nKS5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLmNsZWFyLmJpbmQoc2VsZikpO1xuICB9KTtcblxuICB0aGlzLmxpc3QgPSBuZXcgTWUodGhpcy5rZXksIHRoaXMudXNlcklkKTtcblxuICBpZih0aGlzLm5vdGlmeSA9PT0gdHJ1ZSkge1xuICAgIHRoaXMubm90aWZpZXIgPSBuZXcgTm90aWZpY2F0aW9uUG9sbGVyKHRoaXMpO1xuICB9XG59XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHZhciBocmVmID0gJyc7XG5cbiAgdmFyIGxpbmtzID0gdGhpcy5saXN0ID8gdGhpcy5saXN0LmdldE9yQ3JlYXRlKCkucmV2ZXJzZSgpIDogW107XG5cbiAgdmFyIGxpbmtzSFRNTCA9IGxpbmtzLm1hcChmdW5jdGlvbiAoc2VjdGlvbikge1xuICAgIGhyZWYgPSBzZWN0aW9uLnJlc291cmNlVHlwZSA9PT0gJ3N0cmVhbScgPyAnL3NlYXJjaD9xPScgKyBzZWN0aW9uLnV1aWR2MyA6ICcvJyArIHNlY3Rpb24udXVpZHYzO1xuICAgIHJldHVybiAnPGxpIGNsYXNzPVwiaXRlbS10eXBlLS0nICsgc2VjdGlvbi5yZXNvdXJjZVR5cGUgKyAnXCI+PGEgaHJlZj1cIicgKyBocmVmICsgJ1wiPicgKyBzZWN0aW9uLmRpc3BsYXlUZXh0ICsgJzwvYT48L2xpPic7XG4gIH0pLmpvaW4oJycpO1xuICBcbiAgaWYodGhpcy5jb250YWluZXIpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSAgbGlua3NIVE1MO1xuICB9XG4gIGlmKHRoaXMubm90aWZpZXIpIHtcbiAgICB0aGlzLm5vdGlmaWVyLnJlbmRlcigpO1xuICB9XG59O1xuXG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24ob2JqKSB7XG4gIHRoaXMubGlzdC5hZGQob2JqKTtcbn07XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ob2JqKSB7XG4gIHRoaXMubGlzdC5yZW1vdmUob2JqKTtcbn07XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5saXN0LmNsZWFyKCk7XG59O1xuXG5Vc2VyUHJlZmVyZW5jZUxpc3QuaW5pdCA9IGZ1bmN0aW9uKHJvb3RFbCwgb3B0cykge1xuICB2YXIgY29tcG9uZW50cyA9IHt9LCBcbiAgICAgIGZFbHMsIFxuICAgICAgYywgbCwgXG4gICAgICBjb21wb25lbnQ7XG5cbiAgcm9vdEVsID0gcm9vdEVsIHx8IGRvY3VtZW50LmJvZHk7XG4gIC8vc2V0IGNvbmZpZyB3aXRoIG92ZXJyaWRlcyBwYXNzZWQgdGhyb3VnaFxuXG4gIGlmIChyb290RWwucXVlcnlTZWxlY3RvckFsbCkge1xuICAgIGZFbHMgPSByb290RWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdXNlci1wcmVmZXJlbmNlLWxpc3RdJyk7XG4gICAgZm9yIChjID0gMCwgbCA9IGZFbHMubGVuZ3RoOyBjIDwgbDsgYysrKSB7XG4gICAgICBpZiAoIWZFbHNbY10uaGFzQXR0cmlidXRlKCdkYXRhLW8tYXV0aG9yLWFsZXJ0cy0tanMnKSkge1xuICAgICAgICBjb21wb25lbnQgPSBuZXcgVXNlclByZWZlcmVuY2VMaXN0KGZFbHNbY10sIG9wdHMgfHwge30pO1xuICAgICAgICBjb21wb25lbnQuaW5pdChvcHRzKTtcbiAgICAgICAgY29tcG9uZW50c1tmRWxzW2NdLmdldEF0dHJpYnV0ZSgnZGF0YS11c2VyLXByZWZlcmVuY2UtbGlzdCcpXSA9IGNvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50cztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBVc2VyUHJlZmVyZW5jZUxpc3Q7XG4iLCJ2YXIgVXNlclByZWZlcmVuY2VMaXN0ID0gcmVxdWlyZSgnLi9saWIvVXNlclByZWZlcmVuY2VMaXN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXNlclByZWZlcmVuY2VMaXN0OyIsIi8qIVxuICAqIFJlcXdlc3QhIEEgZ2VuZXJhbCBwdXJwb3NlIFhIUiBjb25uZWN0aW9uIG1hbmFnZXJcbiAgKiBsaWNlbnNlIE1JVCAoYykgRHVzdGluIERpYXogMjAxNFxuICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kZWQvcmVxd2VzdFxuICAqL1xuIWZ1bmN0aW9uKGUsdCxuKXt0eXBlb2YgbW9kdWxlIT1cInVuZGVmaW5lZFwiJiZtb2R1bGUuZXhwb3J0cz9tb2R1bGUuZXhwb3J0cz1uKCk6dHlwZW9mIGRlZmluZT09XCJmdW5jdGlvblwiJiZkZWZpbmUuYW1kP2RlZmluZShuKTp0W2VdPW4oKX0oXCJyZXF3ZXN0XCIsdGhpcyxmdW5jdGlvbigpe2Z1bmN0aW9uIHN1Y2NlZWQoZSl7cmV0dXJuIGh0dHBzUmUudGVzdCh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wpP3R3b0h1bmRvLnRlc3QoZS5zdGF0dXMpOiEhZS5yZXNwb25zZX1mdW5jdGlvbiBoYW5kbGVSZWFkeVN0YXRlKGUsdCxuKXtyZXR1cm4gZnVuY3Rpb24oKXtpZihlLl9hYm9ydGVkKXJldHVybiBuKGUucmVxdWVzdCk7ZS5yZXF1ZXN0JiZlLnJlcXVlc3RbcmVhZHlTdGF0ZV09PTQmJihlLnJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlPW5vb3Asc3VjY2VlZChlLnJlcXVlc3QpP3QoZS5yZXF1ZXN0KTpuKGUucmVxdWVzdCkpfX1mdW5jdGlvbiBzZXRIZWFkZXJzKGUsdCl7dmFyIG49dC5oZWFkZXJzfHx7fSxyO24uQWNjZXB0PW4uQWNjZXB0fHxkZWZhdWx0SGVhZGVycy5hY2NlcHRbdC50eXBlXXx8ZGVmYXVsdEhlYWRlcnMuYWNjZXB0W1wiKlwiXTt2YXIgaT10eXBlb2YgRm9ybURhdGE9PVwiZnVuY3Rpb25cIiYmdC5kYXRhIGluc3RhbmNlb2YgRm9ybURhdGE7IXQuY3Jvc3NPcmlnaW4mJiFuW3JlcXVlc3RlZFdpdGhdJiYobltyZXF1ZXN0ZWRXaXRoXT1kZWZhdWx0SGVhZGVycy5yZXF1ZXN0ZWRXaXRoKSwhbltjb250ZW50VHlwZV0mJiFpJiYobltjb250ZW50VHlwZV09dC5jb250ZW50VHlwZXx8ZGVmYXVsdEhlYWRlcnMuY29udGVudFR5cGUpO2ZvcihyIGluIG4pbi5oYXNPd25Qcm9wZXJ0eShyKSYmXCJzZXRSZXF1ZXN0SGVhZGVyXCJpbiBlJiZlLnNldFJlcXVlc3RIZWFkZXIocixuW3JdKX1mdW5jdGlvbiBzZXRDcmVkZW50aWFscyhlLHQpe3R5cGVvZiB0LndpdGhDcmVkZW50aWFscyE9XCJ1bmRlZmluZWRcIiYmdHlwZW9mIGUud2l0aENyZWRlbnRpYWxzIT1cInVuZGVmaW5lZFwiJiYoZS53aXRoQ3JlZGVudGlhbHM9ISF0LndpdGhDcmVkZW50aWFscyl9ZnVuY3Rpb24gZ2VuZXJhbENhbGxiYWNrKGUpe2xhc3RWYWx1ZT1lfWZ1bmN0aW9uIHVybGFwcGVuZChlLHQpe3JldHVybiBlKygvXFw/Ly50ZXN0KGUpP1wiJlwiOlwiP1wiKSt0fWZ1bmN0aW9uIGhhbmRsZUpzb25wKGUsdCxuLHIpe3ZhciBpPXVuaXFpZCsrLHM9ZS5qc29ucENhbGxiYWNrfHxcImNhbGxiYWNrXCIsbz1lLmpzb25wQ2FsbGJhY2tOYW1lfHxyZXF3ZXN0LmdldGNhbGxiYWNrUHJlZml4KGkpLHU9bmV3IFJlZ0V4cChcIigoXnxcXFxcP3wmKVwiK3MrXCIpPShbXiZdKylcIiksYT1yLm1hdGNoKHUpLGY9ZG9jLmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIiksbD0wLGM9bmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTVNJRSAxMC4wXCIpIT09LTE7cmV0dXJuIGE/YVszXT09PVwiP1wiP3I9ci5yZXBsYWNlKHUsXCIkMT1cIitvKTpvPWFbM106cj11cmxhcHBlbmQocixzK1wiPVwiK28pLHdpbltvXT1nZW5lcmFsQ2FsbGJhY2ssZi50eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIsZi5zcmM9cixmLmFzeW5jPSEwLHR5cGVvZiBmLm9ucmVhZHlzdGF0ZWNoYW5nZSE9XCJ1bmRlZmluZWRcIiYmIWMmJihmLmh0bWxGb3I9Zi5pZD1cIl9yZXF3ZXN0X1wiK2kpLGYub25sb2FkPWYub25yZWFkeXN0YXRlY2hhbmdlPWZ1bmN0aW9uKCl7aWYoZltyZWFkeVN0YXRlXSYmZltyZWFkeVN0YXRlXSE9PVwiY29tcGxldGVcIiYmZltyZWFkeVN0YXRlXSE9PVwibG9hZGVkXCJ8fGwpcmV0dXJuITE7Zi5vbmxvYWQ9Zi5vbnJlYWR5c3RhdGVjaGFuZ2U9bnVsbCxmLm9uY2xpY2smJmYub25jbGljaygpLHQobGFzdFZhbHVlKSxsYXN0VmFsdWU9dW5kZWZpbmVkLGhlYWQucmVtb3ZlQ2hpbGQoZiksbD0xfSxoZWFkLmFwcGVuZENoaWxkKGYpLHthYm9ydDpmdW5jdGlvbigpe2Yub25sb2FkPWYub25yZWFkeXN0YXRlY2hhbmdlPW51bGwsbih7fSxcIlJlcXVlc3QgaXMgYWJvcnRlZDogdGltZW91dFwiLHt9KSxsYXN0VmFsdWU9dW5kZWZpbmVkLGhlYWQucmVtb3ZlQ2hpbGQoZiksbD0xfX19ZnVuY3Rpb24gZ2V0UmVxdWVzdChlLHQpe3ZhciBuPXRoaXMubyxyPShuLm1ldGhvZHx8XCJHRVRcIikudG9VcHBlckNhc2UoKSxpPXR5cGVvZiBuPT1cInN0cmluZ1wiP246bi51cmwscz1uLnByb2Nlc3NEYXRhIT09ITEmJm4uZGF0YSYmdHlwZW9mIG4uZGF0YSE9XCJzdHJpbmdcIj9yZXF3ZXN0LnRvUXVlcnlTdHJpbmcobi5kYXRhKTpuLmRhdGF8fG51bGwsbyx1PSExO3JldHVybihuW1widHlwZVwiXT09XCJqc29ucFwifHxyPT1cIkdFVFwiKSYmcyYmKGk9dXJsYXBwZW5kKGkscykscz1udWxsKSxuW1widHlwZVwiXT09XCJqc29ucFwiP2hhbmRsZUpzb25wKG4sZSx0LGkpOihvPW4ueGhyJiZuLnhocihuKXx8eGhyKG4pLG8ub3BlbihyLGksbi5hc3luYz09PSExPyExOiEwKSxzZXRIZWFkZXJzKG8sbiksc2V0Q3JlZGVudGlhbHMobyxuKSx3aW5beERvbWFpblJlcXVlc3RdJiZvIGluc3RhbmNlb2Ygd2luW3hEb21haW5SZXF1ZXN0XT8oby5vbmxvYWQ9ZSxvLm9uZXJyb3I9dCxvLm9ucHJvZ3Jlc3M9ZnVuY3Rpb24oKXt9LHU9ITApOm8ub25yZWFkeXN0YXRlY2hhbmdlPWhhbmRsZVJlYWR5U3RhdGUodGhpcyxlLHQpLG4uYmVmb3JlJiZuLmJlZm9yZShvKSx1P3NldFRpbWVvdXQoZnVuY3Rpb24oKXtvLnNlbmQocyl9LDIwMCk6by5zZW5kKHMpLG8pfWZ1bmN0aW9uIFJlcXdlc3QoZSx0KXt0aGlzLm89ZSx0aGlzLmZuPXQsaW5pdC5hcHBseSh0aGlzLGFyZ3VtZW50cyl9ZnVuY3Rpb24gc2V0VHlwZShlKXtpZihlLm1hdGNoKFwianNvblwiKSlyZXR1cm5cImpzb25cIjtpZihlLm1hdGNoKFwiamF2YXNjcmlwdFwiKSlyZXR1cm5cImpzXCI7aWYoZS5tYXRjaChcInRleHRcIikpcmV0dXJuXCJodG1sXCI7aWYoZS5tYXRjaChcInhtbFwiKSlyZXR1cm5cInhtbFwifWZ1bmN0aW9uIGluaXQobyxmbil7ZnVuY3Rpb24gY29tcGxldGUoZSl7by50aW1lb3V0JiZjbGVhclRpbWVvdXQoc2VsZi50aW1lb3V0KSxzZWxmLnRpbWVvdXQ9bnVsbDt3aGlsZShzZWxmLl9jb21wbGV0ZUhhbmRsZXJzLmxlbmd0aD4wKXNlbGYuX2NvbXBsZXRlSGFuZGxlcnMuc2hpZnQoKShlKX1mdW5jdGlvbiBzdWNjZXNzKHJlc3Ape3ZhciB0eXBlPW8udHlwZXx8c2V0VHlwZShyZXNwLmdldFJlc3BvbnNlSGVhZGVyKFwiQ29udGVudC1UeXBlXCIpKTtyZXNwPXR5cGUhPT1cImpzb25wXCI/c2VsZi5yZXF1ZXN0OnJlc3A7dmFyIGZpbHRlcmVkUmVzcG9uc2U9Z2xvYmFsU2V0dXBPcHRpb25zLmRhdGFGaWx0ZXIocmVzcC5yZXNwb25zZVRleHQsdHlwZSkscj1maWx0ZXJlZFJlc3BvbnNlO3RyeXtyZXNwLnJlc3BvbnNlVGV4dD1yfWNhdGNoKGUpe31pZihyKXN3aXRjaCh0eXBlKXtjYXNlXCJqc29uXCI6dHJ5e3Jlc3A9d2luLkpTT04/d2luLkpTT04ucGFyc2Uocik6ZXZhbChcIihcIityK1wiKVwiKX1jYXRjaChlcnIpe3JldHVybiBlcnJvcihyZXNwLFwiQ291bGQgbm90IHBhcnNlIEpTT04gaW4gcmVzcG9uc2VcIixlcnIpfWJyZWFrO2Nhc2VcImpzXCI6cmVzcD1ldmFsKHIpO2JyZWFrO2Nhc2VcImh0bWxcIjpyZXNwPXI7YnJlYWs7Y2FzZVwieG1sXCI6cmVzcD1yZXNwLnJlc3BvbnNlWE1MJiZyZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3ImJnJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvci5lcnJvckNvZGUmJnJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvci5yZWFzb24/bnVsbDpyZXNwLnJlc3BvbnNlWE1MfXNlbGYuX3Jlc3BvbnNlQXJncy5yZXNwPXJlc3Asc2VsZi5fZnVsZmlsbGVkPSEwLGZuKHJlc3ApLHNlbGYuX3N1Y2Nlc3NIYW5kbGVyKHJlc3ApO3doaWxlKHNlbGYuX2Z1bGZpbGxtZW50SGFuZGxlcnMubGVuZ3RoPjApcmVzcD1zZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLnNoaWZ0KCkocmVzcCk7Y29tcGxldGUocmVzcCl9ZnVuY3Rpb24gZXJyb3IoZSx0LG4pe2U9c2VsZi5yZXF1ZXN0LHNlbGYuX3Jlc3BvbnNlQXJncy5yZXNwPWUsc2VsZi5fcmVzcG9uc2VBcmdzLm1zZz10LHNlbGYuX3Jlc3BvbnNlQXJncy50PW4sc2VsZi5fZXJyZWQ9ITA7d2hpbGUoc2VsZi5fZXJyb3JIYW5kbGVycy5sZW5ndGg+MClzZWxmLl9lcnJvckhhbmRsZXJzLnNoaWZ0KCkoZSx0LG4pO2NvbXBsZXRlKGUpfXRoaXMudXJsPXR5cGVvZiBvPT1cInN0cmluZ1wiP286by51cmwsdGhpcy50aW1lb3V0PW51bGwsdGhpcy5fZnVsZmlsbGVkPSExLHRoaXMuX3N1Y2Nlc3NIYW5kbGVyPWZ1bmN0aW9uKCl7fSx0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJzPVtdLHRoaXMuX2Vycm9ySGFuZGxlcnM9W10sdGhpcy5fY29tcGxldGVIYW5kbGVycz1bXSx0aGlzLl9lcnJlZD0hMSx0aGlzLl9yZXNwb25zZUFyZ3M9e307dmFyIHNlbGY9dGhpcztmbj1mbnx8ZnVuY3Rpb24oKXt9LG8udGltZW91dCYmKHRoaXMudGltZW91dD1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7c2VsZi5hYm9ydCgpfSxvLnRpbWVvdXQpKSxvLnN1Y2Nlc3MmJih0aGlzLl9zdWNjZXNzSGFuZGxlcj1mdW5jdGlvbigpe28uc3VjY2Vzcy5hcHBseShvLGFyZ3VtZW50cyl9KSxvLmVycm9yJiZ0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZnVuY3Rpb24oKXtvLmVycm9yLmFwcGx5KG8sYXJndW1lbnRzKX0pLG8uY29tcGxldGUmJnRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChmdW5jdGlvbigpe28uY29tcGxldGUuYXBwbHkobyxhcmd1bWVudHMpfSksdGhpcy5yZXF1ZXN0PWdldFJlcXVlc3QuY2FsbCh0aGlzLHN1Y2Nlc3MsZXJyb3IpfWZ1bmN0aW9uIHJlcXdlc3QoZSx0KXtyZXR1cm4gbmV3IFJlcXdlc3QoZSx0KX1mdW5jdGlvbiBub3JtYWxpemUoZSl7cmV0dXJuIGU/ZS5yZXBsYWNlKC9cXHI/XFxuL2csXCJcXHJcXG5cIik6XCJcIn1mdW5jdGlvbiBzZXJpYWwoZSx0KXt2YXIgbj1lLm5hbWUscj1lLnRhZ05hbWUudG9Mb3dlckNhc2UoKSxpPWZ1bmN0aW9uKGUpe2UmJiFlLmRpc2FibGVkJiZ0KG4sbm9ybWFsaXplKGUuYXR0cmlidXRlcy52YWx1ZSYmZS5hdHRyaWJ1dGVzLnZhbHVlLnNwZWNpZmllZD9lLnZhbHVlOmUudGV4dCkpfSxzLG8sdSxhO2lmKGUuZGlzYWJsZWR8fCFuKXJldHVybjtzd2l0Y2gocil7Y2FzZVwiaW5wdXRcIjovcmVzZXR8YnV0dG9ufGltYWdlfGZpbGUvaS50ZXN0KGUudHlwZSl8fChzPS9jaGVja2JveC9pLnRlc3QoZS50eXBlKSxvPS9yYWRpby9pLnRlc3QoZS50eXBlKSx1PWUudmFsdWUsKCFzJiYhb3x8ZS5jaGVja2VkKSYmdChuLG5vcm1hbGl6ZShzJiZ1PT09XCJcIj9cIm9uXCI6dSkpKTticmVhaztjYXNlXCJ0ZXh0YXJlYVwiOnQobixub3JtYWxpemUoZS52YWx1ZSkpO2JyZWFrO2Nhc2VcInNlbGVjdFwiOmlmKGUudHlwZS50b0xvd2VyQ2FzZSgpPT09XCJzZWxlY3Qtb25lXCIpaShlLnNlbGVjdGVkSW5kZXg+PTA/ZS5vcHRpb25zW2Uuc2VsZWN0ZWRJbmRleF06bnVsbCk7ZWxzZSBmb3IoYT0wO2UubGVuZ3RoJiZhPGUubGVuZ3RoO2ErKyllLm9wdGlvbnNbYV0uc2VsZWN0ZWQmJmkoZS5vcHRpb25zW2FdKX19ZnVuY3Rpb24gZWFjaEZvcm1FbGVtZW50KCl7dmFyIGU9dGhpcyx0LG4scj1mdW5jdGlvbih0LG4pe3ZhciByLGkscztmb3Iocj0wO3I8bi5sZW5ndGg7cisrKXtzPXRbYnlUYWddKG5bcl0pO2ZvcihpPTA7aTxzLmxlbmd0aDtpKyspc2VyaWFsKHNbaV0sZSl9fTtmb3Iobj0wO248YXJndW1lbnRzLmxlbmd0aDtuKyspdD1hcmd1bWVudHNbbl0sL2lucHV0fHNlbGVjdHx0ZXh0YXJlYS9pLnRlc3QodC50YWdOYW1lKSYmc2VyaWFsKHQsZSkscih0LFtcImlucHV0XCIsXCJzZWxlY3RcIixcInRleHRhcmVhXCJdKX1mdW5jdGlvbiBzZXJpYWxpemVRdWVyeVN0cmluZygpe3JldHVybiByZXF3ZXN0LnRvUXVlcnlTdHJpbmcocmVxd2VzdC5zZXJpYWxpemVBcnJheS5hcHBseShudWxsLGFyZ3VtZW50cykpfWZ1bmN0aW9uIHNlcmlhbGl6ZUhhc2goKXt2YXIgZT17fTtyZXR1cm4gZWFjaEZvcm1FbGVtZW50LmFwcGx5KGZ1bmN0aW9uKHQsbil7dCBpbiBlPyhlW3RdJiYhaXNBcnJheShlW3RdKSYmKGVbdF09W2VbdF1dKSxlW3RdLnB1c2gobikpOmVbdF09bn0sYXJndW1lbnRzKSxlfWZ1bmN0aW9uIGJ1aWxkUGFyYW1zKGUsdCxuLHIpe3ZhciBpLHMsbyx1PS9cXFtcXF0kLztpZihpc0FycmF5KHQpKWZvcihzPTA7dCYmczx0Lmxlbmd0aDtzKyspbz10W3NdLG58fHUudGVzdChlKT9yKGUsbyk6YnVpbGRQYXJhbXMoZStcIltcIisodHlwZW9mIG89PVwib2JqZWN0XCI/czpcIlwiKStcIl1cIixvLG4scik7ZWxzZSBpZih0JiZ0LnRvU3RyaW5nKCk9PT1cIltvYmplY3QgT2JqZWN0XVwiKWZvcihpIGluIHQpYnVpbGRQYXJhbXMoZStcIltcIitpK1wiXVwiLHRbaV0sbixyKTtlbHNlIHIoZSx0KX12YXIgd2luPXdpbmRvdyxkb2M9ZG9jdW1lbnQsaHR0cHNSZT0vXmh0dHAvLHR3b0h1bmRvPS9eKDIwXFxkfDEyMjMpJC8sYnlUYWc9XCJnZXRFbGVtZW50c0J5VGFnTmFtZVwiLHJlYWR5U3RhdGU9XCJyZWFkeVN0YXRlXCIsY29udGVudFR5cGU9XCJDb250ZW50LVR5cGVcIixyZXF1ZXN0ZWRXaXRoPVwiWC1SZXF1ZXN0ZWQtV2l0aFwiLGhlYWQ9ZG9jW2J5VGFnXShcImhlYWRcIilbMF0sdW5pcWlkPTAsY2FsbGJhY2tQcmVmaXg9XCJyZXF3ZXN0X1wiKyArKG5ldyBEYXRlKSxsYXN0VmFsdWUseG1sSHR0cFJlcXVlc3Q9XCJYTUxIdHRwUmVxdWVzdFwiLHhEb21haW5SZXF1ZXN0PVwiWERvbWFpblJlcXVlc3RcIixub29wPWZ1bmN0aW9uKCl7fSxpc0FycmF5PXR5cGVvZiBBcnJheS5pc0FycmF5PT1cImZ1bmN0aW9uXCI/QXJyYXkuaXNBcnJheTpmdW5jdGlvbihlKXtyZXR1cm4gZSBpbnN0YW5jZW9mIEFycmF5fSxkZWZhdWx0SGVhZGVycz17Y29udGVudFR5cGU6XCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIixyZXF1ZXN0ZWRXaXRoOnhtbEh0dHBSZXF1ZXN0LGFjY2VwdDp7XCIqXCI6XCJ0ZXh0L2phdmFzY3JpcHQsIHRleHQvaHRtbCwgYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbCwgKi8qXCIseG1sOlwiYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbFwiLGh0bWw6XCJ0ZXh0L2h0bWxcIix0ZXh0OlwidGV4dC9wbGFpblwiLGpzb246XCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L2phdmFzY3JpcHRcIixqczpcImFwcGxpY2F0aW9uL2phdmFzY3JpcHQsIHRleHQvamF2YXNjcmlwdFwifX0seGhyPWZ1bmN0aW9uKGUpe2lmKGUuY3Jvc3NPcmlnaW49PT0hMCl7dmFyIHQ9d2luW3htbEh0dHBSZXF1ZXN0XT9uZXcgWE1MSHR0cFJlcXVlc3Q6bnVsbDtpZih0JiZcIndpdGhDcmVkZW50aWFsc1wiaW4gdClyZXR1cm4gdDtpZih3aW5beERvbWFpblJlcXVlc3RdKXJldHVybiBuZXcgWERvbWFpblJlcXVlc3Q7dGhyb3cgbmV3IEVycm9yKFwiQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGNyb3NzLW9yaWdpbiByZXF1ZXN0c1wiKX1yZXR1cm4gd2luW3htbEh0dHBSZXF1ZXN0XT9uZXcgWE1MSHR0cFJlcXVlc3Q6bmV3IEFjdGl2ZVhPYmplY3QoXCJNaWNyb3NvZnQuWE1MSFRUUFwiKX0sZ2xvYmFsU2V0dXBPcHRpb25zPXtkYXRhRmlsdGVyOmZ1bmN0aW9uKGUpe3JldHVybiBlfX07cmV0dXJuIFJlcXdlc3QucHJvdG90eXBlPXthYm9ydDpmdW5jdGlvbigpe3RoaXMuX2Fib3J0ZWQ9ITAsdGhpcy5yZXF1ZXN0LmFib3J0KCl9LHJldHJ5OmZ1bmN0aW9uKCl7aW5pdC5jYWxsKHRoaXMsdGhpcy5vLHRoaXMuZm4pfSx0aGVuOmZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU9ZXx8ZnVuY3Rpb24oKXt9LHQ9dHx8ZnVuY3Rpb24oKXt9LHRoaXMuX2Z1bGZpbGxlZD90aGlzLl9yZXNwb25zZUFyZ3MucmVzcD1lKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwKTp0aGlzLl9lcnJlZD90KHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwLHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csdGhpcy5fcmVzcG9uc2VBcmdzLnQpOih0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJzLnB1c2goZSksdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKHQpKSx0aGlzfSxhbHdheXM6ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuX2Z1bGZpbGxlZHx8dGhpcy5fZXJyZWQ/ZSh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCk6dGhpcy5fY29tcGxldGVIYW5kbGVycy5wdXNoKGUpLHRoaXN9LGZhaWw6ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuX2VycmVkP2UodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AsdGhpcy5fcmVzcG9uc2VBcmdzLm1zZyx0aGlzLl9yZXNwb25zZUFyZ3MudCk6dGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGUpLHRoaXN9LFwiY2F0Y2hcIjpmdW5jdGlvbihlKXtyZXR1cm4gdGhpcy5mYWlsKGUpfX0scmVxd2VzdC5zZXJpYWxpemVBcnJheT1mdW5jdGlvbigpe3ZhciBlPVtdO3JldHVybiBlYWNoRm9ybUVsZW1lbnQuYXBwbHkoZnVuY3Rpb24odCxuKXtlLnB1c2goe25hbWU6dCx2YWx1ZTpufSl9LGFyZ3VtZW50cyksZX0scmVxd2VzdC5zZXJpYWxpemU9ZnVuY3Rpb24oKXtpZihhcmd1bWVudHMubGVuZ3RoPT09MClyZXR1cm5cIlwiO3ZhciBlLHQsbj1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMCk7cmV0dXJuIGU9bi5wb3AoKSxlJiZlLm5vZGVUeXBlJiZuLnB1c2goZSkmJihlPW51bGwpLGUmJihlPWUudHlwZSksZT09XCJtYXBcIj90PXNlcmlhbGl6ZUhhc2g6ZT09XCJhcnJheVwiP3Q9cmVxd2VzdC5zZXJpYWxpemVBcnJheTp0PXNlcmlhbGl6ZVF1ZXJ5U3RyaW5nLHQuYXBwbHkobnVsbCxuKX0scmVxd2VzdC50b1F1ZXJ5U3RyaW5nPWZ1bmN0aW9uKGUsdCl7dmFyIG4scixpPXR8fCExLHM9W10sbz1lbmNvZGVVUklDb21wb25lbnQsdT1mdW5jdGlvbihlLHQpe3Q9XCJmdW5jdGlvblwiPT10eXBlb2YgdD90KCk6dD09bnVsbD9cIlwiOnQsc1tzLmxlbmd0aF09byhlKStcIj1cIitvKHQpfTtpZihpc0FycmF5KGUpKWZvcihyPTA7ZSYmcjxlLmxlbmd0aDtyKyspdShlW3JdLm5hbWUsZVtyXS52YWx1ZSk7ZWxzZSBmb3IobiBpbiBlKWUuaGFzT3duUHJvcGVydHkobikmJmJ1aWxkUGFyYW1zKG4sZVtuXSxpLHUpO3JldHVybiBzLmpvaW4oXCImXCIpLnJlcGxhY2UoLyUyMC9nLFwiK1wiKX0scmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeD1mdW5jdGlvbigpe3JldHVybiBjYWxsYmFja1ByZWZpeH0scmVxd2VzdC5jb21wYXQ9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZSYmKGUudHlwZSYmKGUubWV0aG9kPWUudHlwZSkmJmRlbGV0ZSBlLnR5cGUsZS5kYXRhVHlwZSYmKGUudHlwZT1lLmRhdGFUeXBlKSxlLmpzb25wQ2FsbGJhY2smJihlLmpzb25wQ2FsbGJhY2tOYW1lPWUuanNvbnBDYWxsYmFjaykmJmRlbGV0ZSBlLmpzb25wQ2FsbGJhY2ssZS5qc29ucCYmKGUuanNvbnBDYWxsYmFjaz1lLmpzb25wKSksbmV3IFJlcXdlc3QoZSx0KX0scmVxd2VzdC5hamF4U2V0dXA9ZnVuY3Rpb24oZSl7ZT1lfHx7fTtmb3IodmFyIHQgaW4gZSlnbG9iYWxTZXR1cE9wdGlvbnNbdF09ZVt0XX0scmVxd2VzdH0pIiwiLyohIFJhdmVuLmpzIDEuMS4xNiAoNDYzZjY4ZikgfCBnaXRodWIuY29tL2dldHNlbnRyeS9yYXZlbi1qcyAqL1xuXG4vKlxuICogSW5jbHVkZXMgVHJhY2VLaXRcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nZXRzZW50cnkvVHJhY2VLaXRcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNCBNYXR0IFJvYmVub2x0IGFuZCBvdGhlciBjb250cmlidXRvcnNcbiAqIFJlbGVhc2VkIHVuZGVyIHRoZSBCU0QgbGljZW5zZVxuICogaHR0cHM6Ly9naXRodWIuY29tL2dldHNlbnRyeS9yYXZlbi1qcy9ibG9iL21hc3Rlci9MSUNFTlNFXG4gKlxuICovXG47KGZ1bmN0aW9uKHdpbmRvdywgdW5kZWZpbmVkKXtcbid1c2Ugc3RyaWN0JztcblxuLypcbiBUcmFjZUtpdCAtIENyb3NzIGJyb3dlciBzdGFjayB0cmFjZXMgLSBnaXRodWIuY29tL29jYy9UcmFjZUtpdFxuIE1JVCBsaWNlbnNlXG4qL1xuXG52YXIgVHJhY2VLaXQgPSB7XG4gICAgcmVtb3RlRmV0Y2hpbmc6IGZhbHNlLFxuICAgIGNvbGxlY3RXaW5kb3dFcnJvcnM6IHRydWUsXG4gICAgLy8gMyBsaW5lcyBiZWZvcmUsIHRoZSBvZmZlbmRpbmcgbGluZSwgMyBsaW5lcyBhZnRlclxuICAgIGxpbmVzT2ZDb250ZXh0OiA3XG59O1xuXG4vLyBnbG9iYWwgcmVmZXJlbmNlIHRvIHNsaWNlXG52YXIgX3NsaWNlID0gW10uc2xpY2U7XG52YXIgVU5LTk9XTl9GVU5DVElPTiA9ICc/JztcblxuXG4vKipcbiAqIFRyYWNlS2l0LndyYXA6IFdyYXAgYW55IGZ1bmN0aW9uIGluIGEgVHJhY2VLaXQgcmVwb3J0ZXJcbiAqIEV4YW1wbGU6IGZ1bmMgPSBUcmFjZUtpdC53cmFwKGZ1bmMpO1xuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgRnVuY3Rpb24gdG8gYmUgd3JhcHBlZFxuICogQHJldHVybiB7RnVuY3Rpb259IFRoZSB3cmFwcGVkIGZ1bmNcbiAqL1xuVHJhY2VLaXQud3JhcCA9IGZ1bmN0aW9uIHRyYWNlS2l0V3JhcHBlcihmdW5jKSB7XG4gICAgZnVuY3Rpb24gd3JhcHBlZCgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIFRyYWNlS2l0LnJlcG9ydChlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHdyYXBwZWQ7XG59O1xuXG4vKipcbiAqIFRyYWNlS2l0LnJlcG9ydDogY3Jvc3MtYnJvd3NlciBwcm9jZXNzaW5nIG9mIHVuaGFuZGxlZCBleGNlcHRpb25zXG4gKlxuICogU3ludGF4OlxuICogICBUcmFjZUtpdC5yZXBvcnQuc3Vic2NyaWJlKGZ1bmN0aW9uKHN0YWNrSW5mbykgeyAuLi4gfSlcbiAqICAgVHJhY2VLaXQucmVwb3J0LnVuc3Vic2NyaWJlKGZ1bmN0aW9uKHN0YWNrSW5mbykgeyAuLi4gfSlcbiAqICAgVHJhY2VLaXQucmVwb3J0KGV4Y2VwdGlvbilcbiAqICAgdHJ5IHsgLi4uY29kZS4uLiB9IGNhdGNoKGV4KSB7IFRyYWNlS2l0LnJlcG9ydChleCk7IH1cbiAqXG4gKiBTdXBwb3J0czpcbiAqICAgLSBGaXJlZm94OiBmdWxsIHN0YWNrIHRyYWNlIHdpdGggbGluZSBudW1iZXJzLCBwbHVzIGNvbHVtbiBudW1iZXJcbiAqICAgICAgICAgICAgICBvbiB0b3AgZnJhbWU7IGNvbHVtbiBudW1iZXIgaXMgbm90IGd1YXJhbnRlZWRcbiAqICAgLSBPcGVyYTogICBmdWxsIHN0YWNrIHRyYWNlIHdpdGggbGluZSBhbmQgY29sdW1uIG51bWJlcnNcbiAqICAgLSBDaHJvbWU6ICBmdWxsIHN0YWNrIHRyYWNlIHdpdGggbGluZSBhbmQgY29sdW1uIG51bWJlcnNcbiAqICAgLSBTYWZhcmk6ICBsaW5lIGFuZCBjb2x1bW4gbnVtYmVyIGZvciB0aGUgdG9wIGZyYW1lIG9ubHk7IHNvbWUgZnJhbWVzXG4gKiAgICAgICAgICAgICAgbWF5IGJlIG1pc3NpbmcsIGFuZCBjb2x1bW4gbnVtYmVyIGlzIG5vdCBndWFyYW50ZWVkXG4gKiAgIC0gSUU6ICAgICAgbGluZSBhbmQgY29sdW1uIG51bWJlciBmb3IgdGhlIHRvcCBmcmFtZSBvbmx5OyBzb21lIGZyYW1lc1xuICogICAgICAgICAgICAgIG1heSBiZSBtaXNzaW5nLCBhbmQgY29sdW1uIG51bWJlciBpcyBub3QgZ3VhcmFudGVlZFxuICpcbiAqIEluIHRoZW9yeSwgVHJhY2VLaXQgc2hvdWxkIHdvcmsgb24gYWxsIG9mIHRoZSBmb2xsb3dpbmcgdmVyc2lvbnM6XG4gKiAgIC0gSUU1LjUrIChvbmx5IDguMCB0ZXN0ZWQpXG4gKiAgIC0gRmlyZWZveCAwLjkrIChvbmx5IDMuNSsgdGVzdGVkKVxuICogICAtIE9wZXJhIDcrIChvbmx5IDEwLjUwIHRlc3RlZDsgdmVyc2lvbnMgOSBhbmQgZWFybGllciBtYXkgcmVxdWlyZVxuICogICAgIEV4Y2VwdGlvbnMgSGF2ZSBTdGFja3RyYWNlIHRvIGJlIGVuYWJsZWQgaW4gb3BlcmE6Y29uZmlnKVxuICogICAtIFNhZmFyaSAzKyAob25seSA0KyB0ZXN0ZWQpXG4gKiAgIC0gQ2hyb21lIDErIChvbmx5IDUrIHRlc3RlZClcbiAqICAgLSBLb25xdWVyb3IgMy41KyAodW50ZXN0ZWQpXG4gKlxuICogUmVxdWlyZXMgVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2UuXG4gKlxuICogVHJpZXMgdG8gY2F0Y2ggYWxsIHVuaGFuZGxlZCBleGNlcHRpb25zIGFuZCByZXBvcnQgdGhlbSB0byB0aGVcbiAqIHN1YnNjcmliZWQgaGFuZGxlcnMuIFBsZWFzZSBub3RlIHRoYXQgVHJhY2VLaXQucmVwb3J0IHdpbGwgcmV0aHJvdyB0aGVcbiAqIGV4Y2VwdGlvbi4gVGhpcyBpcyBSRVFVSVJFRCBpbiBvcmRlciB0byBnZXQgYSB1c2VmdWwgc3RhY2sgdHJhY2UgaW4gSUUuXG4gKiBJZiB0aGUgZXhjZXB0aW9uIGRvZXMgbm90IHJlYWNoIHRoZSB0b3Agb2YgdGhlIGJyb3dzZXIsIHlvdSB3aWxsIG9ubHlcbiAqIGdldCBhIHN0YWNrIHRyYWNlIGZyb20gdGhlIHBvaW50IHdoZXJlIFRyYWNlS2l0LnJlcG9ydCB3YXMgY2FsbGVkLlxuICpcbiAqIEhhbmRsZXJzIHJlY2VpdmUgYSBzdGFja0luZm8gb2JqZWN0IGFzIGRlc2NyaWJlZCBpbiB0aGVcbiAqIFRyYWNlS2l0LmNvbXB1dGVTdGFja1RyYWNlIGRvY3MuXG4gKi9cblRyYWNlS2l0LnJlcG9ydCA9IChmdW5jdGlvbiByZXBvcnRNb2R1bGVXcmFwcGVyKCkge1xuICAgIHZhciBoYW5kbGVycyA9IFtdLFxuICAgICAgICBsYXN0QXJncyA9IG51bGwsXG4gICAgICAgIGxhc3RFeGNlcHRpb24gPSBudWxsLFxuICAgICAgICBsYXN0RXhjZXB0aW9uU3RhY2sgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogQWRkIGEgY3Jhc2ggaGFuZGxlci5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3Vic2NyaWJlKGhhbmRsZXIpIHtcbiAgICAgICAgaW5zdGFsbEdsb2JhbEhhbmRsZXIoKTtcbiAgICAgICAgaGFuZGxlcnMucHVzaChoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBjcmFzaCBoYW5kbGVyLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKi9cbiAgICBmdW5jdGlvbiB1bnN1YnNjcmliZShoYW5kbGVyKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBoYW5kbGVycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgaWYgKGhhbmRsZXJzW2ldID09PSBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFsbCBjcmFzaCBoYW5kbGVycy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB1bnN1YnNjcmliZUFsbCgpIHtcbiAgICAgICAgdW5pbnN0YWxsR2xvYmFsSGFuZGxlcigpO1xuICAgICAgICBoYW5kbGVycyA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERpc3BhdGNoIHN0YWNrIGluZm9ybWF0aW9uIHRvIGFsbCBoYW5kbGVycy5cbiAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCAqPn0gc3RhY2tcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBub3RpZnlIYW5kbGVycyhzdGFjaywgaXNXaW5kb3dFcnJvcikge1xuICAgICAgICB2YXIgZXhjZXB0aW9uID0gbnVsbDtcbiAgICAgICAgaWYgKGlzV2luZG93RXJyb3IgJiYgIVRyYWNlS2l0LmNvbGxlY3RXaW5kb3dFcnJvcnMpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSBpbiBoYW5kbGVycykge1xuICAgICAgICAgICAgaWYgKGhhc0tleShoYW5kbGVycywgaSkpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyc1tpXS5hcHBseShudWxsLCBbc3RhY2tdLmNvbmNhdChfc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpKSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoaW5uZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gaW5uZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIF9vbGRPbmVycm9ySGFuZGxlciwgX29uRXJyb3JIYW5kbGVySW5zdGFsbGVkO1xuXG4gICAgLyoqXG4gICAgICogRW5zdXJlcyBhbGwgZ2xvYmFsIHVuaGFuZGxlZCBleGNlcHRpb25zIGFyZSByZWNvcmRlZC5cbiAgICAgKiBTdXBwb3J0ZWQgYnkgR2Vja28gYW5kIElFLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIEVycm9yIG1lc3NhZ2UuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBVUkwgb2Ygc2NyaXB0IHRoYXQgZ2VuZXJhdGVkIHRoZSBleGNlcHRpb24uXG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IGxpbmVObyBUaGUgbGluZSBudW1iZXIgYXQgd2hpY2ggdGhlIGVycm9yXG4gICAgICogb2NjdXJyZWQuXG4gICAgICogQHBhcmFtIHs/KG51bWJlcnxzdHJpbmcpfSBjb2xObyBUaGUgY29sdW1uIG51bWJlciBhdCB3aGljaCB0aGUgZXJyb3JcbiAgICAgKiBvY2N1cnJlZC5cbiAgICAgKiBAcGFyYW0gez9FcnJvcn0gZXggVGhlIGFjdHVhbCBFcnJvciBvYmplY3QuXG4gICAgICovXG4gICAgZnVuY3Rpb24gdHJhY2VLaXRXaW5kb3dPbkVycm9yKG1lc3NhZ2UsIHVybCwgbGluZU5vLCBjb2xObywgZXgpIHtcbiAgICAgICAgdmFyIHN0YWNrID0gbnVsbDtcblxuICAgICAgICBpZiAobGFzdEV4Y2VwdGlvblN0YWNrKSB7XG4gICAgICAgICAgICBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZS5hdWdtZW50U3RhY2tUcmFjZVdpdGhJbml0aWFsRWxlbWVudChsYXN0RXhjZXB0aW9uU3RhY2ssIHVybCwgbGluZU5vLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIHByb2Nlc3NMYXN0RXhjZXB0aW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXgpIHtcbiAgICAgICAgICAgIC8vIE5ldyBjaHJvbWUgYW5kIGJsaW5rIHNlbmQgYWxvbmcgYSByZWFsIGVycm9yIG9iamVjdFxuICAgICAgICAgICAgLy8gTGV0J3MganVzdCByZXBvcnQgdGhhdCBsaWtlIGEgbm9ybWFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU2VlOiBodHRwczovL21pa2V3ZXN0Lm9yZy8yMDEzLzA4L2RlYnVnZ2luZy1ydW50aW1lLWVycm9ycy13aXRoLXdpbmRvdy1vbmVycm9yXG4gICAgICAgICAgICBzdGFjayA9IFRyYWNlS2l0LmNvbXB1dGVTdGFja1RyYWNlKGV4KTtcbiAgICAgICAgICAgIG5vdGlmeUhhbmRsZXJzKHN0YWNrLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAndXJsJzogdXJsLFxuICAgICAgICAgICAgICAgICdsaW5lJzogbGluZU5vLFxuICAgICAgICAgICAgICAgICdjb2x1bW4nOiBjb2xOb1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxvY2F0aW9uLmZ1bmMgPSBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZS5ndWVzc0Z1bmN0aW9uTmFtZShsb2NhdGlvbi51cmwsIGxvY2F0aW9uLmxpbmUpO1xuICAgICAgICAgICAgbG9jYXRpb24uY29udGV4dCA9IFRyYWNlS2l0LmNvbXB1dGVTdGFja1RyYWNlLmdhdGhlckNvbnRleHQobG9jYXRpb24udXJsLCBsb2NhdGlvbi5saW5lKTtcbiAgICAgICAgICAgIHN0YWNrID0ge1xuICAgICAgICAgICAgICAgICdtZXNzYWdlJzogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAndXJsJzogZG9jdW1lbnQubG9jYXRpb24uaHJlZixcbiAgICAgICAgICAgICAgICAnc3RhY2snOiBbbG9jYXRpb25dXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbm90aWZ5SGFuZGxlcnMoc3RhY2ssIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF9vbGRPbmVycm9ySGFuZGxlcikge1xuICAgICAgICAgICAgcmV0dXJuIF9vbGRPbmVycm9ySGFuZGxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluc3RhbGxHbG9iYWxIYW5kbGVyICgpXG4gICAge1xuICAgICAgICBpZiAoX29uRXJyb3JIYW5kbGVySW5zdGFsbGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgX29sZE9uZXJyb3JIYW5kbGVyID0gd2luZG93Lm9uZXJyb3I7XG4gICAgICAgIHdpbmRvdy5vbmVycm9yID0gdHJhY2VLaXRXaW5kb3dPbkVycm9yO1xuICAgICAgICBfb25FcnJvckhhbmRsZXJJbnN0YWxsZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVuaW5zdGFsbEdsb2JhbEhhbmRsZXIgKClcbiAgICB7XG4gICAgICAgIGlmICghX29uRXJyb3JIYW5kbGVySW5zdGFsbGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93Lm9uZXJyb3IgPSBfb2xkT25lcnJvckhhbmRsZXI7XG4gICAgICAgIF9vbkVycm9ySGFuZGxlckluc3RhbGxlZCA9IGZhbHNlO1xuICAgICAgICBfb2xkT25lcnJvckhhbmRsZXIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0xhc3RFeGNlcHRpb24oKSB7XG4gICAgICAgIHZhciBfbGFzdEV4Y2VwdGlvblN0YWNrID0gbGFzdEV4Y2VwdGlvblN0YWNrLFxuICAgICAgICAgICAgX2xhc3RBcmdzID0gbGFzdEFyZ3M7XG4gICAgICAgIGxhc3RBcmdzID0gbnVsbDtcbiAgICAgICAgbGFzdEV4Y2VwdGlvblN0YWNrID0gbnVsbDtcbiAgICAgICAgbGFzdEV4Y2VwdGlvbiA9IG51bGw7XG4gICAgICAgIG5vdGlmeUhhbmRsZXJzLmFwcGx5KG51bGwsIFtfbGFzdEV4Y2VwdGlvblN0YWNrLCBmYWxzZV0uY29uY2F0KF9sYXN0QXJncykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcG9ydHMgYW4gdW5oYW5kbGVkIEVycm9yIHRvIFRyYWNlS2l0LlxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGV4XG4gICAgICogQHBhcmFtIHs/Ym9vbGVhbn0gcmV0aHJvdyBJZiBmYWxzZSwgZG8gbm90IHJlLXRocm93IHRoZSBleGNlcHRpb24uXG4gICAgICogT25seSB1c2VkIGZvciB3aW5kb3cub25lcnJvciB0byBub3QgY2F1c2UgYW4gaW5maW5pdGUgbG9vcCBvZlxuICAgICAqIHJldGhyb3dpbmcuXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVwb3J0KGV4LCByZXRocm93KSB7XG4gICAgICAgIHZhciBhcmdzID0gX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaWYgKGxhc3RFeGNlcHRpb25TdGFjaykge1xuICAgICAgICAgICAgaWYgKGxhc3RFeGNlcHRpb24gPT09IGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBhbHJlYWR5IGNhdWdodCBieSBhbiBpbm5lciBjYXRjaCBibG9jaywgaWdub3JlXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwcm9jZXNzTGFzdEV4Y2VwdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0YWNrID0gVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2UoZXgpO1xuICAgICAgICBsYXN0RXhjZXB0aW9uU3RhY2sgPSBzdGFjaztcbiAgICAgICAgbGFzdEV4Y2VwdGlvbiA9IGV4O1xuICAgICAgICBsYXN0QXJncyA9IGFyZ3M7XG5cbiAgICAgICAgLy8gSWYgdGhlIHN0YWNrIHRyYWNlIGlzIGluY29tcGxldGUsIHdhaXQgZm9yIDIgc2Vjb25kcyBmb3JcbiAgICAgICAgLy8gc2xvdyBzbG93IElFIHRvIHNlZSBpZiBvbmVycm9yIG9jY3VycyBvciBub3QgYmVmb3JlIHJlcG9ydGluZ1xuICAgICAgICAvLyB0aGlzIGV4Y2VwdGlvbjsgb3RoZXJ3aXNlLCB3ZSB3aWxsIGVuZCB1cCB3aXRoIGFuIGluY29tcGxldGVcbiAgICAgICAgLy8gc3RhY2sgdHJhY2VcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGxhc3RFeGNlcHRpb24gPT09IGV4KSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzc0xhc3RFeGNlcHRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgKHN0YWNrLmluY29tcGxldGUgPyAyMDAwIDogMCkpO1xuXG4gICAgICAgIGlmIChyZXRocm93ICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhyb3cgZXg7IC8vIHJlLXRocm93IHRvIHByb3BhZ2F0ZSB0byB0aGUgdG9wIGxldmVsIChhbmQgY2F1c2Ugd2luZG93Lm9uZXJyb3IpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXBvcnQuc3Vic2NyaWJlID0gc3Vic2NyaWJlO1xuICAgIHJlcG9ydC51bnN1YnNjcmliZSA9IHVuc3Vic2NyaWJlO1xuICAgIHJlcG9ydC51bmluc3RhbGwgPSB1bnN1YnNjcmliZUFsbDtcbiAgICByZXR1cm4gcmVwb3J0O1xufSgpKTtcblxuLyoqXG4gKiBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZTogY3Jvc3MtYnJvd3NlciBzdGFjayB0cmFjZXMgaW4gSmF2YVNjcmlwdFxuICpcbiAqIFN5bnRheDpcbiAqICAgcyA9IFRyYWNlS2l0LmNvbXB1dGVTdGFja1RyYWNlLm9mQ2FsbGVyKFtkZXB0aF0pXG4gKiAgIHMgPSBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZShleGNlcHRpb24pIC8vIGNvbnNpZGVyIHVzaW5nIFRyYWNlS2l0LnJlcG9ydCBpbnN0ZWFkIChzZWUgYmVsb3cpXG4gKiBSZXR1cm5zOlxuICogICBzLm5hbWUgICAgICAgICAgICAgIC0gZXhjZXB0aW9uIG5hbWVcbiAqICAgcy5tZXNzYWdlICAgICAgICAgICAtIGV4Y2VwdGlvbiBtZXNzYWdlXG4gKiAgIHMuc3RhY2tbaV0udXJsICAgICAgLSBKYXZhU2NyaXB0IG9yIEhUTUwgZmlsZSBVUkxcbiAqICAgcy5zdGFja1tpXS5mdW5jICAgICAtIGZ1bmN0aW9uIG5hbWUsIG9yIGVtcHR5IGZvciBhbm9ueW1vdXMgZnVuY3Rpb25zIChpZiBndWVzc2luZyBkaWQgbm90IHdvcmspXG4gKiAgIHMuc3RhY2tbaV0uYXJncyAgICAgLSBhcmd1bWVudHMgcGFzc2VkIHRvIHRoZSBmdW5jdGlvbiwgaWYga25vd25cbiAqICAgcy5zdGFja1tpXS5saW5lICAgICAtIGxpbmUgbnVtYmVyLCBpZiBrbm93blxuICogICBzLnN0YWNrW2ldLmNvbHVtbiAgIC0gY29sdW1uIG51bWJlciwgaWYga25vd25cbiAqICAgcy5zdGFja1tpXS5jb250ZXh0ICAtIGFuIGFycmF5IG9mIHNvdXJjZSBjb2RlIGxpbmVzOyB0aGUgbWlkZGxlIGVsZW1lbnQgY29ycmVzcG9uZHMgdG8gdGhlIGNvcnJlY3QgbGluZSNcbiAqXG4gKiBTdXBwb3J0czpcbiAqICAgLSBGaXJlZm94OiAgZnVsbCBzdGFjayB0cmFjZSB3aXRoIGxpbmUgbnVtYmVycyBhbmQgdW5yZWxpYWJsZSBjb2x1bW5cbiAqICAgICAgICAgICAgICAgbnVtYmVyIG9uIHRvcCBmcmFtZVxuICogICAtIE9wZXJhIDEwOiBmdWxsIHN0YWNrIHRyYWNlIHdpdGggbGluZSBhbmQgY29sdW1uIG51bWJlcnNcbiAqICAgLSBPcGVyYSA5LTogZnVsbCBzdGFjayB0cmFjZSB3aXRoIGxpbmUgbnVtYmVyc1xuICogICAtIENocm9tZTogICBmdWxsIHN0YWNrIHRyYWNlIHdpdGggbGluZSBhbmQgY29sdW1uIG51bWJlcnNcbiAqICAgLSBTYWZhcmk6ICAgbGluZSBhbmQgY29sdW1uIG51bWJlciBmb3IgdGhlIHRvcG1vc3Qgc3RhY2t0cmFjZSBlbGVtZW50XG4gKiAgICAgICAgICAgICAgIG9ubHlcbiAqICAgLSBJRTogICAgICAgbm8gbGluZSBudW1iZXJzIHdoYXRzb2V2ZXJcbiAqXG4gKiBUcmllcyB0byBndWVzcyBuYW1lcyBvZiBhbm9ueW1vdXMgZnVuY3Rpb25zIGJ5IGxvb2tpbmcgZm9yIGFzc2lnbm1lbnRzXG4gKiBpbiB0aGUgc291cmNlIGNvZGUuIEluIElFIGFuZCBTYWZhcmksIHdlIGhhdmUgdG8gZ3Vlc3Mgc291cmNlIGZpbGUgbmFtZXNcbiAqIGJ5IHNlYXJjaGluZyBmb3IgZnVuY3Rpb24gYm9kaWVzIGluc2lkZSBhbGwgcGFnZSBzY3JpcHRzLiBUaGlzIHdpbGwgbm90XG4gKiB3b3JrIGZvciBzY3JpcHRzIHRoYXQgYXJlIGxvYWRlZCBjcm9zcy1kb21haW4uXG4gKiBIZXJlIGJlIGRyYWdvbnM6IHNvbWUgZnVuY3Rpb24gbmFtZXMgbWF5IGJlIGd1ZXNzZWQgaW5jb3JyZWN0bHksIGFuZFxuICogZHVwbGljYXRlIGZ1bmN0aW9ucyBtYXkgYmUgbWlzbWF0Y2hlZC5cbiAqXG4gKiBUcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZSBzaG91bGQgb25seSBiZSB1c2VkIGZvciB0cmFjaW5nIHB1cnBvc2VzLlxuICogTG9nZ2luZyBvZiB1bmhhbmRsZWQgZXhjZXB0aW9ucyBzaG91bGQgYmUgZG9uZSB3aXRoIFRyYWNlS2l0LnJlcG9ydCxcbiAqIHdoaWNoIGJ1aWxkcyBvbiB0b3Agb2YgVHJhY2VLaXQuY29tcHV0ZVN0YWNrVHJhY2UgYW5kIHByb3ZpZGVzIGJldHRlclxuICogSUUgc3VwcG9ydCBieSB1dGlsaXppbmcgdGhlIHdpbmRvdy5vbmVycm9yIGV2ZW50IHRvIHJldHJpZXZlIGluZm9ybWF0aW9uXG4gKiBhYm91dCB0aGUgdG9wIG9mIHRoZSBzdGFjay5cbiAqXG4gKiBOb3RlOiBJbiBJRSBhbmQgU2FmYXJpLCBubyBzdGFjayB0cmFjZSBpcyByZWNvcmRlZCBvbiB0aGUgRXJyb3Igb2JqZWN0LFxuICogc28gY29tcHV0ZVN0YWNrVHJhY2UgaW5zdGVhZCB3YWxrcyBpdHMgKm93biogY2hhaW4gb2YgY2FsbGVycy5cbiAqIFRoaXMgbWVhbnMgdGhhdDpcbiAqICAqIGluIFNhZmFyaSwgc29tZSBtZXRob2RzIG1heSBiZSBtaXNzaW5nIGZyb20gdGhlIHN0YWNrIHRyYWNlO1xuICogICogaW4gSUUsIHRoZSB0b3Btb3N0IGZ1bmN0aW9uIGluIHRoZSBzdGFjayB0cmFjZSB3aWxsIGFsd2F5cyBiZSB0aGVcbiAqICAgIGNhbGxlciBvZiBjb21wdXRlU3RhY2tUcmFjZS5cbiAqXG4gKiBUaGlzIGlzIG9rYXkgZm9yIHRyYWNpbmcgKGJlY2F1c2UgeW91IGFyZSBsaWtlbHkgdG8gYmUgY2FsbGluZ1xuICogY29tcHV0ZVN0YWNrVHJhY2UgZnJvbSB0aGUgZnVuY3Rpb24geW91IHdhbnQgdG8gYmUgdGhlIHRvcG1vc3QgZWxlbWVudFxuICogb2YgdGhlIHN0YWNrIHRyYWNlIGFueXdheSksIGJ1dCBub3Qgb2theSBmb3IgbG9nZ2luZyB1bmhhbmRsZWRcbiAqIGV4Y2VwdGlvbnMgKGJlY2F1c2UgeW91ciBjYXRjaCBibG9jayB3aWxsIGxpa2VseSBiZSBmYXIgYXdheSBmcm9tIHRoZVxuICogaW5uZXIgZnVuY3Rpb24gdGhhdCBhY3R1YWxseSBjYXVzZWQgdGhlIGV4Y2VwdGlvbikuXG4gKlxuICogVHJhY2luZyBleGFtcGxlOlxuICogICAgIGZ1bmN0aW9uIHRyYWNlKG1lc3NhZ2UpIHtcbiAqICAgICAgICAgdmFyIHN0YWNrSW5mbyA9IFRyYWNlS2l0LmNvbXB1dGVTdGFja1RyYWNlLm9mQ2FsbGVyKCk7XG4gKiAgICAgICAgIHZhciBkYXRhID0gbWVzc2FnZSArIFwiXFxuXCI7XG4gKiAgICAgICAgIGZvcih2YXIgaSBpbiBzdGFja0luZm8uc3RhY2spIHtcbiAqICAgICAgICAgICAgIHZhciBpdGVtID0gc3RhY2tJbmZvLnN0YWNrW2ldO1xuICogICAgICAgICAgICAgZGF0YSArPSAoaXRlbS5mdW5jIHx8ICdbYW5vbnltb3VzXScpICsgXCIoKSBpbiBcIiArIGl0ZW0udXJsICsgXCI6XCIgKyAoaXRlbS5saW5lIHx8ICcwJykgKyBcIlxcblwiO1xuICogICAgICAgICB9XG4gKiAgICAgICAgIGlmICh3aW5kb3cuY29uc29sZSlcbiAqICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhkYXRhKTtcbiAqICAgICAgICAgZWxzZVxuICogICAgICAgICAgICAgYWxlcnQoZGF0YSk7XG4gKiAgICAgfVxuICovXG5UcmFjZUtpdC5jb21wdXRlU3RhY2tUcmFjZSA9IChmdW5jdGlvbiBjb21wdXRlU3RhY2tUcmFjZVdyYXBwZXIoKSB7XG4gICAgdmFyIGRlYnVnID0gZmFsc2UsXG4gICAgICAgIHNvdXJjZUNhY2hlID0ge307XG5cbiAgICAvKipcbiAgICAgKiBBdHRlbXB0cyB0byByZXRyaWV2ZSBzb3VyY2UgY29kZSB2aWEgWE1MSHR0cFJlcXVlc3QsIHdoaWNoIGlzIHVzZWRcbiAgICAgKiB0byBsb29rIHVwIGFub255bW91cyBmdW5jdGlvbiBuYW1lcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFVSTCBvZiBzb3VyY2UgY29kZS5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFNvdXJjZSBjb250ZW50cy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBsb2FkU291cmNlKHVybCkge1xuICAgICAgICBpZiAoIVRyYWNlS2l0LnJlbW90ZUZldGNoaW5nKSB7IC8vT25seSBhdHRlbXB0IHJlcXVlc3QgaWYgcmVtb3RlRmV0Y2hpbmcgaXMgb24uXG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBnZXRYSFIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IHdpbmRvdy5YTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXhwbGljaXRseSBidWJibGUgdXAgdGhlIGV4Y2VwdGlvbiBpZiBub3QgZm91bmRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyB3aW5kb3cuQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IGdldFhIUigpO1xuICAgICAgICAgICAgcmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwsIGZhbHNlKTtcbiAgICAgICAgICAgIHJlcXVlc3Quc2VuZCgnJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlcyBzb3VyY2UgY29kZSBmcm9tIHRoZSBzb3VyY2UgY29kZSBjYWNoZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFVSTCBvZiBzb3VyY2UgY29kZS5cbiAgICAgKiBAcmV0dXJuIHtBcnJheS48c3RyaW5nPn0gU291cmNlIGNvbnRlbnRzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldFNvdXJjZSh1cmwpIHtcbiAgICAgICAgaWYgKCFpc1N0cmluZyh1cmwpKSByZXR1cm4gW107XG4gICAgICAgIGlmICghaGFzS2V5KHNvdXJjZUNhY2hlLCB1cmwpKSB7XG4gICAgICAgICAgICAvLyBVUkwgbmVlZHMgdG8gYmUgYWJsZSB0byBmZXRjaGVkIHdpdGhpbiB0aGUgYWNjZXB0YWJsZSBkb21haW4uICBPdGhlcndpc2UsXG4gICAgICAgICAgICAvLyBjcm9zcy1kb21haW4gZXJyb3JzIHdpbGwgYmUgdHJpZ2dlcmVkLlxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9ICcnO1xuICAgICAgICAgICAgaWYgKHVybC5pbmRleE9mKGRvY3VtZW50LmRvbWFpbikgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgc291cmNlID0gbG9hZFNvdXJjZSh1cmwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc291cmNlQ2FjaGVbdXJsXSA9IHNvdXJjZSA/IHNvdXJjZS5zcGxpdCgnXFxuJykgOiBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb3VyY2VDYWNoZVt1cmxdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRyaWVzIHRvIHVzZSBhbiBleHRlcm5hbGx5IGxvYWRlZCBjb3B5IG9mIHNvdXJjZSBjb2RlIHRvIGRldGVybWluZVxuICAgICAqIHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24gYnkgbG9va2luZyBhdCB0aGUgbmFtZSBvZiB0aGUgdmFyaWFibGUgaXQgd2FzXG4gICAgICogYXNzaWduZWQgdG8sIGlmIGFueS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFVSTCBvZiBzb3VyY2UgY29kZS5cbiAgICAgKiBAcGFyYW0geyhzdHJpbmd8bnVtYmVyKX0gbGluZU5vIExpbmUgbnVtYmVyIGluIHNvdXJjZSBjb2RlLlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGZ1bmN0aW9uIG5hbWUsIGlmIGRpc2NvdmVyYWJsZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBndWVzc0Z1bmN0aW9uTmFtZSh1cmwsIGxpbmVObykge1xuICAgICAgICB2YXIgcmVGdW5jdGlvbkFyZ05hbWVzID0gL2Z1bmN0aW9uIChbXihdKilcXCgoW14pXSopXFwpLyxcbiAgICAgICAgICAgIHJlR3Vlc3NGdW5jdGlvbiA9IC9bJ1wiXT8oWzAtOUEtWmEteiRfXSspWydcIl0/XFxzKls6PV1cXHMqKGZ1bmN0aW9ufGV2YWx8bmV3IEZ1bmN0aW9uKS8sXG4gICAgICAgICAgICBsaW5lID0gJycsXG4gICAgICAgICAgICBtYXhMaW5lcyA9IDEwLFxuICAgICAgICAgICAgc291cmNlID0gZ2V0U291cmNlKHVybCksXG4gICAgICAgICAgICBtO1xuXG4gICAgICAgIGlmICghc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIFVOS05PV05fRlVOQ1RJT047XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXYWxrIGJhY2t3YXJkcyBmcm9tIHRoZSBmaXJzdCBsaW5lIGluIHRoZSBmdW5jdGlvbiB1bnRpbCB3ZSBmaW5kIHRoZSBsaW5lIHdoaWNoXG4gICAgICAgIC8vIG1hdGNoZXMgdGhlIHBhdHRlcm4gYWJvdmUsIHdoaWNoIGlzIHRoZSBmdW5jdGlvbiBkZWZpbml0aW9uXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF4TGluZXM7ICsraSkge1xuICAgICAgICAgICAgbGluZSA9IHNvdXJjZVtsaW5lTm8gLSBpXSArIGxpbmU7XG5cbiAgICAgICAgICAgIGlmICghaXNVbmRlZmluZWQobGluZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoKG0gPSByZUd1ZXNzRnVuY3Rpb24uZXhlYyhsaW5lKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1bMV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgobSA9IHJlRnVuY3Rpb25BcmdOYW1lcy5leGVjKGxpbmUpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbVsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVU5LTk9XTl9GVU5DVElPTjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgdGhlIHN1cnJvdW5kaW5nIGxpbmVzIGZyb20gd2hlcmUgYW4gZXhjZXB0aW9uIG9jY3VycmVkLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVVJMIG9mIHNvdXJjZSBjb2RlLlxuICAgICAqIEBwYXJhbSB7KHN0cmluZ3xudW1iZXIpfSBsaW5lIExpbmUgbnVtYmVyIGluIHNvdXJjZSBjb2RlIHRvIGNlbnRyZVxuICAgICAqIGFyb3VuZCBmb3IgY29udGV4dC5cbiAgICAgKiBAcmV0dXJuIHs/QXJyYXkuPHN0cmluZz59IExpbmVzIG9mIHNvdXJjZSBjb2RlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdhdGhlckNvbnRleHQodXJsLCBsaW5lKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBnZXRTb3VyY2UodXJsKTtcblxuICAgICAgICBpZiAoIXNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvbnRleHQgPSBbXSxcbiAgICAgICAgICAgIC8vIGxpbmVzQmVmb3JlICYgbGluZXNBZnRlciBhcmUgaW5jbHVzaXZlIHdpdGggdGhlIG9mZmVuZGluZyBsaW5lLlxuICAgICAgICAgICAgLy8gaWYgbGluZXNPZkNvbnRleHQgaXMgZXZlbiwgdGhlcmUgd2lsbCBiZSBvbmUgZXh0cmEgbGluZVxuICAgICAgICAgICAgLy8gICAqYmVmb3JlKiB0aGUgb2ZmZW5kaW5nIGxpbmUuXG4gICAgICAgICAgICBsaW5lc0JlZm9yZSA9IE1hdGguZmxvb3IoVHJhY2VLaXQubGluZXNPZkNvbnRleHQgLyAyKSxcbiAgICAgICAgICAgIC8vIEFkZCBvbmUgZXh0cmEgbGluZSBpZiBsaW5lc09mQ29udGV4dCBpcyBvZGRcbiAgICAgICAgICAgIGxpbmVzQWZ0ZXIgPSBsaW5lc0JlZm9yZSArIChUcmFjZUtpdC5saW5lc09mQ29udGV4dCAlIDIpLFxuICAgICAgICAgICAgc3RhcnQgPSBNYXRoLm1heCgwLCBsaW5lIC0gbGluZXNCZWZvcmUgLSAxKSxcbiAgICAgICAgICAgIGVuZCA9IE1hdGgubWluKHNvdXJjZS5sZW5ndGgsIGxpbmUgKyBsaW5lc0FmdGVyIC0gMSk7XG5cbiAgICAgICAgbGluZSAtPSAxOyAvLyBjb252ZXJ0IHRvIDAtYmFzZWQgaW5kZXhcblxuICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgICAgICAgaWYgKCFpc1VuZGVmaW5lZChzb3VyY2VbaV0pKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5wdXNoKHNvdXJjZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY29udGV4dC5sZW5ndGggPiAwID8gY29udGV4dCA6IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXNjYXBlcyBzcGVjaWFsIGNoYXJhY3RlcnMsIGV4Y2VwdCBmb3Igd2hpdGVzcGFjZSwgaW4gYSBzdHJpbmcgdG8gYmVcbiAgICAgKiB1c2VkIGluc2lkZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyBhIHN0cmluZyBsaXRlcmFsLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSBzdHJpbmcuXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgZXNjYXBlZCBzdHJpbmcgbGl0ZXJhbC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlc2NhcGVSZWdFeHAodGV4dCkge1xuICAgICAgICByZXR1cm4gdGV4dC5yZXBsYWNlKC9bXFwtXFxbXFxde30oKSorPy4sXFxcXFxcXiR8I10vZywgJ1xcXFwkJicpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVzY2FwZXMgc3BlY2lhbCBjaGFyYWN0ZXJzIGluIGEgc3RyaW5nIHRvIGJlIHVzZWQgaW5zaWRlIGEgcmVndWxhclxuICAgICAqIGV4cHJlc3Npb24gYXMgYSBzdHJpbmcgbGl0ZXJhbC4gQWxzbyBlbnN1cmVzIHRoYXQgSFRNTCBlbnRpdGllcyB3aWxsXG4gICAgICogYmUgbWF0Y2hlZCB0aGUgc2FtZSBhcyB0aGVpciBsaXRlcmFsIGZyaWVuZHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJvZHkgVGhlIHN0cmluZy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBlc2NhcGVkIHN0cmluZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlc2NhcGVDb2RlQXNSZWdFeHBGb3JNYXRjaGluZ0luc2lkZUhUTUwoYm9keSkge1xuICAgICAgICByZXR1cm4gZXNjYXBlUmVnRXhwKGJvZHkpLnJlcGxhY2UoJzwnLCAnKD86PHwmbHQ7KScpLnJlcGxhY2UoJz4nLCAnKD86PnwmZ3Q7KScpLnJlcGxhY2UoJyYnLCAnKD86JnwmYW1wOyknKS5yZXBsYWNlKCdcIicsICcoPzpcInwmcXVvdDspJykucmVwbGFjZSgvXFxzKy9nLCAnXFxcXHMrJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB3aGVyZSBhIGNvZGUgZnJhZ21lbnQgb2NjdXJzIGluIHRoZSBzb3VyY2UgY29kZS5cbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gcmUgVGhlIGZ1bmN0aW9uIGRlZmluaXRpb24uXG4gICAgICogQHBhcmFtIHtBcnJheS48c3RyaW5nPn0gdXJscyBBIGxpc3Qgb2YgVVJMcyB0byBzZWFyY2guXG4gICAgICogQHJldHVybiB7P09iamVjdC48c3RyaW5nLCAoc3RyaW5nfG51bWJlcik+fSBBbiBvYmplY3QgY29udGFpbmluZ1xuICAgICAqIHRoZSB1cmwsIGxpbmUsIGFuZCBjb2x1bW4gbnVtYmVyIG9mIHRoZSBkZWZpbmVkIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGZpbmRTb3VyY2VJblVybHMocmUsIHVybHMpIHtcbiAgICAgICAgdmFyIHNvdXJjZSwgbTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSB1cmxzLmxlbmd0aDsgaSA8IGo7ICsraSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ3NlYXJjaGluZycsIHVybHNbaV0pO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPSBnZXRTb3VyY2UodXJsc1tpXSkpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5qb2luKCdcXG4nKTtcbiAgICAgICAgICAgICAgICBpZiAoKG0gPSByZS5leGVjKHNvdXJjZSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdGb3VuZCBmdW5jdGlvbiBpbiAnICsgdXJsc1tpXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICd1cmwnOiB1cmxzW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2xpbmUnOiBzb3VyY2Uuc3Vic3RyaW5nKDAsIG0uaW5kZXgpLnNwbGl0KCdcXG4nKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAnY29sdW1uJzogbS5pbmRleCAtIHNvdXJjZS5sYXN0SW5kZXhPZignXFxuJywgbS5pbmRleCkgLSAxXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coJ25vIG1hdGNoJyk7XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBhdCB3aGljaCBjb2x1bW4gYSBjb2RlIGZyYWdtZW50IG9jY3VycyBvbiBhIGxpbmUgb2YgdGhlXG4gICAgICogc291cmNlIGNvZGUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGZyYWdtZW50IFRoZSBjb2RlIGZyYWdtZW50LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGhlIFVSTCB0byBzZWFyY2guXG4gICAgICogQHBhcmFtIHsoc3RyaW5nfG51bWJlcil9IGxpbmUgVGhlIGxpbmUgbnVtYmVyIHRvIGV4YW1pbmUuXG4gICAgICogQHJldHVybiB7P251bWJlcn0gVGhlIGNvbHVtbiBudW1iZXIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZmluZFNvdXJjZUluTGluZShmcmFnbWVudCwgdXJsLCBsaW5lKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBnZXRTb3VyY2UodXJsKSxcbiAgICAgICAgICAgIHJlID0gbmV3IFJlZ0V4cCgnXFxcXGInICsgZXNjYXBlUmVnRXhwKGZyYWdtZW50KSArICdcXFxcYicpLFxuICAgICAgICAgICAgbTtcblxuICAgICAgICBsaW5lIC09IDE7XG5cbiAgICAgICAgaWYgKHNvdXJjZSAmJiBzb3VyY2UubGVuZ3RoID4gbGluZSAmJiAobSA9IHJlLmV4ZWMoc291cmNlW2xpbmVdKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBtLmluZGV4O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB3aGVyZSBhIGZ1bmN0aW9uIHdhcyBkZWZpbmVkIHdpdGhpbiB0aGUgc291cmNlIGNvZGUuXG4gICAgICogQHBhcmFtIHsoRnVuY3Rpb258c3RyaW5nKX0gZnVuYyBBIGZ1bmN0aW9uIHJlZmVyZW5jZSBvciBzZXJpYWxpemVkXG4gICAgICogZnVuY3Rpb24gZGVmaW5pdGlvbi5cbiAgICAgKiBAcmV0dXJuIHs/T2JqZWN0LjxzdHJpbmcsIChzdHJpbmd8bnVtYmVyKT59IEFuIG9iamVjdCBjb250YWluaW5nXG4gICAgICogdGhlIHVybCwgbGluZSwgYW5kIGNvbHVtbiBudW1iZXIgb2YgdGhlIGRlZmluZWQgZnVuY3Rpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gZmluZFNvdXJjZUJ5RnVuY3Rpb25Cb2R5KGZ1bmMpIHtcbiAgICAgICAgdmFyIHVybHMgPSBbd2luZG93LmxvY2F0aW9uLmhyZWZdLFxuICAgICAgICAgICAgc2NyaXB0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKSxcbiAgICAgICAgICAgIGJvZHksXG4gICAgICAgICAgICBjb2RlID0gJycgKyBmdW5jLFxuICAgICAgICAgICAgY29kZVJFID0gL15mdW5jdGlvbig/OlxccysoW1xcdyRdKykpP1xccypcXCgoW1xcd1xccyxdKilcXClcXHMqXFx7XFxzKihcXFNbXFxzXFxTXSpcXFMpXFxzKlxcfVxccyokLyxcbiAgICAgICAgICAgIGV2ZW50UkUgPSAvXmZ1bmN0aW9uIG9uKFtcXHckXSspXFxzKlxcKGV2ZW50XFwpXFxzKlxce1xccyooXFxTW1xcc1xcU10qXFxTKVxccypcXH1cXHMqJC8sXG4gICAgICAgICAgICByZSxcbiAgICAgICAgICAgIHBhcnRzLFxuICAgICAgICAgICAgcmVzdWx0O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NyaXB0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIHNjcmlwdCA9IHNjcmlwdHNbaV07XG4gICAgICAgICAgICBpZiAoc2NyaXB0LnNyYykge1xuICAgICAgICAgICAgICAgIHVybHMucHVzaChzY3JpcHQuc3JjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghKHBhcnRzID0gY29kZVJFLmV4ZWMoY29kZSkpKSB7XG4gICAgICAgICAgICByZSA9IG5ldyBSZWdFeHAoZXNjYXBlUmVnRXhwKGNvZGUpLnJlcGxhY2UoL1xccysvZywgJ1xcXFxzKycpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vdCBzdXJlIGlmIHRoaXMgaXMgcmVhbGx5IG5lY2Vzc2FyeSwgYnV0IEkgZG9u4oCZdCBoYXZlIGEgdGVzdFxuICAgICAgICAvLyBjb3JwdXMgbGFyZ2UgZW5vdWdoIHRvIGNvbmZpcm0gdGhhdCBhbmQgaXQgd2FzIGluIHRoZSBvcmlnaW5hbC5cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHBhcnRzWzFdID8gJ1xcXFxzKycgKyBwYXJ0c1sxXSA6ICcnLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBwYXJ0c1syXS5zcGxpdCgnLCcpLmpvaW4oJ1xcXFxzKixcXFxccyonKTtcblxuICAgICAgICAgICAgYm9keSA9IGVzY2FwZVJlZ0V4cChwYXJ0c1szXSkucmVwbGFjZSgvOyQvLCAnOz8nKTsgLy8gc2VtaWNvbG9uIGlzIGluc2VydGVkIGlmIHRoZSBmdW5jdGlvbiBlbmRzIHdpdGggYSBjb21tZW50LnJlcGxhY2UoL1xccysvZywgJ1xcXFxzKycpO1xuICAgICAgICAgICAgcmUgPSBuZXcgUmVnRXhwKCdmdW5jdGlvbicgKyBuYW1lICsgJ1xcXFxzKlxcXFwoXFxcXHMqJyArIGFyZ3MgKyAnXFxcXHMqXFxcXClcXFxccyp7XFxcXHMqJyArIGJvZHkgKyAnXFxcXHMqfScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbG9vayBmb3IgYSBub3JtYWwgZnVuY3Rpb24gZGVmaW5pdGlvblxuICAgICAgICBpZiAoKHJlc3VsdCA9IGZpbmRTb3VyY2VJblVybHMocmUsIHVybHMpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxvb2sgZm9yIGFuIG9sZC1zY2hvb2wgZXZlbnQgaGFuZGxlciBmdW5jdGlvblxuICAgICAgICBpZiAoKHBhcnRzID0gZXZlbnRSRS5leGVjKGNvZGUpKSkge1xuICAgICAgICAgICAgdmFyIGV2ZW50ID0gcGFydHNbMV07XG4gICAgICAgICAgICBib2R5ID0gZXNjYXBlQ29kZUFzUmVnRXhwRm9yTWF0Y2hpbmdJbnNpZGVIVE1MKHBhcnRzWzJdKTtcblxuICAgICAgICAgICAgLy8gbG9vayBmb3IgYSBmdW5jdGlvbiBkZWZpbmVkIGluIEhUTUwgYXMgYW4gb25YWFggaGFuZGxlclxuICAgICAgICAgICAgcmUgPSBuZXcgUmVnRXhwKCdvbicgKyBldmVudCArICc9W1xcXFxcXCdcIl1cXFxccyonICsgYm9keSArICdcXFxccypbXFxcXFxcJ1wiXScsICdpJyk7XG5cbiAgICAgICAgICAgIGlmICgocmVzdWx0ID0gZmluZFNvdXJjZUluVXJscyhyZSwgdXJsc1swXSkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gbG9vayBmb3IgPz8/XG4gICAgICAgICAgICByZSA9IG5ldyBSZWdFeHAoYm9keSk7XG5cbiAgICAgICAgICAgIGlmICgocmVzdWx0ID0gZmluZFNvdXJjZUluVXJscyhyZSwgdXJscykpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIENvbnRlbnRzIG9mIEV4Y2VwdGlvbiBpbiB2YXJpb3VzIGJyb3dzZXJzLlxuICAgIC8vXG4gICAgLy8gU0FGQVJJOlxuICAgIC8vIGV4Lm1lc3NhZ2UgPSBDYW4ndCBmaW5kIHZhcmlhYmxlOiBxcVxuICAgIC8vIGV4LmxpbmUgPSA1OVxuICAgIC8vIGV4LnNvdXJjZUlkID0gNTgwMjM4MTkyXG4gICAgLy8gZXguc291cmNlVVJMID0gaHR0cDovLy4uLlxuICAgIC8vIGV4LmV4cHJlc3Npb25CZWdpbk9mZnNldCA9IDk2XG4gICAgLy8gZXguZXhwcmVzc2lvbkNhcmV0T2Zmc2V0ID0gOThcbiAgICAvLyBleC5leHByZXNzaW9uRW5kT2Zmc2V0ID0gOThcbiAgICAvLyBleC5uYW1lID0gUmVmZXJlbmNlRXJyb3JcbiAgICAvL1xuICAgIC8vIEZJUkVGT1g6XG4gICAgLy8gZXgubWVzc2FnZSA9IHFxIGlzIG5vdCBkZWZpbmVkXG4gICAgLy8gZXguZmlsZU5hbWUgPSBodHRwOi8vLi4uXG4gICAgLy8gZXgubGluZU51bWJlciA9IDU5XG4gICAgLy8gZXguY29sdW1uTnVtYmVyID0gNjlcbiAgICAvLyBleC5zdGFjayA9IC4uLnN0YWNrIHRyYWNlLi4uIChzZWUgdGhlIGV4YW1wbGUgYmVsb3cpXG4gICAgLy8gZXgubmFtZSA9IFJlZmVyZW5jZUVycm9yXG4gICAgLy9cbiAgICAvLyBDSFJPTUU6XG4gICAgLy8gZXgubWVzc2FnZSA9IHFxIGlzIG5vdCBkZWZpbmVkXG4gICAgLy8gZXgubmFtZSA9IFJlZmVyZW5jZUVycm9yXG4gICAgLy8gZXgudHlwZSA9IG5vdF9kZWZpbmVkXG4gICAgLy8gZXguYXJndW1lbnRzID0gWydhYSddXG4gICAgLy8gZXguc3RhY2sgPSAuLi5zdGFjayB0cmFjZS4uLlxuICAgIC8vXG4gICAgLy8gSU5URVJORVQgRVhQTE9SRVI6XG4gICAgLy8gZXgubWVzc2FnZSA9IC4uLlxuICAgIC8vIGV4Lm5hbWUgPSBSZWZlcmVuY2VFcnJvclxuICAgIC8vXG4gICAgLy8gT1BFUkE6XG4gICAgLy8gZXgubWVzc2FnZSA9IC4uLm1lc3NhZ2UuLi4gKHNlZSB0aGUgZXhhbXBsZSBiZWxvdylcbiAgICAvLyBleC5uYW1lID0gUmVmZXJlbmNlRXJyb3JcbiAgICAvLyBleC5vcGVyYSNzb3VyY2Vsb2MgPSAxMSAgKHByZXR0eSBtdWNoIHVzZWxlc3MsIGR1cGxpY2F0ZXMgdGhlIGluZm8gaW4gZXgubWVzc2FnZSlcbiAgICAvLyBleC5zdGFja3RyYWNlID0gbi9hOyBzZWUgJ29wZXJhOmNvbmZpZyNVc2VyUHJlZnN8RXhjZXB0aW9ucyBIYXZlIFN0YWNrdHJhY2UnXG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlcyBzdGFjayB0cmFjZSBpbmZvcm1hdGlvbiBmcm9tIHRoZSBzdGFjayBwcm9wZXJ0eS5cbiAgICAgKiBDaHJvbWUgYW5kIEdlY2tvIHVzZSB0aGlzIHByb3BlcnR5LlxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGV4XG4gICAgICogQHJldHVybiB7P09iamVjdC48c3RyaW5nLCAqPn0gU3RhY2sgdHJhY2UgaW5mb3JtYXRpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gY29tcHV0ZVN0YWNrVHJhY2VGcm9tU3RhY2tQcm9wKGV4KSB7XG4gICAgICAgIGlmICghZXguc3RhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNocm9tZSA9IC9eXFxzKmF0ICg/OigoPzpcXFtvYmplY3Qgb2JqZWN0XFxdKT9cXFMrKD86IFxcW2FzIFxcUytcXF0pPykgKT9cXCg/KCg/OmZpbGV8aHR0cHM/fGNocm9tZS1leHRlbnNpb24pOi4qPyk6KFxcZCspKD86OihcXGQrKSk/XFwpP1xccyokL2ksXG4gICAgICAgICAgICBnZWNrbyA9IC9eXFxzKihcXFMqKSg/OlxcKCguKj8pXFwpKT9AKCg/OmZpbGV8aHR0cHM/fGNocm9tZSkuKj8pOihcXGQrKSg/OjooXFxkKykpP1xccyokL2ksXG4gICAgICAgICAgICBsaW5lcyA9IGV4LnN0YWNrLnNwbGl0KCdcXG4nKSxcbiAgICAgICAgICAgIHN0YWNrID0gW10sXG4gICAgICAgICAgICBwYXJ0cyxcbiAgICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgICByZWZlcmVuY2UgPSAvXiguKikgaXMgdW5kZWZpbmVkJC8uZXhlYyhleC5tZXNzYWdlKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGxpbmVzLmxlbmd0aDsgaSA8IGo7ICsraSkge1xuICAgICAgICAgICAgaWYgKChwYXJ0cyA9IGdlY2tvLmV4ZWMobGluZXNbaV0pKSkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgICd1cmwnOiBwYXJ0c1szXSxcbiAgICAgICAgICAgICAgICAgICAgJ2Z1bmMnOiBwYXJ0c1sxXSB8fCBVTktOT1dOX0ZVTkNUSU9OLFxuICAgICAgICAgICAgICAgICAgICAnYXJncyc6IHBhcnRzWzJdID8gcGFydHNbMl0uc3BsaXQoJywnKSA6ICcnLFxuICAgICAgICAgICAgICAgICAgICAnbGluZSc6ICtwYXJ0c1s0XSxcbiAgICAgICAgICAgICAgICAgICAgJ2NvbHVtbic6IHBhcnRzWzVdID8gK3BhcnRzWzVdIDogbnVsbFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChwYXJ0cyA9IGNocm9tZS5leGVjKGxpbmVzW2ldKSkpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0ge1xuICAgICAgICAgICAgICAgICAgICAndXJsJzogcGFydHNbMl0sXG4gICAgICAgICAgICAgICAgICAgICdmdW5jJzogcGFydHNbMV0gfHwgVU5LTk9XTl9GVU5DVElPTixcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUnOiArcGFydHNbM10sXG4gICAgICAgICAgICAgICAgICAgICdjb2x1bW4nOiBwYXJ0c1s0XSA/ICtwYXJ0c1s0XSA6IG51bGxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFlbGVtZW50LmZ1bmMgJiYgZWxlbWVudC5saW5lKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5mdW5jID0gZ3Vlc3NGdW5jdGlvbk5hbWUoZWxlbWVudC51cmwsIGVsZW1lbnQubGluZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlbGVtZW50LmxpbmUpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNvbnRleHQgPSBnYXRoZXJDb250ZXh0KGVsZW1lbnQudXJsLCBlbGVtZW50LmxpbmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGFjay5wdXNoKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YWNrWzBdLmxpbmUgJiYgIXN0YWNrWzBdLmNvbHVtbiAmJiByZWZlcmVuY2UpIHtcbiAgICAgICAgICAgIHN0YWNrWzBdLmNvbHVtbiA9IGZpbmRTb3VyY2VJbkxpbmUocmVmZXJlbmNlWzFdLCBzdGFja1swXS51cmwsIHN0YWNrWzBdLmxpbmUpO1xuICAgICAgICB9IGVsc2UgaWYgKCFzdGFja1swXS5jb2x1bW4gJiYgIWlzVW5kZWZpbmVkKGV4LmNvbHVtbk51bWJlcikpIHtcbiAgICAgICAgICAgIC8vIEZpcmVGb3ggdXNlcyB0aGlzIGF3ZXNvbWUgY29sdW1uTnVtYmVyIHByb3BlcnR5IGZvciBpdHMgdG9wIGZyYW1lXG4gICAgICAgICAgICAvLyBBbHNvIG5vdGUsIEZpcmVmb3gncyBjb2x1bW4gbnVtYmVyIGlzIDAtYmFzZWQgYW5kIGV2ZXJ5dGhpbmcgZWxzZSBleHBlY3RzIDEtYmFzZWQsXG4gICAgICAgICAgICAvLyBzbyBhZGRpbmcgMVxuICAgICAgICAgICAgc3RhY2tbMF0uY29sdW1uID0gZXguY29sdW1uTnVtYmVyICsgMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnbmFtZSc6IGV4Lm5hbWUsXG4gICAgICAgICAgICAnbWVzc2FnZSc6IGV4Lm1lc3NhZ2UsXG4gICAgICAgICAgICAndXJsJzogZG9jdW1lbnQubG9jYXRpb24uaHJlZixcbiAgICAgICAgICAgICdzdGFjayc6IHN0YWNrXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgc3RhY2sgdHJhY2UgaW5mb3JtYXRpb24gZnJvbSB0aGUgc3RhY2t0cmFjZSBwcm9wZXJ0eS5cbiAgICAgKiBPcGVyYSAxMCB1c2VzIHRoaXMgcHJvcGVydHkuXG4gICAgICogQHBhcmFtIHtFcnJvcn0gZXhcbiAgICAgKiBAcmV0dXJuIHs/T2JqZWN0LjxzdHJpbmcsICo+fSBTdGFjayB0cmFjZSBpbmZvcm1hdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb21wdXRlU3RhY2tUcmFjZUZyb21TdGFja3RyYWNlUHJvcChleCkge1xuICAgICAgICAvLyBBY2Nlc3MgYW5kIHN0b3JlIHRoZSBzdGFja3RyYWNlIHByb3BlcnR5IGJlZm9yZSBkb2luZyBBTllUSElOR1xuICAgICAgICAvLyBlbHNlIHRvIGl0IGJlY2F1c2UgT3BlcmEgaXMgbm90IHZlcnkgZ29vZCBhdCBwcm92aWRpbmcgaXRcbiAgICAgICAgLy8gcmVsaWFibHkgaW4gb3RoZXIgY2lyY3Vtc3RhbmNlcy5cbiAgICAgICAgdmFyIHN0YWNrdHJhY2UgPSBleC5zdGFja3RyYWNlO1xuXG4gICAgICAgIHZhciB0ZXN0UkUgPSAvIGxpbmUgKFxcZCspLCBjb2x1bW4gKFxcZCspIGluICg/Ojxhbm9ueW1vdXMgZnVuY3Rpb246IChbXj5dKyk+fChbXlxcKV0rKSlcXCgoLiopXFwpIGluICguKik6XFxzKiQvaSxcbiAgICAgICAgICAgIGxpbmVzID0gc3RhY2t0cmFjZS5zcGxpdCgnXFxuJyksXG4gICAgICAgICAgICBzdGFjayA9IFtdLFxuICAgICAgICAgICAgcGFydHM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBsaW5lcy5sZW5ndGg7IGkgPCBqOyBpICs9IDIpIHtcbiAgICAgICAgICAgIGlmICgocGFydHMgPSB0ZXN0UkUuZXhlYyhsaW5lc1tpXSkpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB7XG4gICAgICAgICAgICAgICAgICAgICdsaW5lJzogK3BhcnRzWzFdLFxuICAgICAgICAgICAgICAgICAgICAnY29sdW1uJzogK3BhcnRzWzJdLFxuICAgICAgICAgICAgICAgICAgICAnZnVuYyc6IHBhcnRzWzNdIHx8IHBhcnRzWzRdLFxuICAgICAgICAgICAgICAgICAgICAnYXJncyc6IHBhcnRzWzVdID8gcGFydHNbNV0uc3BsaXQoJywnKSA6IFtdLFxuICAgICAgICAgICAgICAgICAgICAndXJsJzogcGFydHNbNl1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKCFlbGVtZW50LmZ1bmMgJiYgZWxlbWVudC5saW5lKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZnVuYyA9IGd1ZXNzRnVuY3Rpb25OYW1lKGVsZW1lbnQudXJsLCBlbGVtZW50LmxpbmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5saW5lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNvbnRleHQgPSBnYXRoZXJDb250ZXh0KGVsZW1lbnQudXJsLCBlbGVtZW50LmxpbmUpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGMpIHt9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFlbGVtZW50LmNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jb250ZXh0ID0gW2xpbmVzW2kgKyAxXV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnbmFtZSc6IGV4Lm5hbWUsXG4gICAgICAgICAgICAnbWVzc2FnZSc6IGV4Lm1lc3NhZ2UsXG4gICAgICAgICAgICAndXJsJzogZG9jdW1lbnQubG9jYXRpb24uaHJlZixcbiAgICAgICAgICAgICdzdGFjayc6IHN0YWNrXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTk9UIFRFU1RFRC5cbiAgICAgKiBDb21wdXRlcyBzdGFjayB0cmFjZSBpbmZvcm1hdGlvbiBmcm9tIGFuIGVycm9yIG1lc3NhZ2UgdGhhdCBpbmNsdWRlc1xuICAgICAqIHRoZSBzdGFjayB0cmFjZS5cbiAgICAgKiBPcGVyYSA5IGFuZCBlYXJsaWVyIHVzZSB0aGlzIG1ldGhvZCBpZiB0aGUgb3B0aW9uIHRvIHNob3cgc3RhY2tcbiAgICAgKiB0cmFjZXMgaXMgdHVybmVkIG9uIGluIG9wZXJhOmNvbmZpZy5cbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBleFxuICAgICAqIEByZXR1cm4gez9PYmplY3QuPHN0cmluZywgKj59IFN0YWNrIGluZm9ybWF0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbXB1dGVTdGFja1RyYWNlRnJvbU9wZXJhTXVsdGlMaW5lTWVzc2FnZShleCkge1xuICAgICAgICAvLyBPcGVyYSBpbmNsdWRlcyBhIHN0YWNrIHRyYWNlIGludG8gdGhlIGV4Y2VwdGlvbiBtZXNzYWdlLiBBbiBleGFtcGxlIGlzOlxuICAgICAgICAvL1xuICAgICAgICAvLyBTdGF0ZW1lbnQgb24gbGluZSAzOiBVbmRlZmluZWQgdmFyaWFibGU6IHVuZGVmaW5lZEZ1bmNcbiAgICAgICAgLy8gQmFja3RyYWNlOlxuICAgICAgICAvLyAgIExpbmUgMyBvZiBsaW5rZWQgc2NyaXB0IGZpbGU6Ly9sb2NhbGhvc3QvVXNlcnMvYW5kcmV5dml0L1Byb2plY3RzL1RyYWNlS2l0L2phdmFzY3JpcHQtY2xpZW50L3NhbXBsZS5qczogSW4gZnVuY3Rpb24genp6XG4gICAgICAgIC8vICAgICAgICAgdW5kZWZpbmVkRnVuYyhhKTtcbiAgICAgICAgLy8gICBMaW5lIDcgb2YgaW5saW5lIzEgc2NyaXB0IGluIGZpbGU6Ly9sb2NhbGhvc3QvVXNlcnMvYW5kcmV5dml0L1Byb2plY3RzL1RyYWNlS2l0L2phdmFzY3JpcHQtY2xpZW50L3NhbXBsZS5odG1sOiBJbiBmdW5jdGlvbiB5eXlcbiAgICAgICAgLy8gICAgICAgICAgIHp6eih4LCB5LCB6KTtcbiAgICAgICAgLy8gICBMaW5lIDMgb2YgaW5saW5lIzEgc2NyaXB0IGluIGZpbGU6Ly9sb2NhbGhvc3QvVXNlcnMvYW5kcmV5dml0L1Byb2plY3RzL1RyYWNlS2l0L2phdmFzY3JpcHQtY2xpZW50L3NhbXBsZS5odG1sOiBJbiBmdW5jdGlvbiB4eHhcbiAgICAgICAgLy8gICAgICAgICAgIHl5eShhLCBhLCBhKTtcbiAgICAgICAgLy8gICBMaW5lIDEgb2YgZnVuY3Rpb24gc2NyaXB0XG4gICAgICAgIC8vICAgICB0cnkgeyB4eHgoJ2hpJyk7IHJldHVybiBmYWxzZTsgfSBjYXRjaChleCkgeyBUcmFjZUtpdC5yZXBvcnQoZXgpOyB9XG4gICAgICAgIC8vICAgLi4uXG5cbiAgICAgICAgdmFyIGxpbmVzID0gZXgubWVzc2FnZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggPCA0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsaW5lUkUxID0gL15cXHMqTGluZSAoXFxkKykgb2YgbGlua2VkIHNjcmlwdCAoKD86ZmlsZXxodHRwcz8pXFxTKykoPzo6IGluIGZ1bmN0aW9uIChcXFMrKSk/XFxzKiQvaSxcbiAgICAgICAgICAgIGxpbmVSRTIgPSAvXlxccypMaW5lIChcXGQrKSBvZiBpbmxpbmUjKFxcZCspIHNjcmlwdCBpbiAoKD86ZmlsZXxodHRwcz8pXFxTKykoPzo6IGluIGZ1bmN0aW9uIChcXFMrKSk/XFxzKiQvaSxcbiAgICAgICAgICAgIGxpbmVSRTMgPSAvXlxccypMaW5lIChcXGQrKSBvZiBmdW5jdGlvbiBzY3JpcHRcXHMqJC9pLFxuICAgICAgICAgICAgc3RhY2sgPSBbXSxcbiAgICAgICAgICAgIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JyksXG4gICAgICAgICAgICBpbmxpbmVTY3JpcHRCbG9ja3MgPSBbXSxcbiAgICAgICAgICAgIHBhcnRzLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIGxlbixcbiAgICAgICAgICAgIHNvdXJjZTtcblxuICAgICAgICBmb3IgKGkgaW4gc2NyaXB0cykge1xuICAgICAgICAgICAgaWYgKGhhc0tleShzY3JpcHRzLCBpKSAmJiAhc2NyaXB0c1tpXS5zcmMpIHtcbiAgICAgICAgICAgICAgICBpbmxpbmVTY3JpcHRCbG9ja3MucHVzaChzY3JpcHRzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDIsIGxlbiA9IGxpbmVzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IG51bGw7XG4gICAgICAgICAgICBpZiAoKHBhcnRzID0gbGluZVJFMS5leGVjKGxpbmVzW2ldKSkpIHtcbiAgICAgICAgICAgICAgICBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICAndXJsJzogcGFydHNbMl0sXG4gICAgICAgICAgICAgICAgICAgICdmdW5jJzogcGFydHNbM10sXG4gICAgICAgICAgICAgICAgICAgICdsaW5lJzogK3BhcnRzWzFdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKHBhcnRzID0gbGluZVJFMi5leGVjKGxpbmVzW2ldKSkpIHtcbiAgICAgICAgICAgICAgICBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICAndXJsJzogcGFydHNbM10sXG4gICAgICAgICAgICAgICAgICAgICdmdW5jJzogcGFydHNbNF1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciByZWxhdGl2ZUxpbmUgPSAoK3BhcnRzWzFdKTsgLy8gcmVsYXRpdmUgdG8gdGhlIHN0YXJ0IG9mIHRoZSA8U0NSSVBUPiBibG9ja1xuICAgICAgICAgICAgICAgIHZhciBzY3JpcHQgPSBpbmxpbmVTY3JpcHRCbG9ja3NbcGFydHNbMl0gLSAxXTtcbiAgICAgICAgICAgICAgICBpZiAoc2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IGdldFNvdXJjZShpdGVtLnVybCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5qb2luKCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwb3MgPSBzb3VyY2UuaW5kZXhPZihzY3JpcHQuaW5uZXJUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwb3MgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0ubGluZSA9IHJlbGF0aXZlTGluZSArIHNvdXJjZS5zdWJzdHJpbmcoMCwgcG9zKS5zcGxpdCgnXFxuJykubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICgocGFydHMgPSBsaW5lUkUzLmV4ZWMobGluZXNbaV0pKSkge1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC8jLiokLywgJycpLFxuICAgICAgICAgICAgICAgICAgICBsaW5lID0gcGFydHNbMV07XG4gICAgICAgICAgICAgICAgdmFyIHJlID0gbmV3IFJlZ0V4cChlc2NhcGVDb2RlQXNSZWdFeHBGb3JNYXRjaGluZ0luc2lkZUhUTUwobGluZXNbaSArIDFdKSk7XG4gICAgICAgICAgICAgICAgc291cmNlID0gZmluZFNvdXJjZUluVXJscyhyZSwgW3VybF0pO1xuICAgICAgICAgICAgICAgIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgICd1cmwnOiB1cmwsXG4gICAgICAgICAgICAgICAgICAgICdsaW5lJzogc291cmNlID8gc291cmNlLmxpbmUgOiBsaW5lLFxuICAgICAgICAgICAgICAgICAgICAnZnVuYyc6ICcnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uZnVuYykge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmZ1bmMgPSBndWVzc0Z1bmN0aW9uTmFtZShpdGVtLnVybCwgaXRlbS5saW5lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBnYXRoZXJDb250ZXh0KGl0ZW0udXJsLCBpdGVtLmxpbmUpO1xuICAgICAgICAgICAgICAgIHZhciBtaWRsaW5lID0gKGNvbnRleHQgPyBjb250ZXh0W01hdGguZmxvb3IoY29udGV4dC5sZW5ndGggLyAyKV0gOiBudWxsKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dCAmJiBtaWRsaW5lLnJlcGxhY2UoL15cXHMqLywgJycpID09PSBsaW5lc1tpICsgMV0ucmVwbGFjZSgvXlxccyovLCAnJykpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoY29udGV4dCkgYWxlcnQoXCJDb250ZXh0IG1pc21hdGNoLiBDb3JyZWN0IG1pZGxpbmU6XFxuXCIgKyBsaW5lc1tpKzFdICsgXCJcXG5cXG5NaWRsaW5lOlxcblwiICsgbWlkbGluZSArIFwiXFxuXFxuQ29udGV4dDpcXG5cIiArIGNvbnRleHQuam9pbihcIlxcblwiKSArIFwiXFxuXFxuVVJMOlxcblwiICsgaXRlbS51cmwpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbnRleHQgPSBbbGluZXNbaSArIDFdXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIGNvdWxkIG5vdCBwYXJzZSBtdWx0aWxpbmUgZXhjZXB0aW9uIG1lc3NhZ2UgYXMgT3BlcmEgc3RhY2sgdHJhY2VcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnbmFtZSc6IGV4Lm5hbWUsXG4gICAgICAgICAgICAnbWVzc2FnZSc6IGxpbmVzWzBdLFxuICAgICAgICAgICAgJ3VybCc6IGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICAnc3RhY2snOiBzdGFja1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGZpcnN0IGZyYW1lIHRvIGluY29tcGxldGUgc3RhY2sgdHJhY2VzLlxuICAgICAqIFNhZmFyaSBhbmQgSUUgcmVxdWlyZSB0aGlzIHRvIGdldCBjb21wbGV0ZSBkYXRhIG9uIHRoZSBmaXJzdCBmcmFtZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdC48c3RyaW5nLCAqPn0gc3RhY2tJbmZvIFN0YWNrIHRyYWNlIGluZm9ybWF0aW9uIGZyb21cbiAgICAgKiBvbmUgb2YgdGhlIGNvbXB1dGUqIG1ldGhvZHMuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBUaGUgVVJMIG9mIHRoZSBzY3JpcHQgdGhhdCBjYXVzZWQgYW4gZXJyb3IuXG4gICAgICogQHBhcmFtIHsobnVtYmVyfHN0cmluZyl9IGxpbmVObyBUaGUgbGluZSBudW1iZXIgb2YgdGhlIHNjcmlwdCB0aGF0XG4gICAgICogY2F1c2VkIGFuIGVycm9yLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nPX0gbWVzc2FnZSBUaGUgZXJyb3IgZ2VuZXJhdGVkIGJ5IHRoZSBicm93c2VyLCB3aGljaFxuICAgICAqIGhvcGVmdWxseSBjb250YWlucyB0aGUgbmFtZSBvZiB0aGUgb2JqZWN0IHRoYXQgY2F1c2VkIHRoZSBlcnJvci5cbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG9yIG5vdCB0aGUgc3RhY2sgaW5mb3JtYXRpb24gd2FzXG4gICAgICogYXVnbWVudGVkLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGF1Z21lbnRTdGFja1RyYWNlV2l0aEluaXRpYWxFbGVtZW50KHN0YWNrSW5mbywgdXJsLCBsaW5lTm8sIG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIGluaXRpYWwgPSB7XG4gICAgICAgICAgICAndXJsJzogdXJsLFxuICAgICAgICAgICAgJ2xpbmUnOiBsaW5lTm9cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoaW5pdGlhbC51cmwgJiYgaW5pdGlhbC5saW5lKSB7XG4gICAgICAgICAgICBzdGFja0luZm8uaW5jb21wbGV0ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoIWluaXRpYWwuZnVuYykge1xuICAgICAgICAgICAgICAgIGluaXRpYWwuZnVuYyA9IGd1ZXNzRnVuY3Rpb25OYW1lKGluaXRpYWwudXJsLCBpbml0aWFsLmxpbmUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWluaXRpYWwuY29udGV4dCkge1xuICAgICAgICAgICAgICAgIGluaXRpYWwuY29udGV4dCA9IGdhdGhlckNvbnRleHQoaW5pdGlhbC51cmwsIGluaXRpYWwubGluZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZWZlcmVuY2UgPSAvICcoW14nXSspJyAvLmV4ZWMobWVzc2FnZSk7XG4gICAgICAgICAgICBpZiAocmVmZXJlbmNlKSB7XG4gICAgICAgICAgICAgICAgaW5pdGlhbC5jb2x1bW4gPSBmaW5kU291cmNlSW5MaW5lKHJlZmVyZW5jZVsxXSwgaW5pdGlhbC51cmwsIGluaXRpYWwubGluZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdGFja0luZm8uc3RhY2subGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGlmIChzdGFja0luZm8uc3RhY2tbMF0udXJsID09PSBpbml0aWFsLnVybCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhY2tJbmZvLnN0YWNrWzBdLmxpbmUgPT09IGluaXRpYWwubGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBhbHJlYWR5IGluIHN0YWNrIHRyYWNlXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXN0YWNrSW5mby5zdGFja1swXS5saW5lICYmIHN0YWNrSW5mby5zdGFja1swXS5mdW5jID09PSBpbml0aWFsLmZ1bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrSW5mby5zdGFja1swXS5saW5lID0gaW5pdGlhbC5saW5lO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tJbmZvLnN0YWNrWzBdLmNvbnRleHQgPSBpbml0aWFsLmNvbnRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YWNrSW5mby5zdGFjay51bnNoaWZ0KGluaXRpYWwpO1xuICAgICAgICAgICAgc3RhY2tJbmZvLnBhcnRpYWwgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGFja0luZm8uaW5jb21wbGV0ZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgc3RhY2sgdHJhY2UgaW5mb3JtYXRpb24gYnkgd2Fsa2luZyB0aGUgYXJndW1lbnRzLmNhbGxlclxuICAgICAqIGNoYWluIGF0IHRoZSB0aW1lIHRoZSBleGNlcHRpb24gb2NjdXJyZWQuIFRoaXMgd2lsbCBjYXVzZSBlYXJsaWVyXG4gICAgICogZnJhbWVzIHRvIGJlIG1pc3NlZCBidXQgaXMgdGhlIG9ubHkgd2F5IHRvIGdldCBhbnkgc3RhY2sgdHJhY2UgaW5cbiAgICAgKiBTYWZhcmkgYW5kIElFLiBUaGUgdG9wIGZyYW1lIGlzIHJlc3RvcmVkIGJ5XG4gICAgICoge0BsaW5rIGF1Z21lbnRTdGFja1RyYWNlV2l0aEluaXRpYWxFbGVtZW50fS5cbiAgICAgKiBAcGFyYW0ge0Vycm9yfSBleFxuICAgICAqIEByZXR1cm4gez9PYmplY3QuPHN0cmluZywgKj59IFN0YWNrIHRyYWNlIGluZm9ybWF0aW9uLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbXB1dGVTdGFja1RyYWNlQnlXYWxraW5nQ2FsbGVyQ2hhaW4oZXgsIGRlcHRoKSB7XG4gICAgICAgIHZhciBmdW5jdGlvbk5hbWUgPSAvZnVuY3Rpb25cXHMrKFtfJGEtekEtWlxceEEwLVxcdUZGRkZdW18kYS16QS1aMC05XFx4QTAtXFx1RkZGRl0qKT9cXHMqXFwoL2ksXG4gICAgICAgICAgICBzdGFjayA9IFtdLFxuICAgICAgICAgICAgZnVuY3MgPSB7fSxcbiAgICAgICAgICAgIHJlY3Vyc2lvbiA9IGZhbHNlLFxuICAgICAgICAgICAgcGFydHMsXG4gICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgc291cmNlO1xuXG4gICAgICAgIGZvciAodmFyIGN1cnIgPSBjb21wdXRlU3RhY2tUcmFjZUJ5V2Fsa2luZ0NhbGxlckNoYWluLmNhbGxlcjsgY3VyciAmJiAhcmVjdXJzaW9uOyBjdXJyID0gY3Vyci5jYWxsZXIpIHtcbiAgICAgICAgICAgIGlmIChjdXJyID09PSBjb21wdXRlU3RhY2tUcmFjZSB8fCBjdXJyID09PSBUcmFjZUtpdC5yZXBvcnQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc2tpcHBpbmcgaW50ZXJuYWwgZnVuY3Rpb24nKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXRlbSA9IHtcbiAgICAgICAgICAgICAgICAndXJsJzogbnVsbCxcbiAgICAgICAgICAgICAgICAnZnVuYyc6IFVOS05PV05fRlVOQ1RJT04sXG4gICAgICAgICAgICAgICAgJ2xpbmUnOiBudWxsLFxuICAgICAgICAgICAgICAgICdjb2x1bW4nOiBudWxsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoY3Vyci5uYW1lKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5mdW5jID0gY3Vyci5uYW1lO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgocGFydHMgPSBmdW5jdGlvbk5hbWUuZXhlYyhjdXJyLnRvU3RyaW5nKCkpKSkge1xuICAgICAgICAgICAgICAgIGl0ZW0uZnVuYyA9IHBhcnRzWzFdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9IGZpbmRTb3VyY2VCeUZ1bmN0aW9uQm9keShjdXJyKSkpIHtcbiAgICAgICAgICAgICAgICBpdGVtLnVybCA9IHNvdXJjZS51cmw7XG4gICAgICAgICAgICAgICAgaXRlbS5saW5lID0gc291cmNlLmxpbmU7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5mdW5jID09PSBVTktOT1dOX0ZVTkNUSU9OKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZnVuYyA9IGd1ZXNzRnVuY3Rpb25OYW1lKGl0ZW0udXJsLCBpdGVtLmxpbmUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciByZWZlcmVuY2UgPSAvICcoW14nXSspJyAvLmV4ZWMoZXgubWVzc2FnZSB8fCBleC5kZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKHJlZmVyZW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbHVtbiA9IGZpbmRTb3VyY2VJbkxpbmUocmVmZXJlbmNlWzFdLCBzb3VyY2UudXJsLCBzb3VyY2UubGluZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZnVuY3NbJycgKyBjdXJyXSkge1xuICAgICAgICAgICAgICAgIHJlY3Vyc2lvbiA9IHRydWU7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBmdW5jc1snJyArIGN1cnJdID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhY2sucHVzaChpdGVtKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkZXB0aCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2RlcHRoIGlzICcgKyBkZXB0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc3RhY2sgaXMgJyArIHN0YWNrLmxlbmd0aCk7XG4gICAgICAgICAgICBzdGFjay5zcGxpY2UoMCwgZGVwdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICduYW1lJzogZXgubmFtZSxcbiAgICAgICAgICAgICdtZXNzYWdlJzogZXgubWVzc2FnZSxcbiAgICAgICAgICAgICd1cmwnOiBkb2N1bWVudC5sb2NhdGlvbi5ocmVmLFxuICAgICAgICAgICAgJ3N0YWNrJzogc3RhY2tcbiAgICAgICAgfTtcbiAgICAgICAgYXVnbWVudFN0YWNrVHJhY2VXaXRoSW5pdGlhbEVsZW1lbnQocmVzdWx0LCBleC5zb3VyY2VVUkwgfHwgZXguZmlsZU5hbWUsIGV4LmxpbmUgfHwgZXgubGluZU51bWJlciwgZXgubWVzc2FnZSB8fCBleC5kZXNjcmlwdGlvbik7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgYSBzdGFjayB0cmFjZSBmb3IgYW4gZXhjZXB0aW9uLlxuICAgICAqIEBwYXJhbSB7RXJyb3J9IGV4XG4gICAgICogQHBhcmFtIHsoc3RyaW5nfG51bWJlcik9fSBkZXB0aFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGNvbXB1dGVTdGFja1RyYWNlKGV4LCBkZXB0aCkge1xuICAgICAgICB2YXIgc3RhY2sgPSBudWxsO1xuICAgICAgICBkZXB0aCA9IChkZXB0aCA9PSBudWxsID8gMCA6ICtkZXB0aCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFRoaXMgbXVzdCBiZSB0cmllZCBmaXJzdCBiZWNhdXNlIE9wZXJhIDEwICpkZXN0cm95cypcbiAgICAgICAgICAgIC8vIGl0cyBzdGFja3RyYWNlIHByb3BlcnR5IGlmIHlvdSB0cnkgdG8gYWNjZXNzIHRoZSBzdGFja1xuICAgICAgICAgICAgLy8gcHJvcGVydHkgZmlyc3QhIVxuICAgICAgICAgICAgc3RhY2sgPSBjb21wdXRlU3RhY2tUcmFjZUZyb21TdGFja3RyYWNlUHJvcChleCk7XG4gICAgICAgICAgICBpZiAoc3RhY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChkZWJ1Zykge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhY2sgPSBjb21wdXRlU3RhY2tUcmFjZUZyb21TdGFja1Byb3AoZXgpO1xuICAgICAgICAgICAgaWYgKHN0YWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YWNrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZGVidWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YWNrID0gY29tcHV0ZVN0YWNrVHJhY2VGcm9tT3BlcmFNdWx0aUxpbmVNZXNzYWdlKGV4KTtcbiAgICAgICAgICAgIGlmIChzdGFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGFjaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGRlYnVnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGFjayA9IGNvbXB1dGVTdGFja1RyYWNlQnlXYWxraW5nQ2FsbGVyQ2hhaW4oZXgsIGRlcHRoICsgMSk7XG4gICAgICAgICAgICBpZiAoc3RhY2spIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChkZWJ1Zykge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge307XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9ncyBhIHN0YWNrdHJhY2Ugc3RhcnRpbmcgZnJvbSB0aGUgcHJldmlvdXMgY2FsbCBhbmQgd29ya2luZyBkb3duLlxuICAgICAqIEBwYXJhbSB7KG51bWJlcnxzdHJpbmcpPX0gZGVwdGggSG93IG1hbnkgZnJhbWVzIGRlZXAgdG8gdHJhY2UuXG4gICAgICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmcsICo+fSBTdGFjayB0cmFjZSBpbmZvcm1hdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb21wdXRlU3RhY2tUcmFjZU9mQ2FsbGVyKGRlcHRoKSB7XG4gICAgICAgIGRlcHRoID0gKGRlcHRoID09IG51bGwgPyAwIDogK2RlcHRoKSArIDE7IC8vIFwiKyAxXCIgYmVjYXVzZSBcIm9mQ2FsbGVyXCIgc2hvdWxkIGRyb3Agb25lIGZyYW1lXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb21wdXRlU3RhY2tUcmFjZShleCwgZGVwdGggKyAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXB1dGVTdGFja1RyYWNlLmF1Z21lbnRTdGFja1RyYWNlV2l0aEluaXRpYWxFbGVtZW50ID0gYXVnbWVudFN0YWNrVHJhY2VXaXRoSW5pdGlhbEVsZW1lbnQ7XG4gICAgY29tcHV0ZVN0YWNrVHJhY2UuZ3Vlc3NGdW5jdGlvbk5hbWUgPSBndWVzc0Z1bmN0aW9uTmFtZTtcbiAgICBjb21wdXRlU3RhY2tUcmFjZS5nYXRoZXJDb250ZXh0ID0gZ2F0aGVyQ29udGV4dDtcbiAgICBjb21wdXRlU3RhY2tUcmFjZS5vZkNhbGxlciA9IGNvbXB1dGVTdGFja1RyYWNlT2ZDYWxsZXI7XG5cbiAgICByZXR1cm4gY29tcHV0ZVN0YWNrVHJhY2U7XG59KCkpO1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIEZpcnN0LCBjaGVjayBmb3IgSlNPTiBzdXBwb3J0XG4vLyBJZiB0aGVyZSBpcyBubyBKU09OLCB3ZSBuby1vcCB0aGUgY29yZSBmZWF0dXJlcyBvZiBSYXZlblxuLy8gc2luY2UgSlNPTiBpcyByZXF1aXJlZCB0byBlbmNvZGUgdGhlIHBheWxvYWRcbnZhciBfUmF2ZW4gPSB3aW5kb3cuUmF2ZW4sXG4gICAgaGFzSlNPTiA9ICEhKHdpbmRvdy5KU09OICYmIHdpbmRvdy5KU09OLnN0cmluZ2lmeSksXG4gICAgbGFzdENhcHR1cmVkRXhjZXB0aW9uLFxuICAgIGxhc3RFdmVudElkLFxuICAgIGdsb2JhbFNlcnZlcixcbiAgICBnbG9iYWxVc2VyLFxuICAgIGdsb2JhbEtleSxcbiAgICBnbG9iYWxQcm9qZWN0LFxuICAgIGdsb2JhbE9wdGlvbnMgPSB7XG4gICAgICAgIGxvZ2dlcjogJ2phdmFzY3JpcHQnLFxuICAgICAgICBpZ25vcmVFcnJvcnM6IFtdLFxuICAgICAgICBpZ25vcmVVcmxzOiBbXSxcbiAgICAgICAgd2hpdGVsaXN0VXJsczogW10sXG4gICAgICAgIGluY2x1ZGVQYXRoczogW10sXG4gICAgICAgIGNvbGxlY3RXaW5kb3dFcnJvcnM6IHRydWUsXG4gICAgICAgIHRhZ3M6IHt9LFxuICAgICAgICBleHRyYToge31cbiAgICB9LFxuICAgIGF1dGhRdWVyeVN0cmluZyxcbiAgICBpc1JhdmVuSW5zdGFsbGVkID0gZmFsc2U7XG5cbi8qXG4gKiBUaGUgY29yZSBSYXZlbiBzaW5nbGV0b25cbiAqXG4gKiBAdGhpcyB7UmF2ZW59XG4gKi9cbnZhciBSYXZlbiA9IHtcbiAgICBWRVJTSU9OOiAnMS4xLjE2JyxcblxuICAgIGRlYnVnOiB0cnVlLFxuXG4gICAgLypcbiAgICAgKiBBbGxvdyBtdWx0aXBsZSB2ZXJzaW9ucyBvZiBSYXZlbiB0byBiZSBpbnN0YWxsZWQuXG4gICAgICogU3RyaXAgUmF2ZW4gZnJvbSB0aGUgZ2xvYmFsIGNvbnRleHQgYW5kIHJldHVybnMgdGhlIGluc3RhbmNlLlxuICAgICAqXG4gICAgICogQHJldHVybiB7UmF2ZW59XG4gICAgICovXG4gICAgbm9Db25mbGljdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5SYXZlbiA9IF9SYXZlbjtcbiAgICAgICAgcmV0dXJuIFJhdmVuO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIENvbmZpZ3VyZSBSYXZlbiB3aXRoIGEgRFNOIGFuZCBleHRyYSBvcHRpb25zXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZHNuIFRoZSBwdWJsaWMgU2VudHJ5IERTTlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIE9wdGlvbmFsIHNldCBvZiBvZiBnbG9iYWwgb3B0aW9ucyBbb3B0aW9uYWxdXG4gICAgICogQHJldHVybiB7UmF2ZW59XG4gICAgICovXG4gICAgY29uZmlnOiBmdW5jdGlvbihkc24sIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKGdsb2JhbFNlcnZlcikge1xuICAgICAgICAgICAgbG9nRGVidWcoJ2Vycm9yJywgJ0Vycm9yOiBSYXZlbiBoYXMgYWxyZWFkeSBiZWVuIGNvbmZpZ3VyZWQnKTtcbiAgICAgICAgICAgIHJldHVybiBSYXZlbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRzbikgcmV0dXJuIFJhdmVuO1xuXG4gICAgICAgIHZhciB1cmkgPSBwYXJzZURTTihkc24pLFxuICAgICAgICAgICAgbGFzdFNsYXNoID0gdXJpLnBhdGgubGFzdEluZGV4T2YoJy8nKSxcbiAgICAgICAgICAgIHBhdGggPSB1cmkucGF0aC5zdWJzdHIoMSwgbGFzdFNsYXNoKTtcblxuICAgICAgICAvLyBtZXJnZSBpbiBvcHRpb25zXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICBlYWNoKG9wdGlvbnMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpe1xuICAgICAgICAgICAgICAgIGdsb2JhbE9wdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBcIlNjcmlwdCBlcnJvci5cIiBpcyBoYXJkIGNvZGVkIGludG8gYnJvd3NlcnMgZm9yIGVycm9ycyB0aGF0IGl0IGNhbid0IHJlYWQuXG4gICAgICAgIC8vIHRoaXMgaXMgdGhlIHJlc3VsdCBvZiBhIHNjcmlwdCBiZWluZyBwdWxsZWQgaW4gZnJvbSBhbiBleHRlcm5hbCBkb21haW4gYW5kIENPUlMuXG4gICAgICAgIGdsb2JhbE9wdGlvbnMuaWdub3JlRXJyb3JzLnB1c2goJ1NjcmlwdCBlcnJvci4nKTtcbiAgICAgICAgZ2xvYmFsT3B0aW9ucy5pZ25vcmVFcnJvcnMucHVzaCgnU2NyaXB0IGVycm9yJyk7XG5cbiAgICAgICAgLy8gT3RoZXIgdmFyaWFudHMgb2YgZXh0ZXJuYWwgc2NyaXB0IGVycm9yczpcbiAgICAgICAgZ2xvYmFsT3B0aW9ucy5pZ25vcmVFcnJvcnMucHVzaCgnSmF2YXNjcmlwdCBlcnJvcjogU2NyaXB0IGVycm9yIG9uIGxpbmUgMCcpO1xuICAgICAgICBnbG9iYWxPcHRpb25zLmlnbm9yZUVycm9ycy5wdXNoKCdKYXZhc2NyaXB0IGVycm9yOiBTY3JpcHQgZXJyb3IuIG9uIGxpbmUgMCcpO1xuXG4gICAgICAgIC8vIGpvaW4gcmVnZXhwIHJ1bGVzIGludG8gb25lIGJpZyBydWxlXG4gICAgICAgIGdsb2JhbE9wdGlvbnMuaWdub3JlRXJyb3JzID0gam9pblJlZ0V4cChnbG9iYWxPcHRpb25zLmlnbm9yZUVycm9ycyk7XG4gICAgICAgIGdsb2JhbE9wdGlvbnMuaWdub3JlVXJscyA9IGdsb2JhbE9wdGlvbnMuaWdub3JlVXJscy5sZW5ndGggPyBqb2luUmVnRXhwKGdsb2JhbE9wdGlvbnMuaWdub3JlVXJscykgOiBmYWxzZTtcbiAgICAgICAgZ2xvYmFsT3B0aW9ucy53aGl0ZWxpc3RVcmxzID0gZ2xvYmFsT3B0aW9ucy53aGl0ZWxpc3RVcmxzLmxlbmd0aCA/IGpvaW5SZWdFeHAoZ2xvYmFsT3B0aW9ucy53aGl0ZWxpc3RVcmxzKSA6IGZhbHNlO1xuICAgICAgICBnbG9iYWxPcHRpb25zLmluY2x1ZGVQYXRocyA9IGpvaW5SZWdFeHAoZ2xvYmFsT3B0aW9ucy5pbmNsdWRlUGF0aHMpO1xuXG4gICAgICAgIGdsb2JhbEtleSA9IHVyaS51c2VyO1xuICAgICAgICBnbG9iYWxQcm9qZWN0ID0gdXJpLnBhdGguc3Vic3RyKGxhc3RTbGFzaCArIDEpO1xuXG4gICAgICAgIC8vIGFzc2VtYmxlIHRoZSBlbmRwb2ludCBmcm9tIHRoZSB1cmkgcGllY2VzXG4gICAgICAgIGdsb2JhbFNlcnZlciA9ICcvLycgKyB1cmkuaG9zdCArXG4gICAgICAgICAgICAgICAgICAgICAgKHVyaS5wb3J0ID8gJzonICsgdXJpLnBvcnQgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAgICcvJyArIHBhdGggKyAnYXBpLycgKyBnbG9iYWxQcm9qZWN0ICsgJy9zdG9yZS8nO1xuXG4gICAgICAgIGlmICh1cmkucHJvdG9jb2wpIHtcbiAgICAgICAgICAgIGdsb2JhbFNlcnZlciA9IHVyaS5wcm90b2NvbCArICc6JyArIGdsb2JhbFNlcnZlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnbG9iYWxPcHRpb25zLmZldGNoQ29udGV4dCkge1xuICAgICAgICAgICAgVHJhY2VLaXQucmVtb3RlRmV0Y2hpbmcgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGdsb2JhbE9wdGlvbnMubGluZXNPZkNvbnRleHQpIHtcbiAgICAgICAgICAgIFRyYWNlS2l0LmxpbmVzT2ZDb250ZXh0ID0gZ2xvYmFsT3B0aW9ucy5saW5lc09mQ29udGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIFRyYWNlS2l0LmNvbGxlY3RXaW5kb3dFcnJvcnMgPSAhIWdsb2JhbE9wdGlvbnMuY29sbGVjdFdpbmRvd0Vycm9ycztcblxuICAgICAgICBzZXRBdXRoUXVlcnlTdHJpbmcoKTtcblxuICAgICAgICAvLyByZXR1cm4gZm9yIGNoYWluaW5nXG4gICAgICAgIHJldHVybiBSYXZlbjtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBJbnN0YWxscyBhIGdsb2JhbCB3aW5kb3cub25lcnJvciBlcnJvciBoYW5kbGVyXG4gICAgICogdG8gY2FwdHVyZSBhbmQgcmVwb3J0IHVuY2F1Z2h0IGV4Y2VwdGlvbnMuXG4gICAgICogQXQgdGhpcyBwb2ludCwgaW5zdGFsbCgpIGlzIHJlcXVpcmVkIHRvIGJlIGNhbGxlZCBkdWVcbiAgICAgKiB0byB0aGUgd2F5IFRyYWNlS2l0IGlzIHNldCB1cC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1JhdmVufVxuICAgICAqL1xuICAgIGluc3RhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaXNTZXR1cCgpICYmICFpc1JhdmVuSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICBUcmFjZUtpdC5yZXBvcnQuc3Vic2NyaWJlKGhhbmRsZVN0YWNrSW5mbyk7XG4gICAgICAgICAgICBpc1JhdmVuSW5zdGFsbGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBSYXZlbjtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBXcmFwIGNvZGUgd2l0aGluIGEgY29udGV4dCBzbyBSYXZlbiBjYW4gY2FwdHVyZSBlcnJvcnNcbiAgICAgKiByZWxpYWJseSBhY3Jvc3MgZG9tYWlucyB0aGF0IGlzIGV4ZWN1dGVkIGltbWVkaWF0ZWx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBzcGVjaWZpYyBzZXQgb2Ygb3B0aW9ucyBmb3IgdGhpcyBjb250ZXh0IFtvcHRpb25hbF1cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmdW5jIFRoZSBjYWxsYmFjayB0byBiZSBpbW1lZGlhdGVseSBleGVjdXRlZCB3aXRoaW4gdGhlIGNvbnRleHRcbiAgICAgKiBAcGFyYW0ge2FycmF5fSBhcmdzIEFuIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBjYWxsZWQgd2l0aCB0aGUgY2FsbGJhY2sgW29wdGlvbmFsXVxuICAgICAqL1xuICAgIGNvbnRleHQ6IGZ1bmN0aW9uKG9wdGlvbnMsIGZ1bmMsIGFyZ3MpIHtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24ob3B0aW9ucykpIHtcbiAgICAgICAgICAgIGFyZ3MgPSBmdW5jIHx8IFtdO1xuICAgICAgICAgICAgZnVuYyA9IG9wdGlvbnM7XG4gICAgICAgICAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFJhdmVuLndyYXAob3B0aW9ucywgZnVuYykuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogV3JhcCBjb2RlIHdpdGhpbiBhIGNvbnRleHQgYW5kIHJldHVybnMgYmFjayBhIG5ldyBmdW5jdGlvbiB0byBiZSBleGVjdXRlZFxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgQSBzcGVjaWZpYyBzZXQgb2Ygb3B0aW9ucyBmb3IgdGhpcyBjb250ZXh0IFtvcHRpb25hbF1cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBiZSB3cmFwcGVkIGluIGEgbmV3IGNvbnRleHRcbiAgICAgKiBAcmV0dXJuIHtmdW5jdGlvbn0gVGhlIG5ld2x5IHdyYXBwZWQgZnVuY3Rpb25zIHdpdGggYSBjb250ZXh0XG4gICAgICovXG4gICAgd3JhcDogZnVuY3Rpb24ob3B0aW9ucywgZnVuYykge1xuICAgICAgICAvLyAxIGFyZ3VtZW50IGhhcyBiZWVuIHBhc3NlZCwgYW5kIGl0J3Mgbm90IGEgZnVuY3Rpb25cbiAgICAgICAgLy8gc28ganVzdCByZXR1cm4gaXRcbiAgICAgICAgaWYgKGlzVW5kZWZpbmVkKGZ1bmMpICYmICFpc0Z1bmN0aW9uKG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG9wdGlvbnMgaXMgb3B0aW9uYWxcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24ob3B0aW9ucykpIHtcbiAgICAgICAgICAgIGZ1bmMgPSBvcHRpb25zO1xuICAgICAgICAgICAgb3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlJ3ZlIHBhc3NlZCBhbG9uZyAyIGFyZ3VtZW50cywgYW5kIHRoZSBzZWNvbmQgb25lXG4gICAgICAgIC8vIGlzIG5vdCBhIGZ1bmN0aW9uIGVpdGhlciwgc28gd2UnbGwganVzdCByZXR1cm4gdGhlIHNlY29uZCBhcmd1bWVudC5cbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGRvbid0IHdhbm5hIHdyYXAgaXQgdHdpY2UhXG4gICAgICAgIGlmIChmdW5jLl9fcmF2ZW5fXykge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB3cmFwcGVkKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXSwgaSA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgZGVlcCA9ICFvcHRpb25zIHx8IG9wdGlvbnMgJiYgb3B0aW9ucy5kZWVwICE9PSBmYWxzZTtcbiAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHdyYXAgYWxsIG9mIGEgZnVuY3Rpb24ncyBhcmd1bWVudHMgdGhhdCBhcmVcbiAgICAgICAgICAgIC8vIGZ1bmN0aW9ucyB0aGVtc2VsdmVzLlxuXG4gICAgICAgICAgICB3aGlsZShpLS0pIGFyZ3NbaV0gPSBkZWVwID8gUmF2ZW4ud3JhcChvcHRpb25zLCBhcmd1bWVudHNbaV0pIDogYXJndW1lbnRzW2ldO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8qanNoaW50IC1XMDQwKi9cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIFJhdmVuLmNhcHR1cmVFeGNlcHRpb24oZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvcHkgb3ZlciBwcm9wZXJ0aWVzIG9mIHRoZSBvbGQgZnVuY3Rpb25cbiAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gZnVuYykge1xuICAgICAgICAgICAgaWYgKGhhc0tleShmdW5jLCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICB3cmFwcGVkW3Byb3BlcnR5XSA9IGZ1bmNbcHJvcGVydHldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2lnbmFsIHRoYXQgdGhpcyBmdW5jdGlvbiBoYXMgYmVlbiB3cmFwcGVkIGFscmVhZHlcbiAgICAgICAgLy8gZm9yIGJvdGggZGVidWdnaW5nIGFuZCB0byBwcmV2ZW50IGl0IHRvIGJlaW5nIHdyYXBwZWQgdHdpY2VcbiAgICAgICAgd3JhcHBlZC5fX3JhdmVuX18gPSB0cnVlO1xuICAgICAgICB3cmFwcGVkLl9faW5uZXJfXyA9IGZ1bmM7XG5cbiAgICAgICAgcmV0dXJuIHdyYXBwZWQ7XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogVW5pbnN0YWxscyB0aGUgZ2xvYmFsIGVycm9yIGhhbmRsZXIuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtSYXZlbn1cbiAgICAgKi9cbiAgICB1bmluc3RhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICBUcmFjZUtpdC5yZXBvcnQudW5pbnN0YWxsKCk7XG4gICAgICAgIGlzUmF2ZW5JbnN0YWxsZWQgPSBmYWxzZTtcblxuICAgICAgICByZXR1cm4gUmF2ZW47XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogTWFudWFsbHkgY2FwdHVyZSBhbiBleGNlcHRpb24gYW5kIHNlbmQgaXQgb3ZlciB0byBTZW50cnlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZXJyb3J9IGV4IEFuIGV4Y2VwdGlvbiB0byBiZSBsb2dnZWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBBIHNwZWNpZmljIHNldCBvZiBvcHRpb25zIGZvciB0aGlzIGVycm9yIFtvcHRpb25hbF1cbiAgICAgKiBAcmV0dXJuIHtSYXZlbn1cbiAgICAgKi9cbiAgICBjYXB0dXJlRXhjZXB0aW9uOiBmdW5jdGlvbihleCwgb3B0aW9ucykge1xuICAgICAgICAvLyBJZiBub3QgYW4gRXJyb3IgaXMgcGFzc2VkIHRocm91Z2gsIHJlY2FsbCBhcyBhIG1lc3NhZ2UgaW5zdGVhZFxuICAgICAgICBpZiAoIShleCBpbnN0YW5jZW9mIEVycm9yKSkgcmV0dXJuIFJhdmVuLmNhcHR1cmVNZXNzYWdlKGV4LCBvcHRpb25zKTtcblxuICAgICAgICAvLyBTdG9yZSB0aGUgcmF3IGV4Y2VwdGlvbiBvYmplY3QgZm9yIHBvdGVudGlhbCBkZWJ1Z2dpbmcgYW5kIGludHJvc3BlY3Rpb25cbiAgICAgICAgbGFzdENhcHR1cmVkRXhjZXB0aW9uID0gZXg7XG5cbiAgICAgICAgLy8gVHJhY2VLaXQucmVwb3J0IHdpbGwgcmUtcmFpc2UgYW55IGV4Y2VwdGlvbiBwYXNzZWQgdG8gaXQsXG4gICAgICAgIC8vIHdoaWNoIG1lYW5zIHlvdSBoYXZlIHRvIHdyYXAgaXQgaW4gdHJ5L2NhdGNoLiBJbnN0ZWFkLCB3ZVxuICAgICAgICAvLyBjYW4gd3JhcCBpdCBoZXJlIGFuZCBvbmx5IHJlLXJhaXNlIGlmIFRyYWNlS2l0LnJlcG9ydFxuICAgICAgICAvLyByYWlzZXMgYW4gZXhjZXB0aW9uIGRpZmZlcmVudCBmcm9tIHRoZSBvbmUgd2UgYXNrZWQgdG9cbiAgICAgICAgLy8gcmVwb3J0IG9uLlxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgVHJhY2VLaXQucmVwb3J0KGV4LCBvcHRpb25zKTtcbiAgICAgICAgfSBjYXRjaChleDEpIHtcbiAgICAgICAgICAgIGlmKGV4ICE9PSBleDEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBleDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUmF2ZW47XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogTWFudWFsbHkgc2VuZCBhIG1lc3NhZ2UgdG8gU2VudHJ5XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnIEEgcGxhaW4gbWVzc2FnZSB0byBiZSBjYXB0dXJlZCBpbiBTZW50cnlcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBBIHNwZWNpZmljIHNldCBvZiBvcHRpb25zIGZvciB0aGlzIG1lc3NhZ2UgW29wdGlvbmFsXVxuICAgICAqIEByZXR1cm4ge1JhdmVufVxuICAgICAqL1xuICAgIGNhcHR1cmVNZXNzYWdlOiBmdW5jdGlvbihtc2csIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gRmlyZSBhd2F5IVxuICAgICAgICBzZW5kKFxuICAgICAgICAgICAgb2JqZWN0TWVyZ2Uoe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IG1zZyArICcnICAvLyBNYWtlIHN1cmUgaXQncyBhY3R1YWxseSBhIHN0cmluZ1xuICAgICAgICAgICAgfSwgb3B0aW9ucylcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gUmF2ZW47XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogU2V0L2NsZWFyIGEgdXNlciB0byBiZSBzZW50IGFsb25nIHdpdGggdGhlIHBheWxvYWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdXNlciBBbiBvYmplY3QgcmVwcmVzZW50aW5nIHVzZXIgZGF0YSBbb3B0aW9uYWxdXG4gICAgICogQHJldHVybiB7UmF2ZW59XG4gICAgICovXG4gICAgc2V0VXNlckNvbnRleHQ6IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICBnbG9iYWxVc2VyID0gdXNlcjtcblxuICAgICAgIHJldHVybiBSYXZlbjtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBTZXQgZXh0cmEgYXR0cmlidXRlcyB0byBiZSBzZW50IGFsb25nIHdpdGggdGhlIHBheWxvYWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZXh0cmEgQW4gb2JqZWN0IHJlcHJlc2VudGluZyBleHRyYSBkYXRhIFtvcHRpb25hbF1cbiAgICAgKiBAcmV0dXJuIHtSYXZlbn1cbiAgICAgKi9cbiAgICBzZXRFeHRyYUNvbnRleHQ6IGZ1bmN0aW9uKGV4dHJhKSB7XG4gICAgICAgZ2xvYmFsT3B0aW9ucy5leHRyYSA9IGV4dHJhIHx8IHt9O1xuXG4gICAgICAgcmV0dXJuIFJhdmVuO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIFNldCB0YWdzIHRvIGJlIHNlbnQgYWxvbmcgd2l0aCB0aGUgcGF5bG9hZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0YWdzIEFuIG9iamVjdCByZXByZXNlbnRpbmcgdGFncyBbb3B0aW9uYWxdXG4gICAgICogQHJldHVybiB7UmF2ZW59XG4gICAgICovXG4gICAgc2V0VGFnc0NvbnRleHQ6IGZ1bmN0aW9uKHRhZ3MpIHtcbiAgICAgICBnbG9iYWxPcHRpb25zLnRhZ3MgPSB0YWdzIHx8IHt9O1xuXG4gICAgICAgcmV0dXJuIFJhdmVuO1xuICAgIH0sXG5cbiAgICAvKlxuICAgICAqIEdldCB0aGUgbGF0ZXN0IHJhdyBleGNlcHRpb24gdGhhdCB3YXMgY2FwdHVyZWQgYnkgUmF2ZW4uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtlcnJvcn1cbiAgICAgKi9cbiAgICBsYXN0RXhjZXB0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGxhc3RDYXB0dXJlZEV4Y2VwdGlvbjtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBHZXQgdGhlIGxhc3QgZXZlbnQgaWRcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBsYXN0RXZlbnRJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBsYXN0RXZlbnRJZDtcbiAgICB9XG59O1xuXG5SYXZlbi5zZXRVc2VyID0gUmF2ZW4uc2V0VXNlckNvbnRleHQ7IC8vIFRvIGJlIGRlcHJlY2F0ZWRcblxuZnVuY3Rpb24gdHJpZ2dlckV2ZW50KGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgIHZhciBldmVudCwga2V5O1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBldmVudFR5cGUgPSAncmF2ZW4nICsgZXZlbnRUeXBlLnN1YnN0cigwLDEpLnRvVXBwZXJDYXNlKCkgKyBldmVudFR5cGUuc3Vic3RyKDEpO1xuXG4gICAgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50KSB7XG4gICAgICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcbiAgICAgICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50VHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgICAgICBldmVudC5ldmVudFR5cGUgPSBldmVudFR5cGU7XG4gICAgfVxuXG4gICAgZm9yIChrZXkgaW4gb3B0aW9ucykgaWYgKGhhc0tleShvcHRpb25zLCBrZXkpKSB7XG4gICAgICAgIGV2ZW50W2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgfVxuXG4gICAgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50KSB7XG4gICAgICAgIC8vIElFOSBpZiBzdGFuZGFyZHNcbiAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSUU4IHJlZ2FyZGxlc3Mgb2YgUXVpcmtzIG9yIFN0YW5kYXJkc1xuICAgICAgICAvLyBJRTkgaWYgcXVpcmtzXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkb2N1bWVudC5maXJlRXZlbnQoJ29uJyArIGV2ZW50LmV2ZW50VHlwZS50b0xvd2VyQ2FzZSgpLCBldmVudCk7XG4gICAgICAgIH0gY2F0Y2goZSkge31cbiAgICB9XG59XG5cbnZhciBkc25LZXlzID0gJ3NvdXJjZSBwcm90b2NvbCB1c2VyIHBhc3MgaG9zdCBwb3J0IHBhdGgnLnNwbGl0KCcgJyksXG4gICAgZHNuUGF0dGVybiA9IC9eKD86KFxcdyspOik/XFwvXFwvKFxcdyspKDpcXHcrKT9AKFtcXHdcXC4tXSspKD86OihcXGQrKSk/KFxcLy4qKS87XG5cbmZ1bmN0aW9uIFJhdmVuQ29uZmlnRXJyb3IobWVzc2FnZSkge1xuICAgIHRoaXMubmFtZSA9ICdSYXZlbkNvbmZpZ0Vycm9yJztcbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xufVxuUmF2ZW5Db25maWdFcnJvci5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblJhdmVuQ29uZmlnRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmF2ZW5Db25maWdFcnJvcjtcblxuLyoqKiogUHJpdmF0ZSBmdW5jdGlvbnMgKioqKi9cbmZ1bmN0aW9uIHBhcnNlRFNOKHN0cikge1xuICAgIHZhciBtID0gZHNuUGF0dGVybi5leGVjKHN0ciksXG4gICAgICAgIGRzbiA9IHt9LFxuICAgICAgICBpID0gNztcblxuICAgIHRyeSB7XG4gICAgICAgIHdoaWxlIChpLS0pIGRzbltkc25LZXlzW2ldXSA9IG1baV0gfHwgJyc7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHRocm93IG5ldyBSYXZlbkNvbmZpZ0Vycm9yKCdJbnZhbGlkIERTTjogJyArIHN0cik7XG4gICAgfVxuXG4gICAgaWYgKGRzbi5wYXNzKVxuICAgICAgICB0aHJvdyBuZXcgUmF2ZW5Db25maWdFcnJvcignRG8gbm90IHNwZWNpZnkgeW91ciBwcml2YXRlIGtleSBpbiB0aGUgRFNOIScpO1xuXG4gICAgcmV0dXJuIGRzbjtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQod2hhdCkge1xuICAgIHJldHVybiB0eXBlb2Ygd2hhdCA9PT0gJ3VuZGVmaW5lZCc7XG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24od2hhdCkge1xuICAgIHJldHVybiB0eXBlb2Ygd2hhdCA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcod2hhdCkge1xuICAgIHJldHVybiB0eXBlb2Ygd2hhdCA9PT0gJ3N0cmluZyc7XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHlPYmplY3Qod2hhdCkge1xuICAgIGZvciAodmFyIGsgaW4gd2hhdCkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIGhhc0tleSwgYSBiZXR0ZXIgZm9ybSBvZiBoYXNPd25Qcm9wZXJ0eVxuICogRXhhbXBsZTogaGFzS2V5KE1haW5Ib3N0T2JqZWN0LCBwcm9wZXJ0eSkgPT09IHRydWUvZmFsc2VcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gaG9zdCBvYmplY3QgdG8gY2hlY2sgcHJvcGVydHlcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdG8gY2hlY2tcbiAqL1xuZnVuY3Rpb24gaGFzS2V5KG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSk7XG59XG5cbmZ1bmN0aW9uIGVhY2gob2JqLCBjYWxsYmFjaykge1xuICAgIHZhciBpLCBqO1xuXG4gICAgaWYgKGlzVW5kZWZpbmVkKG9iai5sZW5ndGgpKSB7XG4gICAgICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChoYXNLZXkob2JqLCBpKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwobnVsbCwgaSwgb2JqW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGogPSBvYmoubGVuZ3RoO1xuICAgICAgICBpZiAoaikge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwobnVsbCwgaSwgb2JqW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBzZXRBdXRoUXVlcnlTdHJpbmcoKSB7XG4gICAgYXV0aFF1ZXJ5U3RyaW5nID1cbiAgICAgICAgJz9zZW50cnlfdmVyc2lvbj00JyArXG4gICAgICAgICcmc2VudHJ5X2NsaWVudD1yYXZlbi1qcy8nICsgUmF2ZW4uVkVSU0lPTiArXG4gICAgICAgICcmc2VudHJ5X2tleT0nICsgZ2xvYmFsS2V5O1xufVxuXG5cbmZ1bmN0aW9uIGhhbmRsZVN0YWNrSW5mbyhzdGFja0luZm8sIG9wdGlvbnMpIHtcbiAgICB2YXIgZnJhbWVzID0gW107XG5cbiAgICBpZiAoc3RhY2tJbmZvLnN0YWNrICYmIHN0YWNrSW5mby5zdGFjay5sZW5ndGgpIHtcbiAgICAgICAgZWFjaChzdGFja0luZm8uc3RhY2ssIGZ1bmN0aW9uKGksIHN0YWNrKSB7XG4gICAgICAgICAgICB2YXIgZnJhbWUgPSBub3JtYWxpemVGcmFtZShzdGFjayk7XG4gICAgICAgICAgICBpZiAoZnJhbWUpIHtcbiAgICAgICAgICAgICAgICBmcmFtZXMucHVzaChmcmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHRyaWdnZXJFdmVudCgnaGFuZGxlJywge1xuICAgICAgICBzdGFja0luZm86IHN0YWNrSW5mbyxcbiAgICAgICAgb3B0aW9uczogb3B0aW9uc1xuICAgIH0pO1xuXG4gICAgcHJvY2Vzc0V4Y2VwdGlvbihcbiAgICAgICAgc3RhY2tJbmZvLm5hbWUsXG4gICAgICAgIHN0YWNrSW5mby5tZXNzYWdlLFxuICAgICAgICBzdGFja0luZm8udXJsLFxuICAgICAgICBzdGFja0luZm8ubGluZW5vLFxuICAgICAgICBmcmFtZXMsXG4gICAgICAgIG9wdGlvbnNcbiAgICApO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVGcmFtZShmcmFtZSkge1xuICAgIGlmICghZnJhbWUudXJsKSByZXR1cm47XG5cbiAgICAvLyBub3JtYWxpemUgdGhlIGZyYW1lcyBkYXRhXG4gICAgdmFyIG5vcm1hbGl6ZWQgPSB7XG4gICAgICAgIGZpbGVuYW1lOiAgIGZyYW1lLnVybCxcbiAgICAgICAgbGluZW5vOiAgICAgZnJhbWUubGluZSxcbiAgICAgICAgY29sbm86ICAgICAgZnJhbWUuY29sdW1uLFxuICAgICAgICAnZnVuY3Rpb24nOiBmcmFtZS5mdW5jIHx8ICc/J1xuICAgIH0sIGNvbnRleHQgPSBleHRyYWN0Q29udGV4dEZyb21GcmFtZShmcmFtZSksIGk7XG5cbiAgICBpZiAoY29udGV4dCkge1xuICAgICAgICB2YXIga2V5cyA9IFsncHJlX2NvbnRleHQnLCAnY29udGV4dF9saW5lJywgJ3Bvc3RfY29udGV4dCddO1xuICAgICAgICBpID0gMztcbiAgICAgICAgd2hpbGUgKGktLSkgbm9ybWFsaXplZFtrZXlzW2ldXSA9IGNvbnRleHRbaV07XG4gICAgfVxuXG4gICAgbm9ybWFsaXplZC5pbl9hcHAgPSAhKCAvLyBkZXRlcm1pbmUgaWYgYW4gZXhjZXB0aW9uIGNhbWUgZnJvbSBvdXRzaWRlIG9mIG91ciBhcHBcbiAgICAgICAgLy8gZmlyc3Qgd2UgY2hlY2sgdGhlIGdsb2JhbCBpbmNsdWRlUGF0aHMgbGlzdC5cbiAgICAgICAgIWdsb2JhbE9wdGlvbnMuaW5jbHVkZVBhdGhzLnRlc3Qobm9ybWFsaXplZC5maWxlbmFtZSkgfHxcbiAgICAgICAgLy8gTm93IHdlIGNoZWNrIGZvciBmdW4sIGlmIHRoZSBmdW5jdGlvbiBuYW1lIGlzIFJhdmVuIG9yIFRyYWNlS2l0XG4gICAgICAgIC8oUmF2ZW58VHJhY2VLaXQpXFwuLy50ZXN0KG5vcm1hbGl6ZWRbJ2Z1bmN0aW9uJ10pIHx8XG4gICAgICAgIC8vIGZpbmFsbHksIHdlIGRvIGEgbGFzdCBkaXRjaCBlZmZvcnQgYW5kIGNoZWNrIGZvciByYXZlbi5taW4uanNcbiAgICAgICAgL3JhdmVuXFwuKG1pblxcLik/anMkLy50ZXN0KG5vcm1hbGl6ZWQuZmlsZW5hbWUpXG4gICAgKTtcblxuICAgIHJldHVybiBub3JtYWxpemVkO1xufVxuXG5mdW5jdGlvbiBleHRyYWN0Q29udGV4dEZyb21GcmFtZShmcmFtZSkge1xuICAgIC8vIGltbWVkaWF0ZWx5IGNoZWNrIGlmIHdlIHNob3VsZCBldmVuIGF0dGVtcHQgdG8gcGFyc2UgYSBjb250ZXh0XG4gICAgaWYgKCFmcmFtZS5jb250ZXh0IHx8ICFnbG9iYWxPcHRpb25zLmZldGNoQ29udGV4dCkgcmV0dXJuO1xuXG4gICAgdmFyIGNvbnRleHQgPSBmcmFtZS5jb250ZXh0LFxuICAgICAgICBwaXZvdCA9IH5+KGNvbnRleHQubGVuZ3RoIC8gMiksXG4gICAgICAgIGkgPSBjb250ZXh0Lmxlbmd0aCwgaXNNaW5pZmllZCA9IGZhbHNlO1xuXG4gICAgd2hpbGUgKGktLSkge1xuICAgICAgICAvLyBXZSdyZSBtYWtpbmcgYSBndWVzcyB0byBzZWUgaWYgdGhlIHNvdXJjZSBpcyBtaW5pZmllZCBvciBub3QuXG4gICAgICAgIC8vIFRvIGRvIHRoYXQsIHdlIG1ha2UgdGhlIGFzc3VtcHRpb24gaWYgKmFueSogb2YgdGhlIGxpbmVzIHBhc3NlZFxuICAgICAgICAvLyBpbiBhcmUgZ3JlYXRlciB0aGFuIDMwMCBjaGFyYWN0ZXJzIGxvbmcsIHdlIGJhaWwuXG4gICAgICAgIC8vIFNlbnRyeSB3aWxsIHNlZSB0aGF0IHRoZXJlIGlzbid0IGEgY29udGV4dFxuICAgICAgICBpZiAoY29udGV4dFtpXS5sZW5ndGggPiAzMDApIHtcbiAgICAgICAgICAgIGlzTWluaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaXNNaW5pZmllZCkge1xuICAgICAgICAvLyBUaGUgc291cmNlIGlzIG1pbmlmaWVkIGFuZCB3ZSBkb24ndCBrbm93IHdoaWNoIGNvbHVtbi4gRnVjayBpdC5cbiAgICAgICAgaWYgKGlzVW5kZWZpbmVkKGZyYW1lLmNvbHVtbikpIHJldHVybjtcblxuICAgICAgICAvLyBJZiB0aGUgc291cmNlIGlzIG1pbmlmaWVkIGFuZCBoYXMgYSBmcmFtZSBjb2x1bW5cbiAgICAgICAgLy8gd2UgdGFrZSBhIGNodW5rIG9mIHRoZSBvZmZlbmRpbmcgbGluZSB0byBob3BlZnVsbHkgc2hlZCBzb21lIGxpZ2h0XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBbXSwgIC8vIG5vIHByZV9jb250ZXh0XG4gICAgICAgICAgICBjb250ZXh0W3Bpdm90XS5zdWJzdHIoZnJhbWUuY29sdW1uLCA1MCksIC8vIGdyYWIgNTAgY2hhcmFjdGVycywgc3RhcnRpbmcgYXQgdGhlIG9mZmVuZGluZyBjb2x1bW5cbiAgICAgICAgICAgIFtdICAgLy8gbm8gcG9zdF9jb250ZXh0XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgICAgY29udGV4dC5zbGljZSgwLCBwaXZvdCksICAgIC8vIHByZV9jb250ZXh0XG4gICAgICAgIGNvbnRleHRbcGl2b3RdLCAgICAgICAgICAgICAvLyBjb250ZXh0X2xpbmVcbiAgICAgICAgY29udGV4dC5zbGljZShwaXZvdCArIDEpICAgIC8vIHBvc3RfY29udGV4dFxuICAgIF07XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NFeGNlcHRpb24odHlwZSwgbWVzc2FnZSwgZmlsZXVybCwgbGluZW5vLCBmcmFtZXMsIG9wdGlvbnMpIHtcbiAgICB2YXIgc3RhY2t0cmFjZSwgbGFiZWwsIGk7XG5cbiAgICAvLyBJbiBzb21lIGluc3RhbmNlcyBtZXNzYWdlIGlzIG5vdCBhY3R1YWxseSBhIHN0cmluZywgbm8gaWRlYSB3aHksXG4gICAgLy8gc28gd2Ugd2FudCB0byBhbHdheXMgY29lcmNlIGl0IHRvIG9uZS5cbiAgICBtZXNzYWdlICs9ICcnO1xuXG4gICAgLy8gU29tZXRpbWVzIGFuIGV4Y2VwdGlvbiBpcyBnZXR0aW5nIGxvZ2dlZCBpbiBTZW50cnkgYXNcbiAgICAvLyA8bm8gbWVzc2FnZSB2YWx1ZT5cbiAgICAvLyBUaGlzIGNhbiBvbmx5IG1lYW4gdGhhdCB0aGUgbWVzc2FnZSB3YXMgZmFsc2V5IHNpbmNlIHRoaXMgdmFsdWVcbiAgICAvLyBpcyBoYXJkY29kZWQgaW50byBTZW50cnkgaXRzZWxmLlxuICAgIC8vIEF0IHRoaXMgcG9pbnQsIGlmIHRoZSBtZXNzYWdlIGlzIGZhbHNleSwgd2UgYmFpbCBzaW5jZSBpdCdzIHVzZWxlc3NcbiAgICBpZiAodHlwZSA9PT0gJ0Vycm9yJyAmJiAhbWVzc2FnZSkgcmV0dXJuO1xuXG4gICAgaWYgKGdsb2JhbE9wdGlvbnMuaWdub3JlRXJyb3JzLnRlc3QobWVzc2FnZSkpIHJldHVybjtcblxuICAgIGlmIChmcmFtZXMgJiYgZnJhbWVzLmxlbmd0aCkge1xuICAgICAgICBmaWxldXJsID0gZnJhbWVzWzBdLmZpbGVuYW1lIHx8IGZpbGV1cmw7XG4gICAgICAgIC8vIFNlbnRyeSBleHBlY3RzIGZyYW1lcyBvbGRlc3QgdG8gbmV3ZXN0XG4gICAgICAgIC8vIGFuZCBKUyBzZW5kcyB0aGVtIGFzIG5ld2VzdCB0byBvbGRlc3RcbiAgICAgICAgZnJhbWVzLnJldmVyc2UoKTtcbiAgICAgICAgc3RhY2t0cmFjZSA9IHtmcmFtZXM6IGZyYW1lc307XG4gICAgfSBlbHNlIGlmIChmaWxldXJsKSB7XG4gICAgICAgIHN0YWNrdHJhY2UgPSB7XG4gICAgICAgICAgICBmcmFtZXM6IFt7XG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGV1cmwsXG4gICAgICAgICAgICAgICAgbGluZW5vOiBsaW5lbm8sXG4gICAgICAgICAgICAgICAgaW5fYXBwOiB0cnVlXG4gICAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8vIFRydW5jYXRlIHRoZSBtZXNzYWdlIHRvIGEgbWF4IG9mIGNoYXJhY3RlcnNcbiAgICBtZXNzYWdlID0gdHJ1bmNhdGUobWVzc2FnZSwgMTAwKTtcblxuICAgIGlmIChnbG9iYWxPcHRpb25zLmlnbm9yZVVybHMgJiYgZ2xvYmFsT3B0aW9ucy5pZ25vcmVVcmxzLnRlc3QoZmlsZXVybCkpIHJldHVybjtcbiAgICBpZiAoZ2xvYmFsT3B0aW9ucy53aGl0ZWxpc3RVcmxzICYmICFnbG9iYWxPcHRpb25zLndoaXRlbGlzdFVybHMudGVzdChmaWxldXJsKSkgcmV0dXJuO1xuXG4gICAgbGFiZWwgPSBsaW5lbm8gPyBtZXNzYWdlICsgJyBhdCAnICsgbGluZW5vIDogbWVzc2FnZTtcblxuICAgIC8vIEZpcmUgYXdheSFcbiAgICBzZW5kKFxuICAgICAgICBvYmplY3RNZXJnZSh7XG4gICAgICAgICAgICAvLyBzZW50cnkuaW50ZXJmYWNlcy5FeGNlcHRpb25cbiAgICAgICAgICAgIGV4Y2VwdGlvbjoge1xuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG1lc3NhZ2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBzZW50cnkuaW50ZXJmYWNlcy5TdGFja3RyYWNlXG4gICAgICAgICAgICBzdGFja3RyYWNlOiBzdGFja3RyYWNlLFxuICAgICAgICAgICAgY3VscHJpdDogZmlsZXVybCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGxhYmVsXG4gICAgICAgIH0sIG9wdGlvbnMpXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gb2JqZWN0TWVyZ2Uob2JqMSwgb2JqMikge1xuICAgIGlmICghb2JqMikge1xuICAgICAgICByZXR1cm4gb2JqMTtcbiAgICB9XG4gICAgZWFjaChvYmoyLCBmdW5jdGlvbihrZXksIHZhbHVlKXtcbiAgICAgICAgb2JqMVtrZXldID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajE7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHN0ciwgbWF4KSB7XG4gICAgcmV0dXJuIHN0ci5sZW5ndGggPD0gbWF4ID8gc3RyIDogc3RyLnN1YnN0cigwLCBtYXgpICsgJ1xcdTIwMjYnO1xufVxuXG5mdW5jdGlvbiBnZXRIdHRwRGF0YSgpIHtcbiAgICB2YXIgaHR0cCA9IHtcbiAgICAgICAgdXJsOiBkb2N1bWVudC5sb2NhdGlvbi5ocmVmLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnVXNlci1BZ2VudCc6IG5hdmlnYXRvci51c2VyQWdlbnRcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoZG9jdW1lbnQucmVmZXJyZXIpIHtcbiAgICAgICAgaHR0cC5oZWFkZXJzLlJlZmVyZXIgPSBkb2N1bWVudC5yZWZlcnJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gaHR0cDtcbn1cblxuZnVuY3Rpb24gc2VuZChkYXRhKSB7XG4gICAgaWYgKCFpc1NldHVwKCkpIHJldHVybjtcblxuICAgIGRhdGEgPSBvYmplY3RNZXJnZSh7XG4gICAgICAgIHByb2plY3Q6IGdsb2JhbFByb2plY3QsXG4gICAgICAgIGxvZ2dlcjogZ2xvYmFsT3B0aW9ucy5sb2dnZXIsXG4gICAgICAgIHNpdGU6IGdsb2JhbE9wdGlvbnMuc2l0ZSxcbiAgICAgICAgcGxhdGZvcm06ICdqYXZhc2NyaXB0JyxcbiAgICAgICAgLy8gc2VudHJ5LmludGVyZmFjZXMuSHR0cFxuICAgICAgICByZXF1ZXN0OiBnZXRIdHRwRGF0YSgpXG4gICAgfSwgZGF0YSk7XG5cbiAgICAvLyBNZXJnZSBpbiB0aGUgdGFncyBhbmQgZXh0cmEgc2VwYXJhdGVseSBzaW5jZSBvYmplY3RNZXJnZSBkb2Vzbid0IGhhbmRsZSBhIGRlZXAgbWVyZ2VcbiAgICBkYXRhLnRhZ3MgPSBvYmplY3RNZXJnZShnbG9iYWxPcHRpb25zLnRhZ3MsIGRhdGEudGFncyk7XG4gICAgZGF0YS5leHRyYSA9IG9iamVjdE1lcmdlKGdsb2JhbE9wdGlvbnMuZXh0cmEsIGRhdGEuZXh0cmEpO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIG5vIHRhZ3MvZXh0cmEsIHN0cmlwIHRoZSBrZXkgZnJvbSB0aGUgcGF5bG9hZCBhbGx0b2d0aGVyLlxuICAgIGlmIChpc0VtcHR5T2JqZWN0KGRhdGEudGFncykpIGRlbGV0ZSBkYXRhLnRhZ3M7XG4gICAgaWYgKGlzRW1wdHlPYmplY3QoZGF0YS5leHRyYSkpIGRlbGV0ZSBkYXRhLmV4dHJhO1xuXG4gICAgaWYgKGdsb2JhbFVzZXIpIHtcbiAgICAgICAgLy8gc2VudHJ5LmludGVyZmFjZXMuVXNlclxuICAgICAgICBkYXRhLnVzZXIgPSBnbG9iYWxVc2VyO1xuICAgIH1cblxuICAgIGlmIChpc0Z1bmN0aW9uKGdsb2JhbE9wdGlvbnMuZGF0YUNhbGxiYWNrKSkge1xuICAgICAgICBkYXRhID0gZ2xvYmFsT3B0aW9ucy5kYXRhQ2FsbGJhY2soZGF0YSk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHJlcXVlc3Qgc2hvdWxkIGJlIGZpbHRlcmVkIG9yIG5vdFxuICAgIGlmIChpc0Z1bmN0aW9uKGdsb2JhbE9wdGlvbnMuc2hvdWxkU2VuZENhbGxiYWNrKSAmJiAhZ2xvYmFsT3B0aW9ucy5zaG91bGRTZW5kQ2FsbGJhY2soZGF0YSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNlbmQgYWxvbmcgYW4gZXZlbnRfaWQgaWYgbm90IGV4cGxpY2l0bHkgcGFzc2VkLlxuICAgIC8vIFRoaXMgZXZlbnRfaWQgY2FuIGJlIHVzZWQgdG8gcmVmZXJlbmNlIHRoZSBlcnJvciB3aXRoaW4gU2VudHJ5IGl0c2VsZi5cbiAgICAvLyBTZXQgbGFzdEV2ZW50SWQgYWZ0ZXIgd2Uga25vdyB0aGUgZXJyb3Igc2hvdWxkIGFjdHVhbGx5IGJlIHNlbnRcbiAgICBsYXN0RXZlbnRJZCA9IGRhdGEuZXZlbnRfaWQgfHwgKGRhdGEuZXZlbnRfaWQgPSB1dWlkNCgpKTtcblxuICAgIG1ha2VSZXF1ZXN0KGRhdGEpO1xufVxuXG5cbmZ1bmN0aW9uIG1ha2VSZXF1ZXN0KGRhdGEpIHtcbiAgICB2YXIgaW1nID0gbmV3IEltYWdlKCksXG4gICAgICAgIHNyYyA9IGdsb2JhbFNlcnZlciArIGF1dGhRdWVyeVN0cmluZyArICcmc2VudHJ5X2RhdGE9JyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gc3VjY2VzcygpIHtcbiAgICAgICAgdHJpZ2dlckV2ZW50KCdzdWNjZXNzJywge1xuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIHNyYzogc3JjXG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgaW1nLm9uZXJyb3IgPSBpbWcub25hYm9ydCA9IGZ1bmN0aW9uIGZhaWx1cmUoKSB7XG4gICAgICAgIHRyaWdnZXJFdmVudCgnZmFpbHVyZScsIHtcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBzcmM6IHNyY1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGltZy5zcmMgPSBzcmM7XG59XG5cbmZ1bmN0aW9uIGlzU2V0dXAoKSB7XG4gICAgaWYgKCFoYXNKU09OKSByZXR1cm4gZmFsc2U7ICAvLyBuZWVkcyBKU09OIHN1cHBvcnRcbiAgICBpZiAoIWdsb2JhbFNlcnZlcikge1xuICAgICAgICBsb2dEZWJ1ZygnZXJyb3InLCAnRXJyb3I6IFJhdmVuIGhhcyBub3QgYmVlbiBjb25maWd1cmVkLicpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBqb2luUmVnRXhwKHBhdHRlcm5zKSB7XG4gICAgLy8gQ29tYmluZSBhbiBhcnJheSBvZiByZWd1bGFyIGV4cHJlc3Npb25zIGFuZCBzdHJpbmdzIGludG8gb25lIGxhcmdlIHJlZ2V4cFxuICAgIC8vIEJlIG1hZC5cbiAgICB2YXIgc291cmNlcyA9IFtdLFxuICAgICAgICBpID0gMCwgbGVuID0gcGF0dGVybnMubGVuZ3RoLFxuICAgICAgICBwYXR0ZXJuO1xuXG4gICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBwYXR0ZXJuID0gcGF0dGVybnNbaV07XG4gICAgICAgIGlmIChpc1N0cmluZyhwYXR0ZXJuKSkge1xuICAgICAgICAgICAgLy8gSWYgaXQncyBhIHN0cmluZywgd2UgbmVlZCB0byBlc2NhcGUgaXRcbiAgICAgICAgICAgIC8vIFRha2VuIGZyb206IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvR3VpZGUvUmVndWxhcl9FeHByZXNzaW9uc1xuICAgICAgICAgICAgc291cmNlcy5wdXNoKHBhdHRlcm4ucmVwbGFjZSgvKFsuKis/Xj0hOiR7fSgpfFxcW1xcXVxcL1xcXFxdKS9nLCBcIlxcXFwkMVwiKSk7XG4gICAgICAgIH0gZWxzZSBpZiAocGF0dGVybiAmJiBwYXR0ZXJuLnNvdXJjZSkge1xuICAgICAgICAgICAgLy8gSWYgaXQncyBhIHJlZ2V4cCBhbHJlYWR5LCB3ZSB3YW50IHRvIGV4dHJhY3QgdGhlIHNvdXJjZVxuICAgICAgICAgICAgc291cmNlcy5wdXNoKHBhdHRlcm4uc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJbnRlbnRpb25hbGx5IHNraXAgb3RoZXIgY2FzZXNcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoc291cmNlcy5qb2luKCd8JyksICdpJyk7XG59XG5cbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2hvdy10by1jcmVhdGUtYS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdC8yMTE3NTIzIzIxMTc1MjNcbmZ1bmN0aW9uIHV1aWQ0KCkge1xuICAgIHJldHVybiAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkqMTZ8MCxcbiAgICAgICAgICAgIHYgPSBjID09ICd4JyA/IHIgOiAociYweDN8MHg4KTtcbiAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBsb2dEZWJ1ZyhsZXZlbCwgbWVzc2FnZSkge1xuICAgIGlmICh3aW5kb3cuY29uc29sZSAmJiBjb25zb2xlW2xldmVsXSAmJiBSYXZlbi5kZWJ1Zykge1xuICAgICAgICBjb25zb2xlW2xldmVsXShtZXNzYWdlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFmdGVyTG9hZCgpIHtcbiAgICAvLyBBdHRlbXB0IHRvIGluaXRpYWxpemUgUmF2ZW4gb24gbG9hZFxuICAgIHZhciBSYXZlbkNvbmZpZyA9IHdpbmRvdy5SYXZlbkNvbmZpZztcbiAgICBpZiAoUmF2ZW5Db25maWcpIHtcbiAgICAgICAgUmF2ZW4uY29uZmlnKFJhdmVuQ29uZmlnLmRzbiwgUmF2ZW5Db25maWcuY29uZmlnKS5pbnN0YWxsKCk7XG4gICAgfVxufVxuYWZ0ZXJMb2FkKCk7XG5cbi8vIEV4cG9zZSBSYXZlbiB0byB0aGUgd29ybGRcbndpbmRvdy5SYXZlbiA9IFJhdmVuO1xuXG4vLyBBTURcbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ3JhdmVuJywgW10sIGZ1bmN0aW9uKCkgeyByZXR1cm4gUmF2ZW47IH0pO1xufVxuXG59KSh0aGlzKTtcbiIsIi8qIVxuICAqIFJlcXdlc3QhIEEgZ2VuZXJhbCBwdXJwb3NlIFhIUiBjb25uZWN0aW9uIG1hbmFnZXJcbiAgKiBsaWNlbnNlIE1JVCAoYykgRHVzdGluIERpYXogMjAxNFxuICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kZWQvcmVxd2VzdFxuICAqL1xuXG4hZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGRlZmluaXRpb24pIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpXG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSBkZWZpbmUoZGVmaW5pdGlvbilcbiAgZWxzZSBjb250ZXh0W25hbWVdID0gZGVmaW5pdGlvbigpXG59KCdyZXF3ZXN0JywgdGhpcywgZnVuY3Rpb24gKCkge1xuXG4gIHZhciB3aW4gPSB3aW5kb3dcbiAgICAsIGRvYyA9IGRvY3VtZW50XG4gICAgLCBodHRwc1JlID0gL15odHRwL1xuICAgICwgcHJvdG9jb2xSZSA9IC8oXlxcdyspOlxcL1xcLy9cbiAgICAsIHR3b0h1bmRvID0gL14oMjBcXGR8MTIyMykkLyAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAwNDY5NzIvbXNpZS1yZXR1cm5zLXN0YXR1cy1jb2RlLW9mLTEyMjMtZm9yLWFqYXgtcmVxdWVzdFxuICAgICwgYnlUYWcgPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnXG4gICAgLCByZWFkeVN0YXRlID0gJ3JlYWR5U3RhdGUnXG4gICAgLCBjb250ZW50VHlwZSA9ICdDb250ZW50LVR5cGUnXG4gICAgLCByZXF1ZXN0ZWRXaXRoID0gJ1gtUmVxdWVzdGVkLVdpdGgnXG4gICAgLCBoZWFkID0gZG9jW2J5VGFnXSgnaGVhZCcpWzBdXG4gICAgLCB1bmlxaWQgPSAwXG4gICAgLCBjYWxsYmFja1ByZWZpeCA9ICdyZXF3ZXN0XycgKyAoK25ldyBEYXRlKCkpXG4gICAgLCBsYXN0VmFsdWUgLy8gZGF0YSBzdG9yZWQgYnkgdGhlIG1vc3QgcmVjZW50IEpTT05QIGNhbGxiYWNrXG4gICAgLCB4bWxIdHRwUmVxdWVzdCA9ICdYTUxIdHRwUmVxdWVzdCdcbiAgICAsIHhEb21haW5SZXF1ZXN0ID0gJ1hEb21haW5SZXF1ZXN0J1xuICAgICwgbm9vcCA9IGZ1bmN0aW9uICgpIHt9XG5cbiAgICAsIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PSAnZnVuY3Rpb24nXG4gICAgICAgID8gQXJyYXkuaXNBcnJheVxuICAgICAgICA6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICByZXR1cm4gYSBpbnN0YW5jZW9mIEFycmF5XG4gICAgICAgICAgfVxuXG4gICAgLCBkZWZhdWx0SGVhZGVycyA9IHtcbiAgICAgICAgICAnY29udGVudFR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xuICAgICAgICAsICdyZXF1ZXN0ZWRXaXRoJzogeG1sSHR0cFJlcXVlc3RcbiAgICAgICAgLCAnYWNjZXB0Jzoge1xuICAgICAgICAgICAgICAnKic6ICAndGV4dC9qYXZhc2NyaXB0LCB0ZXh0L2h0bWwsIGFwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwsICovKidcbiAgICAgICAgICAgICwgJ3htbCc6ICAnYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbCdcbiAgICAgICAgICAgICwgJ2h0bWwnOiAndGV4dC9odG1sJ1xuICAgICAgICAgICAgLCAndGV4dCc6ICd0ZXh0L3BsYWluJ1xuICAgICAgICAgICAgLCAnanNvbic6ICdhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L2phdmFzY3JpcHQnXG4gICAgICAgICAgICAsICdqcyc6ICAgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQsIHRleHQvamF2YXNjcmlwdCdcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAsIHhociA9IGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgLy8gaXMgaXQgeC1kb21haW5cbiAgICAgICAgaWYgKG9bJ2Nyb3NzT3JpZ2luJ10gPT09IHRydWUpIHtcbiAgICAgICAgICB2YXIgeGhyID0gd2luW3htbEh0dHBSZXF1ZXN0XSA/IG5ldyBYTUxIdHRwUmVxdWVzdCgpIDogbnVsbFxuICAgICAgICAgIGlmICh4aHIgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4geGhyKSB7XG4gICAgICAgICAgICByZXR1cm4geGhyXG4gICAgICAgICAgfSBlbHNlIGlmICh3aW5beERvbWFpblJlcXVlc3RdKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhEb21haW5SZXF1ZXN0KClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIGRvZXMgbm90IHN1cHBvcnQgY3Jvc3Mtb3JpZ2luIHJlcXVlc3RzJylcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAod2luW3htbEh0dHBSZXF1ZXN0XSkge1xuICAgICAgICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgLCBnbG9iYWxTZXR1cE9wdGlvbnMgPSB7XG4gICAgICAgIGRhdGFGaWx0ZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgfVxuICAgICAgfVxuXG4gIGZ1bmN0aW9uIHN1Y2NlZWQocikge1xuICAgIHZhciBwcm90b2NvbCA9IHByb3RvY29sUmUuZXhlYyhyLnVybCk7XG4gICAgcHJvdG9jb2wgPSAocHJvdG9jb2wgJiYgcHJvdG9jb2xbMV0pIHx8IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbDtcbiAgICByZXR1cm4gaHR0cHNSZS50ZXN0KHByb3RvY29sKSA/IHR3b0h1bmRvLnRlc3Qoci5yZXF1ZXN0LnN0YXR1cykgOiAhIXIucmVxdWVzdC5yZXNwb25zZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVJlYWR5U3RhdGUociwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gdXNlIF9hYm9ydGVkIHRvIG1pdGlnYXRlIGFnYWluc3QgSUUgZXJyIGMwMGMwMjNmXG4gICAgICAvLyAoY2FuJ3QgcmVhZCBwcm9wcyBvbiBhYm9ydGVkIHJlcXVlc3Qgb2JqZWN0cylcbiAgICAgIGlmIChyLl9hYm9ydGVkKSByZXR1cm4gZXJyb3Ioci5yZXF1ZXN0KVxuICAgICAgaWYgKHIucmVxdWVzdCAmJiByLnJlcXVlc3RbcmVhZHlTdGF0ZV0gPT0gNCkge1xuICAgICAgICByLnJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gbm9vcFxuICAgICAgICBpZiAoc3VjY2VlZChyKSkgc3VjY2VzcyhyLnJlcXVlc3QpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlcnJvcihyLnJlcXVlc3QpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0SGVhZGVycyhodHRwLCBvKSB7XG4gICAgdmFyIGhlYWRlcnMgPSBvWydoZWFkZXJzJ10gfHwge31cbiAgICAgICwgaFxuXG4gICAgaGVhZGVyc1snQWNjZXB0J10gPSBoZWFkZXJzWydBY2NlcHQnXVxuICAgICAgfHwgZGVmYXVsdEhlYWRlcnNbJ2FjY2VwdCddW29bJ3R5cGUnXV1cbiAgICAgIHx8IGRlZmF1bHRIZWFkZXJzWydhY2NlcHQnXVsnKiddXG5cbiAgICB2YXIgaXNBRm9ybURhdGEgPSB0eXBlb2YgRm9ybURhdGEgPT09ICdmdW5jdGlvbicgJiYgKG9bJ2RhdGEnXSBpbnN0YW5jZW9mIEZvcm1EYXRhKTtcbiAgICAvLyBicmVha3MgY3Jvc3Mtb3JpZ2luIHJlcXVlc3RzIHdpdGggbGVnYWN5IGJyb3dzZXJzXG4gICAgaWYgKCFvWydjcm9zc09yaWdpbiddICYmICFoZWFkZXJzW3JlcXVlc3RlZFdpdGhdKSBoZWFkZXJzW3JlcXVlc3RlZFdpdGhdID0gZGVmYXVsdEhlYWRlcnNbJ3JlcXVlc3RlZFdpdGgnXVxuICAgIGlmICghaGVhZGVyc1tjb250ZW50VHlwZV0gJiYgIWlzQUZvcm1EYXRhKSBoZWFkZXJzW2NvbnRlbnRUeXBlXSA9IG9bJ2NvbnRlbnRUeXBlJ10gfHwgZGVmYXVsdEhlYWRlcnNbJ2NvbnRlbnRUeXBlJ11cbiAgICBmb3IgKGggaW4gaGVhZGVycylcbiAgICAgIGhlYWRlcnMuaGFzT3duUHJvcGVydHkoaCkgJiYgJ3NldFJlcXVlc3RIZWFkZXInIGluIGh0dHAgJiYgaHR0cC5zZXRSZXF1ZXN0SGVhZGVyKGgsIGhlYWRlcnNbaF0pXG4gIH1cblxuICBmdW5jdGlvbiBzZXRDcmVkZW50aWFscyhodHRwLCBvKSB7XG4gICAgaWYgKHR5cGVvZiBvWyd3aXRoQ3JlZGVudGlhbHMnXSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGh0dHAud2l0aENyZWRlbnRpYWxzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgaHR0cC53aXRoQ3JlZGVudGlhbHMgPSAhIW9bJ3dpdGhDcmVkZW50aWFscyddXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhbENhbGxiYWNrKGRhdGEpIHtcbiAgICBsYXN0VmFsdWUgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiB1cmxhcHBlbmQgKHVybCwgcykge1xuICAgIHJldHVybiB1cmwgKyAoL1xcPy8udGVzdCh1cmwpID8gJyYnIDogJz8nKSArIHNcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUpzb25wKG8sIGZuLCBlcnIsIHVybCkge1xuICAgIHZhciByZXFJZCA9IHVuaXFpZCsrXG4gICAgICAsIGNia2V5ID0gb1snanNvbnBDYWxsYmFjayddIHx8ICdjYWxsYmFjaycgLy8gdGhlICdjYWxsYmFjaycga2V5XG4gICAgICAsIGNidmFsID0gb1snanNvbnBDYWxsYmFja05hbWUnXSB8fCByZXF3ZXN0LmdldGNhbGxiYWNrUHJlZml4KHJlcUlkKVxuICAgICAgLCBjYnJlZyA9IG5ldyBSZWdFeHAoJygoXnxcXFxcP3wmKScgKyBjYmtleSArICcpPShbXiZdKyknKVxuICAgICAgLCBtYXRjaCA9IHVybC5tYXRjaChjYnJlZylcbiAgICAgICwgc2NyaXB0ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgICAsIGxvYWRlZCA9IDBcbiAgICAgICwgaXNJRTEwID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNU0lFIDEwLjAnKSAhPT0gLTFcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgaWYgKG1hdGNoWzNdID09PSAnPycpIHtcbiAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoY2JyZWcsICckMT0nICsgY2J2YWwpIC8vIHdpbGRjYXJkIGNhbGxiYWNrIGZ1bmMgbmFtZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2J2YWwgPSBtYXRjaFszXSAvLyBwcm92aWRlZCBjYWxsYmFjayBmdW5jIG5hbWVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdXJsID0gdXJsYXBwZW5kKHVybCwgY2JrZXkgKyAnPScgKyBjYnZhbCkgLy8gbm8gY2FsbGJhY2sgZGV0YWlscywgYWRkICdlbVxuICAgIH1cblxuICAgIHdpbltjYnZhbF0gPSBnZW5lcmFsQ2FsbGJhY2tcblxuICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCdcbiAgICBzY3JpcHQuc3JjID0gdXJsXG4gICAgc2NyaXB0LmFzeW5jID0gdHJ1ZVxuICAgIGlmICh0eXBlb2Ygc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSAhPT0gJ3VuZGVmaW5lZCcgJiYgIWlzSUUxMCkge1xuICAgICAgLy8gbmVlZCB0aGlzIGZvciBJRSBkdWUgdG8gb3V0LW9mLW9yZGVyIG9ucmVhZHlzdGF0ZWNoYW5nZSgpLCBiaW5kaW5nIHNjcmlwdFxuICAgICAgLy8gZXhlY3V0aW9uIHRvIGFuIGV2ZW50IGxpc3RlbmVyIGdpdmVzIHVzIGNvbnRyb2wgb3ZlciB3aGVuIHRoZSBzY3JpcHRcbiAgICAgIC8vIGlzIGV4ZWN1dGVkLiBTZWUgaHR0cDovL2phdWJvdXJnLm5ldC8yMDEwLzA3L2xvYWRpbmctc2NyaXB0LWFzLW9uY2xpY2staGFuZGxlci1vZi5odG1sXG4gICAgICBzY3JpcHQuaHRtbEZvciA9IHNjcmlwdC5pZCA9ICdfcmVxd2VzdF8nICsgcmVxSWRcbiAgICB9XG5cbiAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgoc2NyaXB0W3JlYWR5U3RhdGVdICYmIHNjcmlwdFtyZWFkeVN0YXRlXSAhPT0gJ2NvbXBsZXRlJyAmJiBzY3JpcHRbcmVhZHlTdGF0ZV0gIT09ICdsb2FkZWQnKSB8fCBsb2FkZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGxcbiAgICAgIHNjcmlwdC5vbmNsaWNrICYmIHNjcmlwdC5vbmNsaWNrKClcbiAgICAgIC8vIENhbGwgdGhlIHVzZXIgY2FsbGJhY2sgd2l0aCB0aGUgbGFzdCB2YWx1ZSBzdG9yZWQgYW5kIGNsZWFuIHVwIHZhbHVlcyBhbmQgc2NyaXB0cy5cbiAgICAgIGZuKGxhc3RWYWx1ZSlcbiAgICAgIGxhc3RWYWx1ZSA9IHVuZGVmaW5lZFxuICAgICAgaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICBsb2FkZWQgPSAxXG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBzY3JpcHQgdG8gdGhlIERPTSBoZWFkXG4gICAgaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpXG5cbiAgICAvLyBFbmFibGUgSlNPTlAgdGltZW91dFxuICAgIHJldHVybiB7XG4gICAgICBhYm9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGxcbiAgICAgICAgZXJyKHt9LCAnUmVxdWVzdCBpcyBhYm9ydGVkOiB0aW1lb3V0Jywge30pXG4gICAgICAgIGxhc3RWYWx1ZSA9IHVuZGVmaW5lZFxuICAgICAgICBoZWFkLnJlbW92ZUNoaWxkKHNjcmlwdClcbiAgICAgICAgbG9hZGVkID0gMVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlcXVlc3QoZm4sIGVycikge1xuICAgIHZhciBvID0gdGhpcy5vXG4gICAgICAsIG1ldGhvZCA9IChvWydtZXRob2QnXSB8fCAnR0VUJykudG9VcHBlckNhc2UoKVxuICAgICAgLCB1cmwgPSB0eXBlb2YgbyA9PT0gJ3N0cmluZycgPyBvIDogb1sndXJsJ11cbiAgICAgIC8vIGNvbnZlcnQgbm9uLXN0cmluZyBvYmplY3RzIHRvIHF1ZXJ5LXN0cmluZyBmb3JtIHVubGVzcyBvWydwcm9jZXNzRGF0YSddIGlzIGZhbHNlXG4gICAgICAsIGRhdGEgPSAob1sncHJvY2Vzc0RhdGEnXSAhPT0gZmFsc2UgJiYgb1snZGF0YSddICYmIHR5cGVvZiBvWydkYXRhJ10gIT09ICdzdHJpbmcnKVxuICAgICAgICA/IHJlcXdlc3QudG9RdWVyeVN0cmluZyhvWydkYXRhJ10pXG4gICAgICAgIDogKG9bJ2RhdGEnXSB8fCBudWxsKVxuICAgICAgLCBodHRwXG4gICAgICAsIHNlbmRXYWl0ID0gZmFsc2VcblxuICAgIC8vIGlmIHdlJ3JlIHdvcmtpbmcgb24gYSBHRVQgcmVxdWVzdCBhbmQgd2UgaGF2ZSBkYXRhIHRoZW4gd2Ugc2hvdWxkIGFwcGVuZFxuICAgIC8vIHF1ZXJ5IHN0cmluZyB0byBlbmQgb2YgVVJMIGFuZCBub3QgcG9zdCBkYXRhXG4gICAgaWYgKChvWyd0eXBlJ10gPT0gJ2pzb25wJyB8fCBtZXRob2QgPT0gJ0dFVCcpICYmIGRhdGEpIHtcbiAgICAgIHVybCA9IHVybGFwcGVuZCh1cmwsIGRhdGEpXG4gICAgICBkYXRhID0gbnVsbFxuICAgIH1cblxuICAgIGlmIChvWyd0eXBlJ10gPT0gJ2pzb25wJykgcmV0dXJuIGhhbmRsZUpzb25wKG8sIGZuLCBlcnIsIHVybClcblxuICAgIC8vIGdldCB0aGUgeGhyIGZyb20gdGhlIGZhY3RvcnkgaWYgcGFzc2VkXG4gICAgLy8gaWYgdGhlIGZhY3RvcnkgcmV0dXJucyBudWxsLCBmYWxsLWJhY2sgdG8gb3Vyc1xuICAgIGh0dHAgPSAoby54aHIgJiYgby54aHIobykpIHx8IHhocihvKVxuXG4gICAgaHR0cC5vcGVuKG1ldGhvZCwgdXJsLCBvWydhc3luYyddID09PSBmYWxzZSA/IGZhbHNlIDogdHJ1ZSlcbiAgICBzZXRIZWFkZXJzKGh0dHAsIG8pXG4gICAgc2V0Q3JlZGVudGlhbHMoaHR0cCwgbylcbiAgICBpZiAod2luW3hEb21haW5SZXF1ZXN0XSAmJiBodHRwIGluc3RhbmNlb2Ygd2luW3hEb21haW5SZXF1ZXN0XSkge1xuICAgICAgICBodHRwLm9ubG9hZCA9IGZuXG4gICAgICAgIGh0dHAub25lcnJvciA9IGVyclxuICAgICAgICAvLyBOT1RFOiBzZWVcbiAgICAgICAgLy8gaHR0cDovL3NvY2lhbC5tc2RuLm1pY3Jvc29mdC5jb20vRm9ydW1zL2VuLVVTL2lld2ViZGV2ZWxvcG1lbnQvdGhyZWFkLzMwZWYzYWRkLTc2N2MtNDQzNi1iOGE5LWYxY2ExOWI0ODEyZVxuICAgICAgICBodHRwLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbigpIHt9XG4gICAgICAgIHNlbmRXYWl0ID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICBodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZVJlYWR5U3RhdGUodGhpcywgZm4sIGVycilcbiAgICB9XG4gICAgb1snYmVmb3JlJ10gJiYgb1snYmVmb3JlJ10oaHR0cClcbiAgICBpZiAoc2VuZFdhaXQpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBodHRwLnNlbmQoZGF0YSlcbiAgICAgIH0sIDIwMClcbiAgICB9IGVsc2Uge1xuICAgICAgaHR0cC5zZW5kKGRhdGEpXG4gICAgfVxuICAgIHJldHVybiBodHRwXG4gIH1cblxuICBmdW5jdGlvbiBSZXF3ZXN0KG8sIGZuKSB7XG4gICAgdGhpcy5vID0gb1xuICAgIHRoaXMuZm4gPSBmblxuXG4gICAgaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIH1cblxuICBmdW5jdGlvbiBzZXRUeXBlKGhlYWRlcikge1xuICAgIC8vIGpzb24sIGphdmFzY3JpcHQsIHRleHQvcGxhaW4sIHRleHQvaHRtbCwgeG1sXG4gICAgaWYgKGhlYWRlci5tYXRjaCgnanNvbicpKSByZXR1cm4gJ2pzb24nXG4gICAgaWYgKGhlYWRlci5tYXRjaCgnamF2YXNjcmlwdCcpKSByZXR1cm4gJ2pzJ1xuICAgIGlmIChoZWFkZXIubWF0Y2goJ3RleHQnKSkgcmV0dXJuICdodG1sJ1xuICAgIGlmIChoZWFkZXIubWF0Y2goJ3htbCcpKSByZXR1cm4gJ3htbCdcbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQobywgZm4pIHtcblxuICAgIHRoaXMudXJsID0gdHlwZW9mIG8gPT0gJ3N0cmluZycgPyBvIDogb1sndXJsJ11cbiAgICB0aGlzLnRpbWVvdXQgPSBudWxsXG5cbiAgICAvLyB3aGV0aGVyIHJlcXVlc3QgaGFzIGJlZW4gZnVsZmlsbGVkIGZvciBwdXJwb3NlXG4gICAgLy8gb2YgdHJhY2tpbmcgdGhlIFByb21pc2VzXG4gICAgdGhpcy5fZnVsZmlsbGVkID0gZmFsc2VcbiAgICAvLyBzdWNjZXNzIGhhbmRsZXJzXG4gICAgdGhpcy5fc3VjY2Vzc0hhbmRsZXIgPSBmdW5jdGlvbigpe31cbiAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJzID0gW11cbiAgICAvLyBlcnJvciBoYW5kbGVyc1xuICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMgPSBbXVxuICAgIC8vIGNvbXBsZXRlIChib3RoIHN1Y2Nlc3MgYW5kIGZhaWwpIGhhbmRsZXJzXG4gICAgdGhpcy5fY29tcGxldGVIYW5kbGVycyA9IFtdXG4gICAgdGhpcy5fZXJyZWQgPSBmYWxzZVxuICAgIHRoaXMuX3Jlc3BvbnNlQXJncyA9IHt9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgIGZuID0gZm4gfHwgZnVuY3Rpb24gKCkge31cblxuICAgIGlmIChvWyd0aW1lb3V0J10pIHtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmFib3J0KClcbiAgICAgIH0sIG9bJ3RpbWVvdXQnXSlcbiAgICB9XG5cbiAgICBpZiAob1snc3VjY2VzcyddKSB7XG4gICAgICB0aGlzLl9zdWNjZXNzSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb1snc3VjY2VzcyddLmFwcGx5KG8sIGFyZ3VtZW50cylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob1snZXJyb3InXSkge1xuICAgICAgdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb1snZXJyb3InXS5hcHBseShvLCBhcmd1bWVudHMpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChvWydjb21wbGV0ZSddKSB7XG4gICAgICB0aGlzLl9jb21wbGV0ZUhhbmRsZXJzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICBvWydjb21wbGV0ZSddLmFwcGx5KG8sIGFyZ3VtZW50cylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcGxldGUgKHJlc3ApIHtcbiAgICAgIG9bJ3RpbWVvdXQnXSAmJiBjbGVhclRpbWVvdXQoc2VsZi50aW1lb3V0KVxuICAgICAgc2VsZi50aW1lb3V0ID0gbnVsbFxuICAgICAgd2hpbGUgKHNlbGYuX2NvbXBsZXRlSGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBzZWxmLl9jb21wbGV0ZUhhbmRsZXJzLnNoaWZ0KCkocmVzcClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzIChyZXNwKSB7XG4gICAgICB2YXIgdHlwZSA9IG9bJ3R5cGUnXSB8fCByZXNwICYmIHNldFR5cGUocmVzcC5nZXRSZXNwb25zZUhlYWRlcignQ29udGVudC1UeXBlJykpIC8vIHJlc3AgY2FuIGJlIHVuZGVmaW5lZCBpbiBJRVxuICAgICAgcmVzcCA9ICh0eXBlICE9PSAnanNvbnAnKSA/IHNlbGYucmVxdWVzdCA6IHJlc3BcbiAgICAgIC8vIHVzZSBnbG9iYWwgZGF0YSBmaWx0ZXIgb24gcmVzcG9uc2UgdGV4dFxuICAgICAgdmFyIGZpbHRlcmVkUmVzcG9uc2UgPSBnbG9iYWxTZXR1cE9wdGlvbnMuZGF0YUZpbHRlcihyZXNwLnJlc3BvbnNlVGV4dCwgdHlwZSlcbiAgICAgICAgLCByID0gZmlsdGVyZWRSZXNwb25zZVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzcC5yZXNwb25zZVRleHQgPSByXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGNhbid0IGFzc2lnbiB0aGlzIGluIElFPD04LCBqdXN0IGlnbm9yZVxuICAgICAgfVxuICAgICAgaWYgKHIpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ2pzb24nOlxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNwID0gd2luLkpTT04gPyB3aW4uSlNPTi5wYXJzZShyKSA6IGV2YWwoJygnICsgciArICcpJylcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvcihyZXNwLCAnQ291bGQgbm90IHBhcnNlIEpTT04gaW4gcmVzcG9uc2UnLCBlcnIpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2pzJzpcbiAgICAgICAgICByZXNwID0gZXZhbChyKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICAgIHJlc3AgPSByXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAneG1sJzpcbiAgICAgICAgICByZXNwID0gcmVzcC5yZXNwb25zZVhNTFxuICAgICAgICAgICAgICAmJiByZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IgLy8gSUUgdHJvbG9sb1xuICAgICAgICAgICAgICAmJiByZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IuZXJyb3JDb2RlXG4gICAgICAgICAgICAgICYmIHJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvci5yZWFzb25cbiAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgOiByZXNwLnJlc3BvbnNlWE1MXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MucmVzcCA9IHJlc3BcbiAgICAgIHNlbGYuX2Z1bGZpbGxlZCA9IHRydWVcbiAgICAgIGZuKHJlc3ApXG4gICAgICBzZWxmLl9zdWNjZXNzSGFuZGxlcihyZXNwKVxuICAgICAgd2hpbGUgKHNlbGYuX2Z1bGZpbGxtZW50SGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXNwID0gc2VsZi5fZnVsZmlsbG1lbnRIYW5kbGVycy5zaGlmdCgpKHJlc3ApXG4gICAgICB9XG5cbiAgICAgIGNvbXBsZXRlKHJlc3ApXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IocmVzcCwgbXNnLCB0KSB7XG4gICAgICByZXNwID0gc2VsZi5yZXF1ZXN0XG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MucmVzcCA9IHJlc3BcbiAgICAgIHNlbGYuX3Jlc3BvbnNlQXJncy5tc2cgPSBtc2dcbiAgICAgIHNlbGYuX3Jlc3BvbnNlQXJncy50ID0gdFxuICAgICAgc2VsZi5fZXJyZWQgPSB0cnVlXG4gICAgICB3aGlsZSAoc2VsZi5fZXJyb3JIYW5kbGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNlbGYuX2Vycm9ySGFuZGxlcnMuc2hpZnQoKShyZXNwLCBtc2csIHQpXG4gICAgICB9XG4gICAgICBjb21wbGV0ZShyZXNwKVxuICAgIH1cblxuICAgIHRoaXMucmVxdWVzdCA9IGdldFJlcXVlc3QuY2FsbCh0aGlzLCBzdWNjZXNzLCBlcnJvcilcbiAgfVxuXG4gIFJlcXdlc3QucHJvdG90eXBlID0ge1xuICAgIGFib3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLl9hYm9ydGVkID0gdHJ1ZVxuICAgICAgdGhpcy5yZXF1ZXN0LmFib3J0KClcbiAgICB9XG5cbiAgLCByZXRyeTogZnVuY3Rpb24gKCkge1xuICAgICAgaW5pdC5jYWxsKHRoaXMsIHRoaXMubywgdGhpcy5mbilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTbWFsbCBkZXZpYXRpb24gZnJvbSB0aGUgUHJvbWlzZXMgQSBDb21tb25KcyBzcGVjaWZpY2F0aW9uXG4gICAgICogaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvUHJvbWlzZXMvQVxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogYHRoZW5gIHdpbGwgZXhlY3V0ZSB1cG9uIHN1Y2Nlc3NmdWwgcmVxdWVzdHNcbiAgICAgKi9cbiAgLCB0aGVuOiBmdW5jdGlvbiAoc3VjY2VzcywgZmFpbCkge1xuICAgICAgc3VjY2VzcyA9IHN1Y2Nlc3MgfHwgZnVuY3Rpb24gKCkge31cbiAgICAgIGZhaWwgPSBmYWlsIHx8IGZ1bmN0aW9uICgpIHt9XG4gICAgICBpZiAodGhpcy5fZnVsZmlsbGVkKSB7XG4gICAgICAgIHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwID0gc3VjY2Vzcyh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcClcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZXJyZWQpIHtcbiAgICAgICAgZmFpbCh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCwgdGhpcy5fcmVzcG9uc2VBcmdzLm1zZywgdGhpcy5fcmVzcG9uc2VBcmdzLnQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJzLnB1c2goc3VjY2VzcylcbiAgICAgICAgdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGZhaWwpXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGBhbHdheXNgIHdpbGwgZXhlY3V0ZSB3aGV0aGVyIHRoZSByZXF1ZXN0IHN1Y2NlZWRzIG9yIGZhaWxzXG4gICAgICovXG4gICwgYWx3YXlzOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIGlmICh0aGlzLl9mdWxmaWxsZWQgfHwgdGhpcy5fZXJyZWQpIHtcbiAgICAgICAgZm4odGhpcy5fcmVzcG9uc2VBcmdzLnJlc3ApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jb21wbGV0ZUhhbmRsZXJzLnB1c2goZm4pXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGBmYWlsYCB3aWxsIGV4ZWN1dGUgd2hlbiB0aGUgcmVxdWVzdCBmYWlsc1xuICAgICAqL1xuICAsIGZhaWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgaWYgKHRoaXMuX2VycmVkKSB7XG4gICAgICAgIGZuKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwLCB0aGlzLl9yZXNwb25zZUFyZ3MubXNnLCB0aGlzLl9yZXNwb25zZUFyZ3MudClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChmbilcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAsICdjYXRjaCc6IGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIHRoaXMuZmFpbChmbilcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXF3ZXN0KG8sIGZuKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF3ZXN0KG8sIGZuKVxuICB9XG5cbiAgLy8gbm9ybWFsaXplIG5ld2xpbmUgdmFyaWFudHMgYWNjb3JkaW5nIHRvIHNwZWMgLT4gQ1JMRlxuICBmdW5jdGlvbiBub3JtYWxpemUocykge1xuICAgIHJldHVybiBzID8gcy5yZXBsYWNlKC9cXHI/XFxuL2csICdcXHJcXG4nKSA6ICcnXG4gIH1cblxuICBmdW5jdGlvbiBzZXJpYWwoZWwsIGNiKSB7XG4gICAgdmFyIG4gPSBlbC5uYW1lXG4gICAgICAsIHQgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICwgb3B0Q2IgPSBmdW5jdGlvbiAobykge1xuICAgICAgICAgIC8vIElFIGdpdmVzIHZhbHVlPVwiXCIgZXZlbiB3aGVyZSB0aGVyZSBpcyBubyB2YWx1ZSBhdHRyaWJ1dGVcbiAgICAgICAgICAvLyAnc3BlY2lmaWVkJyByZWY6IGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0zLUNvcmUvY29yZS5odG1sI0lELTg2MjUyOTI3M1xuICAgICAgICAgIGlmIChvICYmICFvWydkaXNhYmxlZCddKVxuICAgICAgICAgICAgY2Iobiwgbm9ybWFsaXplKG9bJ2F0dHJpYnV0ZXMnXVsndmFsdWUnXSAmJiBvWydhdHRyaWJ1dGVzJ11bJ3ZhbHVlJ11bJ3NwZWNpZmllZCddID8gb1sndmFsdWUnXSA6IG9bJ3RleHQnXSkpXG4gICAgICAgIH1cbiAgICAgICwgY2gsIHJhLCB2YWwsIGlcblxuICAgIC8vIGRvbid0IHNlcmlhbGl6ZSBlbGVtZW50cyB0aGF0IGFyZSBkaXNhYmxlZCBvciB3aXRob3V0IGEgbmFtZVxuICAgIGlmIChlbC5kaXNhYmxlZCB8fCAhbikgcmV0dXJuXG5cbiAgICBzd2l0Y2ggKHQpIHtcbiAgICBjYXNlICdpbnB1dCc6XG4gICAgICBpZiAoIS9yZXNldHxidXR0b258aW1hZ2V8ZmlsZS9pLnRlc3QoZWwudHlwZSkpIHtcbiAgICAgICAgY2ggPSAvY2hlY2tib3gvaS50ZXN0KGVsLnR5cGUpXG4gICAgICAgIHJhID0gL3JhZGlvL2kudGVzdChlbC50eXBlKVxuICAgICAgICB2YWwgPSBlbC52YWx1ZVxuICAgICAgICAvLyBXZWJLaXQgZ2l2ZXMgdXMgXCJcIiBpbnN0ZWFkIG9mIFwib25cIiBpZiBhIGNoZWNrYm94IGhhcyBubyB2YWx1ZSwgc28gY29ycmVjdCBpdCBoZXJlXG4gICAgICAgIDsoIShjaCB8fCByYSkgfHwgZWwuY2hlY2tlZCkgJiYgY2Iobiwgbm9ybWFsaXplKGNoICYmIHZhbCA9PT0gJycgPyAnb24nIDogdmFsKSlcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndGV4dGFyZWEnOlxuICAgICAgY2Iobiwgbm9ybWFsaXplKGVsLnZhbHVlKSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgIGlmIChlbC50eXBlLnRvTG93ZXJDYXNlKCkgPT09ICdzZWxlY3Qtb25lJykge1xuICAgICAgICBvcHRDYihlbC5zZWxlY3RlZEluZGV4ID49IDAgPyBlbC5vcHRpb25zW2VsLnNlbGVjdGVkSW5kZXhdIDogbnVsbClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGVsLmxlbmd0aCAmJiBpIDwgZWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBlbC5vcHRpb25zW2ldLnNlbGVjdGVkICYmIG9wdENiKGVsLm9wdGlvbnNbaV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgLy8gY29sbGVjdCB1cCBhbGwgZm9ybSBlbGVtZW50cyBmb3VuZCBmcm9tIHRoZSBwYXNzZWQgYXJndW1lbnQgZWxlbWVudHMgYWxsXG4gIC8vIHRoZSB3YXkgZG93biB0byBjaGlsZCBlbGVtZW50czsgcGFzcyBhICc8Zm9ybT4nIG9yIGZvcm0gZmllbGRzLlxuICAvLyBjYWxsZWQgd2l0aCAndGhpcyc9Y2FsbGJhY2sgdG8gdXNlIGZvciBzZXJpYWwoKSBvbiBlYWNoIGVsZW1lbnRcbiAgZnVuY3Rpb24gZWFjaEZvcm1FbGVtZW50KCkge1xuICAgIHZhciBjYiA9IHRoaXNcbiAgICAgICwgZSwgaVxuICAgICAgLCBzZXJpYWxpemVTdWJ0YWdzID0gZnVuY3Rpb24gKGUsIHRhZ3MpIHtcbiAgICAgICAgICB2YXIgaSwgaiwgZmFcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZmEgPSBlW2J5VGFnXSh0YWdzW2ldKVxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGZhLmxlbmd0aDsgaisrKSBzZXJpYWwoZmFbal0sIGNiKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgZSA9IGFyZ3VtZW50c1tpXVxuICAgICAgaWYgKC9pbnB1dHxzZWxlY3R8dGV4dGFyZWEvaS50ZXN0KGUudGFnTmFtZSkpIHNlcmlhbChlLCBjYilcbiAgICAgIHNlcmlhbGl6ZVN1YnRhZ3MoZSwgWyAnaW5wdXQnLCAnc2VsZWN0JywgJ3RleHRhcmVhJyBdKVxuICAgIH1cbiAgfVxuXG4gIC8vIHN0YW5kYXJkIHF1ZXJ5IHN0cmluZyBzdHlsZSBzZXJpYWxpemF0aW9uXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZVF1ZXJ5U3RyaW5nKCkge1xuICAgIHJldHVybiByZXF3ZXN0LnRvUXVlcnlTdHJpbmcocmVxd2VzdC5zZXJpYWxpemVBcnJheS5hcHBseShudWxsLCBhcmd1bWVudHMpKVxuICB9XG5cbiAgLy8geyAnbmFtZSc6ICd2YWx1ZScsIC4uLiB9IHN0eWxlIHNlcmlhbGl6YXRpb25cbiAgZnVuY3Rpb24gc2VyaWFsaXplSGFzaCgpIHtcbiAgICB2YXIgaGFzaCA9IHt9XG4gICAgZWFjaEZvcm1FbGVtZW50LmFwcGx5KGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgaWYgKG5hbWUgaW4gaGFzaCkge1xuICAgICAgICBoYXNoW25hbWVdICYmICFpc0FycmF5KGhhc2hbbmFtZV0pICYmIChoYXNoW25hbWVdID0gW2hhc2hbbmFtZV1dKVxuICAgICAgICBoYXNoW25hbWVdLnB1c2godmFsdWUpXG4gICAgICB9IGVsc2UgaGFzaFtuYW1lXSA9IHZhbHVlXG4gICAgfSwgYXJndW1lbnRzKVxuICAgIHJldHVybiBoYXNoXG4gIH1cblxuICAvLyBbIHsgbmFtZTogJ25hbWUnLCB2YWx1ZTogJ3ZhbHVlJyB9LCAuLi4gXSBzdHlsZSBzZXJpYWxpemF0aW9uXG4gIHJlcXdlc3Quc2VyaWFsaXplQXJyYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyciA9IFtdXG4gICAgZWFjaEZvcm1FbGVtZW50LmFwcGx5KGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgYXJyLnB1c2goe25hbWU6IG5hbWUsIHZhbHVlOiB2YWx1ZX0pXG4gICAgfSwgYXJndW1lbnRzKVxuICAgIHJldHVybiBhcnJcbiAgfVxuXG4gIHJlcXdlc3Quc2VyaWFsaXplID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgICB2YXIgb3B0LCBmblxuICAgICAgLCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuXG4gICAgb3B0ID0gYXJncy5wb3AoKVxuICAgIG9wdCAmJiBvcHQubm9kZVR5cGUgJiYgYXJncy5wdXNoKG9wdCkgJiYgKG9wdCA9IG51bGwpXG4gICAgb3B0ICYmIChvcHQgPSBvcHQudHlwZSlcblxuICAgIGlmIChvcHQgPT0gJ21hcCcpIGZuID0gc2VyaWFsaXplSGFzaFxuICAgIGVsc2UgaWYgKG9wdCA9PSAnYXJyYXknKSBmbiA9IHJlcXdlc3Quc2VyaWFsaXplQXJyYXlcbiAgICBlbHNlIGZuID0gc2VyaWFsaXplUXVlcnlTdHJpbmdcblxuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKVxuICB9XG5cbiAgcmVxd2VzdC50b1F1ZXJ5U3RyaW5nID0gZnVuY3Rpb24gKG8sIHRyYWQpIHtcbiAgICB2YXIgcHJlZml4LCBpXG4gICAgICAsIHRyYWRpdGlvbmFsID0gdHJhZCB8fCBmYWxzZVxuICAgICAgLCBzID0gW11cbiAgICAgICwgZW5jID0gZW5jb2RlVVJJQ29tcG9uZW50XG4gICAgICAsIGFkZCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgLy8gSWYgdmFsdWUgaXMgYSBmdW5jdGlvbiwgaW52b2tlIGl0IGFuZCByZXR1cm4gaXRzIHZhbHVlXG4gICAgICAgICAgdmFsdWUgPSAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHZhbHVlKSA/IHZhbHVlKCkgOiAodmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWUpXG4gICAgICAgICAgc1tzLmxlbmd0aF0gPSBlbmMoa2V5KSArICc9JyArIGVuYyh2YWx1ZSlcbiAgICAgICAgfVxuICAgIC8vIElmIGFuIGFycmF5IHdhcyBwYXNzZWQgaW4sIGFzc3VtZSB0aGF0IGl0IGlzIGFuIGFycmF5IG9mIGZvcm0gZWxlbWVudHMuXG4gICAgaWYgKGlzQXJyYXkobykpIHtcbiAgICAgIGZvciAoaSA9IDA7IG8gJiYgaSA8IG8ubGVuZ3RoOyBpKyspIGFkZChvW2ldWyduYW1lJ10sIG9baV1bJ3ZhbHVlJ10pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRyYWRpdGlvbmFsLCBlbmNvZGUgdGhlIFwib2xkXCIgd2F5ICh0aGUgd2F5IDEuMy4yIG9yIG9sZGVyXG4gICAgICAvLyBkaWQgaXQpLCBvdGhlcndpc2UgZW5jb2RlIHBhcmFtcyByZWN1cnNpdmVseS5cbiAgICAgIGZvciAocHJlZml4IGluIG8pIHtcbiAgICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkocHJlZml4KSkgYnVpbGRQYXJhbXMocHJlZml4LCBvW3ByZWZpeF0sIHRyYWRpdGlvbmFsLCBhZGQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gc3BhY2VzIHNob3VsZCBiZSArIGFjY29yZGluZyB0byBzcGVjXG4gICAgcmV0dXJuIHMuam9pbignJicpLnJlcGxhY2UoLyUyMC9nLCAnKycpXG4gIH1cblxuICBmdW5jdGlvbiBidWlsZFBhcmFtcyhwcmVmaXgsIG9iaiwgdHJhZGl0aW9uYWwsIGFkZCkge1xuICAgIHZhciBuYW1lLCBpLCB2XG4gICAgICAsIHJicmFja2V0ID0gL1xcW1xcXSQvXG5cbiAgICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgICAvLyBTZXJpYWxpemUgYXJyYXkgaXRlbS5cbiAgICAgIGZvciAoaSA9IDA7IG9iaiAmJiBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHYgPSBvYmpbaV1cbiAgICAgICAgaWYgKHRyYWRpdGlvbmFsIHx8IHJicmFja2V0LnRlc3QocHJlZml4KSkge1xuICAgICAgICAgIC8vIFRyZWF0IGVhY2ggYXJyYXkgaXRlbSBhcyBhIHNjYWxhci5cbiAgICAgICAgICBhZGQocHJlZml4LCB2KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJ1aWxkUGFyYW1zKHByZWZpeCArICdbJyArICh0eXBlb2YgdiA9PT0gJ29iamVjdCcgPyBpIDogJycpICsgJ10nLCB2LCB0cmFkaXRpb25hbCwgYWRkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvYmogJiYgb2JqLnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAvLyBTZXJpYWxpemUgb2JqZWN0IGl0ZW0uXG4gICAgICBmb3IgKG5hbWUgaW4gb2JqKSB7XG4gICAgICAgIGJ1aWxkUGFyYW1zKHByZWZpeCArICdbJyArIG5hbWUgKyAnXScsIG9ialtuYW1lXSwgdHJhZGl0aW9uYWwsIGFkZClcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTZXJpYWxpemUgc2NhbGFyIGl0ZW0uXG4gICAgICBhZGQocHJlZml4LCBvYmopXG4gICAgfVxuICB9XG5cbiAgcmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY2FsbGJhY2tQcmVmaXhcbiAgfVxuXG4gIC8vIGpRdWVyeSBhbmQgWmVwdG8gY29tcGF0aWJpbGl0eSwgZGlmZmVyZW5jZXMgY2FuIGJlIHJlbWFwcGVkIGhlcmUgc28geW91IGNhbiBjYWxsXG4gIC8vIC5hamF4LmNvbXBhdChvcHRpb25zLCBjYWxsYmFjaylcbiAgcmVxd2VzdC5jb21wYXQgPSBmdW5jdGlvbiAobywgZm4pIHtcbiAgICBpZiAobykge1xuICAgICAgb1sndHlwZSddICYmIChvWydtZXRob2QnXSA9IG9bJ3R5cGUnXSkgJiYgZGVsZXRlIG9bJ3R5cGUnXVxuICAgICAgb1snZGF0YVR5cGUnXSAmJiAob1sndHlwZSddID0gb1snZGF0YVR5cGUnXSlcbiAgICAgIG9bJ2pzb25wQ2FsbGJhY2snXSAmJiAob1snanNvbnBDYWxsYmFja05hbWUnXSA9IG9bJ2pzb25wQ2FsbGJhY2snXSkgJiYgZGVsZXRlIG9bJ2pzb25wQ2FsbGJhY2snXVxuICAgICAgb1snanNvbnAnXSAmJiAob1snanNvbnBDYWxsYmFjayddID0gb1snanNvbnAnXSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBSZXF3ZXN0KG8sIGZuKVxuICB9XG5cbiAgcmVxd2VzdC5hamF4U2V0dXAgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgZm9yICh2YXIgayBpbiBvcHRpb25zKSB7XG4gICAgICBnbG9iYWxTZXR1cE9wdGlvbnNba10gPSBvcHRpb25zW2tdXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcXdlc3Rcbn0pO1xuIiwidmFyIHJlcXdlc3QgPSByZXF1aXJlKCcuLi92ZW5kb3IvcmVxd2VzdC5taW4nKTtcblxuLy8gXCJodHRwOi8vbG9jYWxob3N0OjMwMDEvc2VhcmNoP3E9YXV0aG9yczolMjJSaWNoYXJkJTIwTWNHcmVnb3IlMjJcIlxuXG5mdW5jdGlvbiBzZXRDb250ZXh0KHBhdGgsIGRpc3BsYXkpIHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShjb250ZXh0S2V5LCBwYXRoKTtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShjb250ZXh0VGl0bGVLZXksIGRpc3BsYXkpO1xufVxuXG52YXIgb25BcnRpY2xlID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICByZXR1cm4gL15cXC9bYS1mMC05XSstKC4qKS8udGVzdChwYXRoKTsgLy8gJzI3YTVlMjg2LTQzMTQtMTFlNC04YTQzLTAwMTQ0ZmVhYmRjMCc7IFxufTtcblxudmFyICQgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59O1xuXG52YXIgZW1pdCA9IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcbiAgICBjb25zb2xlLmxvZygnZW1pdHRpbmcnLCBuYW1lLCBkYXRhKTtcbiAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgICAgZXZlbnQuZGV0YWlsID0gZGF0YTtcbiAgICB9XG4gICAgdG9wLmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxuZnVuY3Rpb24gZXh0cmFjdFNlYXJjaFRlcm0ocXVlcnlTdHJpbmcpIHtcbiAgICByZXR1cm4gcXVlcnlTdHJpbmcubWF0Y2goL3E9KFteJl0qKS8pWzFdO1xufVxuXG52YXIgY29udGV4dEtleSA9ICdmdC5zdHJlYW0uY29udGV4dC51cmwnO1xudmFyIGNvbnRleHRUaXRsZUtleSA9ICdmdC5zdHJlYW0uY29udGV4dC5kaXNwbGF5JztcbnZhciBkaXNwbGF5LCBjb250ZXh0O1xuXG4vKiAxLiBpbiBzdHJlYW0gbW9kZSBzdG9yZSB0aGUgY29udGV4dCBVUkwgYW5kIGNvbnRlbnQgZGlzcGxheSBuYW1lICovXG5pZiAoIW9uQXJ0aWNsZShsb2NhdGlvbi5wYXRobmFtZSkpIHtcbiAgICAvLyBFdmVyeSB0aW1lIHlvdSBoaXQgYSBuZXcgc3RyZWFtLCB5b3UgZW50ZXIgYSBuZXcgY29udGV4dFxuICAgIGNvbnRleHQgPSBleHRyYWN0U2VhcmNoVGVybShsb2NhdGlvbi5zZWFyY2gpO1xuICAgIGRpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdqcy1jb250ZXh0JylbMF0udGV4dENvbnRlbnQudHJpbSgpO1xuICAgIHNldENvbnRleHQoY29udGV4dCwgZGlzcGxheSk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oY29udGV4dFRpdGxlS2V5LCBkaXNwbGF5KTtcbiAgICBlbWl0KCdzdHJlYW06b3BlbicsIHtpZDogY29udGV4dH0pO1xufSBlbHNlIHtcbiAgICBjb250ZXh0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oY29udGV4dEtleSk7XG4gICAgZGlzcGxheSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGNvbnRleHRUaXRsZUtleSk7XG4gICAgaWYoIWNvbnRleHQpIHsgXG4gICAgICAgIC8vSWYgdGhleSBjb21lIGRpcmVjdGx5IHRvIGFuIGFydGljbGUgd2l0aCBubyBoaXN0b3J5LCB1c2UgdGhlIGZpcnN0IHRoZW1lIGZvciB0aGlzIGFydGljbGVcbiAgICAgICAgY29udGV4dCA9IGV4dHJhY3RTZWFyY2hUZXJtKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hcnRpY2xlLWNhcmRfX3RoZW1lcyBhJykuZ2V0QXR0cmlidXRlKCdocmVmJykpO1xuICAgICAgICBkaXNwbGF5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFydGljbGUtY2FyZF9fdGhlbWVzIGEnKS50ZXh0Q29udGVudC50cmltKCk7XG4gICAgICAgIHNldENvbnRleHQoY29udGV4dCwgZGlzcGxheSk7XG4gICAgfVxufVxuXG4vKiAyLiBpbiBhcnRpY2xlIHZpZXcgcmVuZGVyIHRoZSBjb250ZXh0IG1lbnUgZnVsbCBtb2RlICovICAgIFxuaWYgKG9uQXJ0aWNsZShsb2NhdGlvbi5wYXRobmFtZSkgJiYgY29udGV4dCkge1xuICAgICQoJy5qcy1jb250ZXh0JykubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5pbm5lckhUTUwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShjb250ZXh0VGl0bGVLZXkpO1xuICAgIH0pO1xuXG59XG5cbi8qIDMuIHJlcXVlc3QgYW5kIHJlbmRlciB0aGUgY29udGV4dCBuYXZpZ2F0aW9uICovXG5yZXF3ZXN0KHtcbiAgICB1cmw6ICcvY29udGV4dC9zZWFyY2g/cT0nICsgY29udGV4dCwgXG4gICAgY3Jvc3NPcmlnaW46IHRydWUsIFxuICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgJCgnLmpzLWNvbnRleHRfX2NvbnRhaW5lcicpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHZhciBteVRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgbXlUYWcuaW5uZXJIVE1MID0gcmVzO1xuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQobXlUYWcpOyBcbiAgICAgICAgICAgIC8vc2NyaXB0cyB3b250IGV4ZWN1dGUsIHNvIGdyYWIgdGhlbSBhbmQgYXBwZW5kIHRvIGhlYWRcbiAgICAgICAgICAgIHZhciBzY3JpcHRzID0gbXlUYWcucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0Jyk7XG4gICAgICAgICAgICBbXS5zbGljZS5jYWxsKHNjcmlwdHMpLm1hcChmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgICAgICAgIHMuc3JjID0gc2NyaXB0LnNyYztcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHMpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdoYXMtY29udGV4dCcpO1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuIiwiXG52YXIgcmVxd2VzdCA9IHJlcXVpcmUoJy4uLy4uL3ZlbmRvci9yZXF3ZXN0Lm1pbicpO1xuXG4vLyBFbmhhbmNlcyBhbnkgdGlja2VyIHN5bWJvbCBmb3VuZCBvbiB0aGUgcGFnZSB3aXRoIGxpdmUgcHJpY2luZyBkYXRhXG5mdW5jdGlvbiBpbml0ICgpIHtcblxuXG4gICAgY29uc29sZS5sb2coJ3Byb2cgZW5oYW5jZSB0aWNrZXInKTtcblxuICAgIHZhciBob3N0ID0gJ2h0dHA6Ly9uZXh0LWNvbXBhbmllcy1ldC1hbC5oZXJva3VhcHAuY29tL3YxL21vdXNlb3Zlci9jb21wYW55Lyc7XG4gICAgdmFyIHN5bWJvbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYXJ0aWNsZS1jYXJkX190aWNrZXItc3ltYm9sc19faXRlbScpO1xuXG4gICAgW10uc2xpY2UuY2FsbChzeW1ib2xzKS5mb3JFYWNoKGZ1bmN0aW9uIChzeW1ib2wpIHtcbiAgICAgICAgdmFyIGNvZGUgPSBzeW1ib2wuZ2V0QXR0cmlidXRlKCdkYXRhLXRpY2tlci1zeW1ib2xzJyk7XG4gICAgICAgIHJlcXdlc3QoaG9zdCArIGNvZGUsIGZ1bmN0aW9uIChyZXNwKSB7XG4gICAgICAgICAgICAvLyBkaWQgdGhlIG1hcmtldCBwcmljZSBnbyB1cD9cbiAgICAgICAgICAgIHZhciBpc1VwID0gKHBhcnNlRmxvYXQocmVzcC5kYXRhLmxhdGVzdF9jaGFuZ2UucGVyY2VudGFnZSkgPj0gMCkgPyAndXAnIDogJ2Rvd24nOyBcbiAgICAgICAgICAgIHZhciBwcmljZSA9IHJlc3AuZGF0YS5sYXRlc3RfcHJpY2UuYW1vdW50O1xuICAgICAgICAgICAgdmFyIGNoYW5nZSA9IHJlc3AuZGF0YS5sYXRlc3RfY2hhbmdlLnBlcmNlbnRhZ2U7XG4gICAgICAgICAgICBzeW1ib2wuaW5uZXJIVE1MID0gJzxzcGFuIGNsYXNzPVwiYXJ0aWNsZS1jYXJkX190aWNrZXItc3ltYm9sc19faXRlbS0nICsgaXNVcCArICdcIj4nICsgcmVzcC5kYXRhLnJldHVybmVkX3N5bWJvbCArICcgJyArIHByaWNlICsgJyAoJyArIGNoYW5nZSAgKyAnKTwvc3Bhbj4nO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxufVxuXG5pbml0KCk7XG4iLCJ2YXIgcmVxd2VzdCA9IHJlcXVpcmUoJy4uLy4uL3ZlbmRvci9yZXF3ZXN0Lm1pbicpO1xuICAgIFxudmFyICQgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59O1xuXG4kKCcuanMtbW9yZS1vbicpLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgcmVxd2VzdCgnL21vcmUtb24vICcgKyBlbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYXJ0aWNsZS1pZCcpKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgZWwuaW5uZXJIVE1MID0gcmVzcDtcbiAgICAgICAgICAgIGlmICh3aW5kb3cuT3JpZ2FtaSkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5PcmlnYW1pWydvLWRhdGUnXS5pbml0KGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBlbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsKTtcbiAgICAgICAgfSk7XG59KTtcblxuXG5cbiIsIlxuLy8gVEhJUyBXSE9MRSBUSElORyBJUyBBIENBUiBDUkFTSCBBTkQgTkVFRFMgVE8gQkUgU09SVEVEIE9VVFxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uIChldnQpIHtcblxuICAgIHZhciAkID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgICB9O1xuXG4gICAgdmFyIG9uQXJ0aWNsZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHJldHVybiAvXlxcL1thLWYwLTldKy0oLiopLy50ZXN0KHBhdGgpOyAvLyAnMjdhNWUyODYtNDMxNC0xMWU0LThhNDMtMDAxNDRmZWFiZGMwJzsgXG4gICAgfTtcblxuICAgIHZhciBlbWl0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICAgICAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgZXZlbnQuZGV0YWlsID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgICB0b3AuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgfTtcblxuXG4gICAgdmFyIGNvbnRleHRLZXkgPSAnZnQuc3RyZWFtLmNvbnRleHQudXJsJztcbiAgICB2YXIgY29udGV4dFRpdGxlS2V5ID0gJ2Z0LnN0cmVhbS5jb250ZXh0LmRpc3BsYXknO1xuXG4gICAgdmFyIHN0cmVhbVBhdGggPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShjb250ZXh0S2V5KTtcbiAgICB2YXIgc3RyZWFtTmFtZSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGNvbnRleHRUaXRsZUtleSk7XG5cblxuICAgIGZ1bmN0aW9uIHRvZ2dsZShrZXksIGRhdGEsIHNhdmVCdG4pIHtcbiAgICAgICAgdmFyIGlzU2F2ZWQgPSAoc2F2ZUJ0bi5nZXRBdHRyaWJ1dGUoJ2RhdGEtaXMtc2F2ZWQnKSA9PT0gXCJ0cnVlXCIpO1xuICAgICAgICBpZihpc1NhdmVkKSB7XG4gICAgICAgICAgICBlbWl0KGtleSArICc6cmVtb3ZlJywgZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbWl0KGtleSArICc6YWRkJywgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgdG9nZ2xlQnV0dG9uU3RhdGUoc2F2ZUJ0bik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9nZ2xlQnV0dG9uU3RhdGUoc2F2ZUJ0bikge1xuICAgICAgICB2YXIgaXNTYXZlZCA9IChzYXZlQnRuLmdldEF0dHJpYnV0ZSgnZGF0YS1pcy1zYXZlZCcpID09PSBcInRydWVcIik7XG4gICAgICAgIHZhciBleGlzdGluZ1RleHQgPSBzYXZlQnRuLnRleHRDb250ZW50LnRyaW0oKTtcbiAgICAgICAgc2F2ZUJ0bi50ZXh0Q29udGVudCA9IHNhdmVCdG4uZ2V0QXR0cmlidXRlKCdkYXRhLXRvZ2dsZS10ZXh0Jyk7XG4gICAgICAgIHNhdmVCdG4uc2V0QXR0cmlidXRlKCdkYXRhLXRvZ2dsZS10ZXh0JywgZXhpc3RpbmdUZXh0KTtcbiAgICAgICAgc2F2ZUJ0bi5zZXRBdHRyaWJ1dGUoJ2RhdGEtaXMtc2F2ZWQnLCBpc1NhdmVkID8gJ2ZhbHNlJyA6ICd0cnVlJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyaXBMZWFkaW5nU2xhc2gocGF0aCkge1xuICAgICAgICByZXR1cm4gcGF0aC5yZXBsYWNlKC9eXFwvfFxcLyQvZywgJycpO1xuICAgIH1cblxuICAgIC8vT24gY2xpY2sgb2Ygc2F2ZSBidXR0b25zLCB0cmlnZ2VyIHRoZSBhZGQvcmVtb3ZlIGV2ZW50IGFuZCB1cGRhdGUgdGhlIFVJIG9mIHRoZSBidXR0b25cbiAgICAkKCcuanMtc2F2ZV9fYnV0dG9uW2RhdGEtc2F2ZS10YXJnZXQ9XCJmYXZvdXJpdGVzXCJdJykubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0geyAndXVpZHYzJzogc3RyZWFtUGF0aCwgJ2Rpc3BsYXlUZXh0Jzogc3RyZWFtTmFtZSwgJ3Jlc291cmNlVHlwZSc6ICdzdHJlYW0nfTtcbiAgICAgICAgICAgIHRvZ2dsZSgnZmF2b3VyaXRlcycsIGRhdGEsIGVsKTtcblxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgICQoJy5qcy1zYXZlX19idXR0b25bZGF0YS1zYXZlLXRhcmdldD1cImZvcmxhdGVyc1wiXScpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICB2YXIgaGVhZGxpbmUgPSB0aGlzLnBhcmVudEVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYXJ0aWNsZS1jYXJkX19saW5rJylbMF07XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICAndXVpZHYzJzogc3RyaXBMZWFkaW5nU2xhc2goaGVhZGxpbmUuZ2V0QXR0cmlidXRlKCdocmVmJykpLCAvL3JlbW92ZSBsZWFkaW5nIHNsYXNoIFxuICAgICAgICAgICAgICAgICdkaXNwbGF5VGV4dCc6IGhlYWRsaW5lLnRleHRDb250ZW50LnRyaW0oKSwgXG4gICAgICAgICAgICAgICAgJ3Jlc291cmNlVHlwZSc6ICdhcnRpY2xlJyAvL0ZpeCB0byBhcnRpY2xlIGZvciBub3dcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0b2dnbGUoJ2ZvcmxhdGVycycsIGRhdGEsIGVsKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cblxuICAgIC8vT24gcGFnZSBsb2FkLCBqdXN0IHVwZGF0ZSB0aGUgVUkgb2YgdGhlIGJ1dHRvblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Zhdm91cml0ZXM6bG9hZCcsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAkKCcuanMtc2F2ZV9fYnV0dG9uW2RhdGEtc2F2ZS10YXJnZXQ9XCJmYXZvdXJpdGVzXCJdJykubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdmFyIGlzU2F2ZWQgPSBldnQuZGV0YWlsLmV4aXN0cyhzdHJlYW1QYXRoKTtcbiAgICAgICAgICAgIGlmKGlzU2F2ZWQpIHtcbiAgICAgICAgICAgICAgICB0b2dnbGVCdXR0b25TdGF0ZShlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvcmxhdGVyczpsb2FkJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgICQoJy5qcy1zYXZlX19idXR0b25bZGF0YS1zYXZlLXRhcmdldD1cImZvcmxhdGVyc1wiXScpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHZhciBoZWFkbGluZSA9IGVsLnBhcmVudEVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYXJ0aWNsZS1jYXJkX19saW5rJylbMF07XG4gICAgICAgICAgICB2YXIgaXNTYXZlZCA9IGV2dC5kZXRhaWwuZXhpc3RzKHN0cmlwTGVhZGluZ1NsYXNoKGhlYWRsaW5lLmdldEF0dHJpYnV0ZSgnaHJlZicpKSk7XG4gICAgICAgICAgICBpZihpc1NhdmVkKSB7XG4gICAgICAgICAgICAgICAgdG9nZ2xlQnV0dG9uU3RhdGUoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHNhdmVIaXN0b3J5KCkge1xuICAgICAgICB2YXIgZGF0YSwgaGVhZGxpbmU7XG4gICAgICAgIGlmKG9uQXJ0aWNsZShsb2NhdGlvbi5wYXRobmFtZSkpIHtcbiAgICAgICAgICAgIGhlYWRsaW5lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFydGljbGUtY2FyZF9faGVhZGxpbmUgLmFydGljbGUtY2FyZF9fbGluaycpO1xuICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICAndXVpZHYzJzogc3RyaXBMZWFkaW5nU2xhc2goaGVhZGxpbmUuZ2V0QXR0cmlidXRlKCdocmVmJykpLCAvL3JlbW92ZSBsZWFkaW5nIHNsYXNoIFxuICAgICAgICAgICAgICAgICdkaXNwbGF5VGV4dCc6IGhlYWRsaW5lLnRleHRDb250ZW50LnRyaW0oKSwgXG4gICAgICAgICAgICAgICAgJ3Jlc291cmNlVHlwZSc6ICdhcnRpY2xlJyAvL0ZpeCB0byBhcnRpY2xlIGZvciBub3dcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0geyAndXVpZHYzJzogc3RyZWFtUGF0aCwgJ2Rpc3BsYXlUZXh0Jzogc3RyZWFtTmFtZSwgJ3Jlc291cmNlVHlwZSc6ICdzdHJlYW0nfTtcbiAgICAgICAgfVxuICAgICAgICBlbWl0KCdoaXN0b3J5OmFkZCcsIGRhdGEpO1xuICAgIH1cblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2hpc3Rvcnk6bG9hZCcsIHNhdmVIaXN0b3J5KTtcblxufSk7XG5cblxuIiwiXG5cbihmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZW1pdCA9IGZ1bmN0aW9uKG5hbWUsIGRhdGEpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2VtaXR0aW5nJywgbmFtZSwgZGF0YSk7XG4gICAgICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgICAgICBldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICBldmVudC5kZXRhaWwgPSBkYXRhO1xuICAgICAgICB9XG4gICAgICAgIHRvcC5kb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgICAgIHZhciB0aW1lb3V0O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoIWltbWVkaWF0ZSkgZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgICAgICAgIGlmIChjYWxsTm93KSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbmRBbmNlc3RvckJ5Q2xhc3NOYW1lIChlbCwgY2xzKSB7XG4gICAgICAgIHdoaWxlICgoZWwgPSBlbC5wYXJlbnROb2RlKSAmJiAhaGFzQ2xhc3MoZWwsIGNscykpIHtcbiAgICAgICAgICAgIHJldHVybiBlbDsgICAgXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgJCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG4gICAgfTtcblxuICAgIC8vIFJlbG9hZCB0aGUgc3RyZWFtIHdoZW4gYW4gaW5kZXg6b3BlbiBldmVudCBpcyBmaXJlZFxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2luZGV4Om9wZW4nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBsb2NhdGlvbi5ocmVmID0gJy9zdHJlYW0vJyArIGUuZGV0YWlsLnN0cmVhbTtcbiAgICB9KTtcblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2luZGV4OmNhcGknLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcjY2FwaS0nICsgZS5kZXRhaWwuY2FwaTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGhhc0NsYXNzKGVsLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKCcoXFxcXHN8XiknK25hbWUrJyhcXFxcc3wkKScpLnRlc3QoZWwuY2xhc3NOYW1lKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRDbGFzcyhlbCwgbmFtZSkge1xuICAgICAgICBpZiAoIWhhc0NsYXNzKGVsLCBuYW1lKSkgeyBlbC5jbGFzc05hbWUgKz0gKGVsLmNsYXNzTmFtZSA/ICcgJyA6ICcnKSArbmFtZTsgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsLCBuYW1lKSB7XG4gICAgICAgIGlmIChoYXNDbGFzcyhlbCwgbmFtZSkpIHtcbiAgICAgICAgICAgIGVsLmNsYXNzTmFtZT1lbC5jbGFzc05hbWUucmVwbGFjZShuZXcgUmVnRXhwKCcoXFxcXHN8XiknK25hbWUrJyhcXFxcc3wkKScpLCcgJykucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoZWwsIG5hbWUpIHtcbiAgICAgICAgaWYgKGhhc0NsYXNzKGVsLCBuYW1lKSkgcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpO1xuICAgICAgICBlbHNlIGFkZENsYXNzKGVsLCBuYW1lKTtcbiAgICB9XG5cbiAgICAvKiBBbGxvdyBhbGwgYXJ0aWNsZXMgdG8gYmUgb3BlbmVkIGlubGluZSAqL1xuICAgIC8vVE9ETzogdGhpcyB3aWxsIGludGVyYWN0IHdpdGggc2luZ2xlLWFydGljbGUgdG9nZ2xlIGJlbG93O1xuICAgIC8vbmVlZHMgYSByZWZhY3RvciB3aGVuIHJlLWltcGxlbWVudGVkXG4gICAgJCgnLmFydGljbGUtY2FyZF9fbW9yZS5qcy10b2dnbGUnKS5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgdG9nZ2xlQ2xhc3MoZWwsICdqcy1hY3RpdmUnKTtcbiAgICAgICAgICAgIGVsLnRleHRDb250ZW50ID0gaGFzQ2xhc3MoZWwsICdqcy1hY3RpdmUnKSA/ICdDbG9zZScgOiAnT3Blbic7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG9nZ2xlJyk7XG4gICAgICAgICAgICAkKHRhcmdldCkubWFwKGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgICAgICAgICB0b2dnbGVDbGFzcyhlbG0sICdqcy1zaG93Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKiBBbGxvdyBzaW5nbGUgYXJ0aWNsZSB0byBiZSBvcGVuZWQgaW5saW5lICovXG4gICAgJCgnLmFydGljbGUtY2FyZF9fZXhwYW5kLmpzLXRvZ2dsZScpLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLmdldEF0dHJpYnV0ZSgnZGF0YS10b2dnbGUnKSxcbiAgICAgICAgICAgICAgICBhcnRpY2xlID0gZmluZEFuY2VzdG9yQnlDbGFzc05hbWUoZWwsIHRhcmdldCksXG4gICAgICAgICAgICAgICAgaWNvbiA9IGVsLnF1ZXJ5U2VsZWN0b3IoJ2knKTtcbiAgICAgICAgICAgIHRvZ2dsZUNsYXNzKGljb24sICdpY29uLWFycm93LXVwJyk7XG4gICAgICAgICAgICB0b2dnbGVDbGFzcyhpY29uLCAnaWNvbi1hcnJvdy1kb3duJyk7XG4gICAgICAgICAgICB0b2dnbGVDbGFzcyhhcnRpY2xlLnF1ZXJ5U2VsZWN0b3IodGFyZ2V0KSwgJ2pzLXNob3cnKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgdmFyIHRyYWNrcyA9ICQoJy5hcnRpY2xlLWNhcmRfX2hlYWRsaW5lJyk7XG5cbiAgICBmdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0IChlbCkge1xuICAgICAgICB2YXIgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICByZXR1cm4gKFxuXG4gICAgICAgICAgICAvLyBGSVhNRSBpcyAyNSUgZnJvbSB0aGUgdG9wXG4gICAgICAgICAgICByZWN0LnRvcCA+PSAwICYmXG4gICAgICAgICAgICByZWN0LmxlZnQgPj0gMCAmJlxuICAgICAgICAgICAgcmVjdC5ib3R0b20gPD0gKHdpbmRvdy5pbm5lckhlaWdodCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0KSAmJiAvKm9yICQod2luZG93KS5oZWlnaHQoKSAqL1xuICAgICAgICAgICAgcmVjdC5yaWdodCA8PSAod2luZG93LmlubmVyV2lkdGggfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoKSAvKm9yICQod2luZG93KS53aWR0aCgpICovXG4gICAgICAgICAgICApO1xuICAgIH1cblxuICAgIHZhciByZWFkYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIElEIG9mIHRoZSB1cHBlcm1vc3QgaGVhZGxpbmUgaW4gdGhlIHZpZXdwb3J0XG4gICAgICAgIHZhciBpblZpZXcgPSB0cmFja3MuZmlsdGVyKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgcmV0dXJuIGlzRWxlbWVudEluVmlld3BvcnQoZWwpO1xuICAgICAgICB9KS5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gZWwucGFyZW50Tm9kZS5pZDtcbiAgICAgICAgfSlbMF07XG5cbiAgICAgICAgaWYgKGluVmlldyAmJiBpblZpZXcubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZW1pdCgnc3RyZWFtOmludmlldycsIHsgY2FwaTogaW5WaWV3ICB9ICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgd2luZG93Lm9uc2Nyb2xsID0gZGVib3VuY2UocmVhZGFibGUsIDUsIGZhbHNlKTtcblxufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcXdlc3QgPSByZXF1aXJlKCcuLi92ZW5kb3IvcmVxd2VzdC5taW4nKTtcblxuXG52YXIgJCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgIHJldHVybiBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbn07XG5cblxuJCgndmlkZW8nKS5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuXG5cblx0cmVxd2VzdCgnaHR0cDovL2Z0LW5leHQtYnJpZ2h0Y292ZS1wcm94eS1hcGkuaGVyb2t1YXBwLmNvbS8nICsgZWwuZ2V0QXR0cmlidXRlKCdkYXRhLWJyaWdodGNvdmUtcmVmJykpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcblx0XHRcdHZhciBkYXRhID0gSlNPTi5wYXJzZShyZXNwKTtcblx0XHQgIFx0ZWwuc3JjID0gZGF0YS5yZW5kaXRpb25zWzBdLnVybDtcblx0XHR9LCBmdW5jdGlvbiAoKSB7XG5cdFx0ICBcdGNvbnNvbGUubG9nKCdlcnJvcjogJywgYXJndW1lbnRzKTtcblx0XHR9KTtcbn0pO1xuXG5cbiIsInJlcXVpcmUoXCIuLy4uL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC1oZWFkZXIvbWFpbi5qc1wiKTtcbnJlcXVpcmUoJy4vY29tcG9uZW50cy9jb250ZXh0Jyk7XG5yZXF1aXJlKCcuL2NvbXBvbmVudHMvc2F2ZS1idXR0b24vbWFpbicpO1xucmVxdWlyZSgnLi9jb21wb25lbnRzL21vcmUtb24vbWFpbicpO1xucmVxdWlyZSgnLi9jb21wb25lbnRzL2xpdmUtcHJpY2VzL21haW4nKTtcbnJlcXVpcmUoJy4vY29tcG9uZW50cy92aWRlbycpO1xucmVxdWlyZSgnLi9jb21wb25lbnRzL3N0cmVhbS9tYWluJyk7XG5cbnZhciBSYXZlbiA9IHJlcXVpcmUoXCIuLy4uL2Jvd2VyX2NvbXBvbmVudHMvcmF2ZW4tanMvZGlzdC9yYXZlbi5qc1wiKS5SYXZlbjtcblxuUmF2ZW4uY29uZmlnKCdodHRwczovLzE0MzA3MDQ3NjZhODQwYjRiMzYxMzM2NjIzMjRmNDg5QGFwcC5nZXRzZW50cnkuY29tLzMyMjgzJywge1xuICAgIHdoaXRlbGlzdFVybHM6IFsnbmV4dC5mdC5jb20vZG9iaS8nXVxufSkuaW5zdGFsbCgpOyJdfQ==
