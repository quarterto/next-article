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
var myFt = document.querySelector('.o-header__secondary--myft-js')
var defaultPanel = header.getAttribute('data-default-panel');
var delegate = new Delegate(header);
var bodyDelegate = new Delegate();
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

document.addEventListener('notifications:new', function(e) {
	var total = 0, 
			notifications = e.detail,
			myFTButton = header.querySelector('.o-header-button-js[data-target-panel="myft"]');
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

},{"./../dom-delegate/lib/delegate.js":1,"./../next-user-preferences/src/main.js":6,"./../reqwest/reqwest.js":8}],3:[function(require,module,exports){
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


},{"../vendor/reqwest.min":7}],4:[function(require,module,exports){
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
	setInterval(this.poll.bind(this), 1000 * 60 * 0.5); //30 second polling
	this.notifications = {};

	//Clear notifications if a stream has been openend
	this.currentStream = getCurrentStream();
	this.opened = false; //whethere these notifications have been opened or not
	if(this.currentStream) {
		this.clear(this.currentStream);
	}

	this.poll();

}


NotificationPoller.prototype.poll = function() {
	var poller = this;
	var notificationPromises = [];
	this.userPreferenceList.list.get().forEach(function(stream) {
		//don't bother fetching if you are on that stream currently

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
				if(!poller.opened && stream.uuidv3 === poller.currentStream) {
					poller.opened = true;
					emit('notifications:opened', { uuidv3: stream.uuidv3, notifications: notifications });
					poller.clear();
				} else {
					poller.notifications[stream.uuidv3] = notifications;
				}

			} else {
				delete poller.notifications[stream.uuidv3];
			}
			poller.render();
		}));
	});

	Promise.all(notificationPromises).then(function(streamNotifications) {
		if(poller.notifications) {
			emit('notifications:new', poller.notifications);
		}
	});
};

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
},{"../vendor/reqwest.min":7}],5:[function(require,module,exports){
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

},{"./Me":3,"./NotificationPoller":4}],6:[function(require,module,exports){
var UserPreferenceList = require('./lib/UserPreferenceList');

module.exports = UserPreferenceList;
},{"./lib/UserPreferenceList":5}],7:[function(require,module,exports){
/*!
  * Reqwest! A general purpose XHR connection manager
  * license MIT (c) Dustin Diaz 2014
  * https://github.com/ded/reqwest
  */
!function(e,t,n){typeof module!="undefined"&&module.exports?module.exports=n():typeof define=="function"&&define.amd?define(n):t[e]=n()}("reqwest",this,function(){function succeed(e){return httpsRe.test(window.location.protocol)?twoHundo.test(e.status):!!e.response}function handleReadyState(e,t,n){return function(){if(e._aborted)return n(e.request);e.request&&e.request[readyState]==4&&(e.request.onreadystatechange=noop,succeed(e.request)?t(e.request):n(e.request))}}function setHeaders(e,t){var n=t.headers||{},r;n.Accept=n.Accept||defaultHeaders.accept[t.type]||defaultHeaders.accept["*"];var i=typeof FormData=="function"&&t.data instanceof FormData;!t.crossOrigin&&!n[requestedWith]&&(n[requestedWith]=defaultHeaders.requestedWith),!n[contentType]&&!i&&(n[contentType]=t.contentType||defaultHeaders.contentType);for(r in n)n.hasOwnProperty(r)&&"setRequestHeader"in e&&e.setRequestHeader(r,n[r])}function setCredentials(e,t){typeof t.withCredentials!="undefined"&&typeof e.withCredentials!="undefined"&&(e.withCredentials=!!t.withCredentials)}function generalCallback(e){lastValue=e}function urlappend(e,t){return e+(/\?/.test(e)?"&":"?")+t}function handleJsonp(e,t,n,r){var i=uniqid++,s=e.jsonpCallback||"callback",o=e.jsonpCallbackName||reqwest.getcallbackPrefix(i),u=new RegExp("((^|\\?|&)"+s+")=([^&]+)"),a=r.match(u),f=doc.createElement("script"),l=0,c=navigator.userAgent.indexOf("MSIE 10.0")!==-1;return a?a[3]==="?"?r=r.replace(u,"$1="+o):o=a[3]:r=urlappend(r,s+"="+o),win[o]=generalCallback,f.type="text/javascript",f.src=r,f.async=!0,typeof f.onreadystatechange!="undefined"&&!c&&(f.htmlFor=f.id="_reqwest_"+i),f.onload=f.onreadystatechange=function(){if(f[readyState]&&f[readyState]!=="complete"&&f[readyState]!=="loaded"||l)return!1;f.onload=f.onreadystatechange=null,f.onclick&&f.onclick(),t(lastValue),lastValue=undefined,head.removeChild(f),l=1},head.appendChild(f),{abort:function(){f.onload=f.onreadystatechange=null,n({},"Request is aborted: timeout",{}),lastValue=undefined,head.removeChild(f),l=1}}}function getRequest(e,t){var n=this.o,r=(n.method||"GET").toUpperCase(),i=typeof n=="string"?n:n.url,s=n.processData!==!1&&n.data&&typeof n.data!="string"?reqwest.toQueryString(n.data):n.data||null,o,u=!1;return(n["type"]=="jsonp"||r=="GET")&&s&&(i=urlappend(i,s),s=null),n["type"]=="jsonp"?handleJsonp(n,e,t,i):(o=n.xhr&&n.xhr(n)||xhr(n),o.open(r,i,n.async===!1?!1:!0),setHeaders(o,n),setCredentials(o,n),win[xDomainRequest]&&o instanceof win[xDomainRequest]?(o.onload=e,o.onerror=t,o.onprogress=function(){},u=!0):o.onreadystatechange=handleReadyState(this,e,t),n.before&&n.before(o),u?setTimeout(function(){o.send(s)},200):o.send(s),o)}function Reqwest(e,t){this.o=e,this.fn=t,init.apply(this,arguments)}function setType(e){if(e.match("json"))return"json";if(e.match("javascript"))return"js";if(e.match("text"))return"html";if(e.match("xml"))return"xml"}function init(o,fn){function complete(e){o.timeout&&clearTimeout(self.timeout),self.timeout=null;while(self._completeHandlers.length>0)self._completeHandlers.shift()(e)}function success(resp){var type=o.type||setType(resp.getResponseHeader("Content-Type"));resp=type!=="jsonp"?self.request:resp;var filteredResponse=globalSetupOptions.dataFilter(resp.responseText,type),r=filteredResponse;try{resp.responseText=r}catch(e){}if(r)switch(type){case"json":try{resp=win.JSON?win.JSON.parse(r):eval("("+r+")")}catch(err){return error(resp,"Could not parse JSON in response",err)}break;case"js":resp=eval(r);break;case"html":resp=r;break;case"xml":resp=resp.responseXML&&resp.responseXML.parseError&&resp.responseXML.parseError.errorCode&&resp.responseXML.parseError.reason?null:resp.responseXML}self._responseArgs.resp=resp,self._fulfilled=!0,fn(resp),self._successHandler(resp);while(self._fulfillmentHandlers.length>0)resp=self._fulfillmentHandlers.shift()(resp);complete(resp)}function error(e,t,n){e=self.request,self._responseArgs.resp=e,self._responseArgs.msg=t,self._responseArgs.t=n,self._erred=!0;while(self._errorHandlers.length>0)self._errorHandlers.shift()(e,t,n);complete(e)}this.url=typeof o=="string"?o:o.url,this.timeout=null,this._fulfilled=!1,this._successHandler=function(){},this._fulfillmentHandlers=[],this._errorHandlers=[],this._completeHandlers=[],this._erred=!1,this._responseArgs={};var self=this;fn=fn||function(){},o.timeout&&(this.timeout=setTimeout(function(){self.abort()},o.timeout)),o.success&&(this._successHandler=function(){o.success.apply(o,arguments)}),o.error&&this._errorHandlers.push(function(){o.error.apply(o,arguments)}),o.complete&&this._completeHandlers.push(function(){o.complete.apply(o,arguments)}),this.request=getRequest.call(this,success,error)}function reqwest(e,t){return new Reqwest(e,t)}function normalize(e){return e?e.replace(/\r?\n/g,"\r\n"):""}function serial(e,t){var n=e.name,r=e.tagName.toLowerCase(),i=function(e){e&&!e.disabled&&t(n,normalize(e.attributes.value&&e.attributes.value.specified?e.value:e.text))},s,o,u,a;if(e.disabled||!n)return;switch(r){case"input":/reset|button|image|file/i.test(e.type)||(s=/checkbox/i.test(e.type),o=/radio/i.test(e.type),u=e.value,(!s&&!o||e.checked)&&t(n,normalize(s&&u===""?"on":u)));break;case"textarea":t(n,normalize(e.value));break;case"select":if(e.type.toLowerCase()==="select-one")i(e.selectedIndex>=0?e.options[e.selectedIndex]:null);else for(a=0;e.length&&a<e.length;a++)e.options[a].selected&&i(e.options[a])}}function eachFormElement(){var e=this,t,n,r=function(t,n){var r,i,s;for(r=0;r<n.length;r++){s=t[byTag](n[r]);for(i=0;i<s.length;i++)serial(s[i],e)}};for(n=0;n<arguments.length;n++)t=arguments[n],/input|select|textarea/i.test(t.tagName)&&serial(t,e),r(t,["input","select","textarea"])}function serializeQueryString(){return reqwest.toQueryString(reqwest.serializeArray.apply(null,arguments))}function serializeHash(){var e={};return eachFormElement.apply(function(t,n){t in e?(e[t]&&!isArray(e[t])&&(e[t]=[e[t]]),e[t].push(n)):e[t]=n},arguments),e}function buildParams(e,t,n,r){var i,s,o,u=/\[\]$/;if(isArray(t))for(s=0;t&&s<t.length;s++)o=t[s],n||u.test(e)?r(e,o):buildParams(e+"["+(typeof o=="object"?s:"")+"]",o,n,r);else if(t&&t.toString()==="[object Object]")for(i in t)buildParams(e+"["+i+"]",t[i],n,r);else r(e,t)}var win=window,doc=document,httpsRe=/^http/,twoHundo=/^(20\d|1223)$/,byTag="getElementsByTagName",readyState="readyState",contentType="Content-Type",requestedWith="X-Requested-With",head=doc[byTag]("head")[0],uniqid=0,callbackPrefix="reqwest_"+ +(new Date),lastValue,xmlHttpRequest="XMLHttpRequest",xDomainRequest="XDomainRequest",noop=function(){},isArray=typeof Array.isArray=="function"?Array.isArray:function(e){return e instanceof Array},defaultHeaders={contentType:"application/x-www-form-urlencoded",requestedWith:xmlHttpRequest,accept:{"*":"text/javascript, text/html, application/xml, text/xml, */*",xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript",js:"application/javascript, text/javascript"}},xhr=function(e){if(e.crossOrigin===!0){var t=win[xmlHttpRequest]?new XMLHttpRequest:null;if(t&&"withCredentials"in t)return t;if(win[xDomainRequest])return new XDomainRequest;throw new Error("Browser does not support cross-origin requests")}return win[xmlHttpRequest]?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP")},globalSetupOptions={dataFilter:function(e){return e}};return Reqwest.prototype={abort:function(){this._aborted=!0,this.request.abort()},retry:function(){init.call(this,this.o,this.fn)},then:function(e,t){return e=e||function(){},t=t||function(){},this._fulfilled?this._responseArgs.resp=e(this._responseArgs.resp):this._erred?t(this._responseArgs.resp,this._responseArgs.msg,this._responseArgs.t):(this._fulfillmentHandlers.push(e),this._errorHandlers.push(t)),this},always:function(e){return this._fulfilled||this._erred?e(this._responseArgs.resp):this._completeHandlers.push(e),this},fail:function(e){return this._erred?e(this._responseArgs.resp,this._responseArgs.msg,this._responseArgs.t):this._errorHandlers.push(e),this},"catch":function(e){return this.fail(e)}},reqwest.serializeArray=function(){var e=[];return eachFormElement.apply(function(t,n){e.push({name:t,value:n})},arguments),e},reqwest.serialize=function(){if(arguments.length===0)return"";var e,t,n=Array.prototype.slice.call(arguments,0);return e=n.pop(),e&&e.nodeType&&n.push(e)&&(e=null),e&&(e=e.type),e=="map"?t=serializeHash:e=="array"?t=reqwest.serializeArray:t=serializeQueryString,t.apply(null,n)},reqwest.toQueryString=function(e,t){var n,r,i=t||!1,s=[],o=encodeURIComponent,u=function(e,t){t="function"==typeof t?t():t==null?"":t,s[s.length]=o(e)+"="+o(t)};if(isArray(e))for(r=0;e&&r<e.length;r++)u(e[r].name,e[r].value);else for(n in e)e.hasOwnProperty(n)&&buildParams(n,e[n],i,u);return s.join("&").replace(/%20/g,"+")},reqwest.getcallbackPrefix=function(){return callbackPrefix},reqwest.compat=function(e,t){return e&&(e.type&&(e.method=e.type)&&delete e.type,e.dataType&&(e.type=e.dataType),e.jsonpCallback&&(e.jsonpCallbackName=e.jsonpCallback)&&delete e.jsonpCallback,e.jsonp&&(e.jsonpCallback=e.jsonp)),new Reqwest(e,t)},reqwest.ajaxSetup=function(e){e=e||{};for(var t in e)globalSetupOptions[t]=e[t]},reqwest})
},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
var header = require("./../bower_components/next-header/main.js");

},{"./../bower_components/next-header/main.js":2}]},{},[9])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9yaHlzLmV2YW5zL1NpdGVzL25leHQvZG9iaS9ub2RlX21vZHVsZXMvb3JpZ2FtaS1idWlsZC10b29scy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL3JoeXMuZXZhbnMvU2l0ZXMvbmV4dC9kb2JpL2Jvd2VyX2NvbXBvbmVudHMvZG9tLWRlbGVnYXRlL2xpYi9kZWxlZ2F0ZS5qcyIsIi9Vc2Vycy9yaHlzLmV2YW5zL1NpdGVzL25leHQvZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtaGVhZGVyL21haW4uanMiLCIvVXNlcnMvcmh5cy5ldmFucy9TaXRlcy9uZXh0L2RvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL2xpYi9NZS5qcyIsIi9Vc2Vycy9yaHlzLmV2YW5zL1NpdGVzL25leHQvZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbGliL05vdGlmaWNhdGlvblBvbGxlci5qcyIsIi9Vc2Vycy9yaHlzLmV2YW5zL1NpdGVzL25leHQvZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbGliL1VzZXJQcmVmZXJlbmNlTGlzdC5qcyIsIi9Vc2Vycy9yaHlzLmV2YW5zL1NpdGVzL25leHQvZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbWFpbi5qcyIsIi9Vc2Vycy9yaHlzLmV2YW5zL1NpdGVzL25leHQvZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvdmVuZG9yL3JlcXdlc3QubWluLmpzIiwiL1VzZXJzL3JoeXMuZXZhbnMvU2l0ZXMvbmV4dC9kb2JpL2Jvd2VyX2NvbXBvbmVudHMvcmVxd2VzdC9yZXF3ZXN0LmpzIiwiL1VzZXJzL3JoeXMuZXZhbnMvU2l0ZXMvbmV4dC9kb2JpL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ptQkE7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmpzaGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBEZWxlZ2F0ZTtcblxuLyoqXG4gKiBET00gZXZlbnQgZGVsZWdhdG9yXG4gKlxuICogVGhlIGRlbGVnYXRvciB3aWxsIGxpc3RlblxuICogZm9yIGV2ZW50cyB0aGF0IGJ1YmJsZSB1cFxuICogdG8gdGhlIHJvb3Qgbm9kZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqL1xuZnVuY3Rpb24gRGVsZWdhdGUocm9vdCkge1xuXG4gIC8qKlxuICAgKiBNYWludGFpbiBhIG1hcCBvZiBsaXN0ZW5lclxuICAgKiBsaXN0cywga2V5ZWQgYnkgZXZlbnQgbmFtZS5cbiAgICpcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICB0aGlzLmxpc3RlbmVyTWFwID0gW3t9LCB7fV07XG4gIGlmIChyb290KSB7XG4gICAgdGhpcy5yb290KHJvb3QpO1xuICB9XG5cbiAgLyoqIEB0eXBlIGZ1bmN0aW9uKCkgKi9cbiAgdGhpcy5oYW5kbGUgPSBEZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlLmJpbmQodGhpcyk7XG59XG5cbi8qKlxuICogU3RhcnQgbGlzdGVuaW5nIGZvciBldmVudHNcbiAqIG9uIHRoZSBwcm92aWRlZCBET00gZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUucm9vdCA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgdmFyIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcDtcbiAgdmFyIGV2ZW50VHlwZTtcblxuICAvLyBSZW1vdmUgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzFdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMV0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXBbMF0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIG5vIHJvb3Qgb3Igcm9vdCBpcyBub3RcbiAgLy8gYSBkb20gbm9kZSwgdGhlbiByZW1vdmUgaW50ZXJuYWxcbiAgLy8gcm9vdCByZWZlcmVuY2UgYW5kIGV4aXQgaGVyZVxuICBpZiAoIXJvb3QgfHwgIXJvb3QuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICBkZWxldGUgdGhpcy5yb290RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHJvb3Qgbm9kZSBhdCB3aGljaFxuICAgKiBsaXN0ZW5lcnMgYXJlIGF0dGFjaGVkLlxuICAgKlxuICAgKiBAdHlwZSBOb2RlXG4gICAqL1xuICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdDtcblxuICAvLyBTZXQgdXAgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFsxXSkge1xuICAgIGlmIChsaXN0ZW5lck1hcFsxXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG4gIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwWzBdKSB7XG4gICAgaWYgKGxpc3RlbmVyTWFwWzBdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmNhcHR1cmVGb3JUeXBlID0gZnVuY3Rpb24oZXZlbnRUeXBlKSB7XG4gIHJldHVybiBbJ2JsdXInLCAnZXJyb3InLCAnZm9jdXMnLCAnbG9hZCcsICdyZXNpemUnLCAnc2Nyb2xsJ10uaW5kZXhPZihldmVudFR5cGUpICE9PSAtMTtcbn07XG5cbi8qKlxuICogQXR0YWNoIGEgaGFuZGxlciB0byBvbmVcbiAqIGV2ZW50IGZvciBhbGwgZWxlbWVudHNcbiAqIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9yLFxuICogbm93IG9yIGluIHRoZSBmdXR1cmVcbiAqXG4gKiBUaGUgaGFuZGxlciBmdW5jdGlvbiByZWNlaXZlc1xuICogdGhyZWUgYXJndW1lbnRzOiB0aGUgRE9NIGV2ZW50XG4gKiBvYmplY3QsIHRoZSBub2RlIHRoYXQgbWF0Y2hlZFxuICogdGhlIHNlbGVjdG9yIHdoaWxlIHRoZSBldmVudFxuICogd2FzIGJ1YmJsaW5nIGFuZCBhIHJlZmVyZW5jZVxuICogdG8gaXRzZWxmLiBXaXRoaW4gdGhlIGhhbmRsZXIsXG4gKiAndGhpcycgaXMgZXF1YWwgdG8gdGhlIHNlY29uZFxuICogYXJndW1lbnQuXG4gKlxuICogVGhlIG5vZGUgdGhhdCBhY3R1YWxseSByZWNlaXZlZFxuICogdGhlIGV2ZW50IGNhbiBiZSBhY2Nlc3NlZCB2aWFcbiAqICdldmVudC50YXJnZXQnLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgTGlzdGVuIGZvciB0aGVzZSBldmVudHNcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gc2VsZWN0b3IgT25seSBoYW5kbGUgZXZlbnRzIG9uIGVsZW1lbnRzIG1hdGNoaW5nIHRoaXMgc2VsZWN0b3IsIGlmIHVuZGVmaW5lZCBtYXRjaCByb290IGVsZW1lbnRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gaGFuZGxlciBIYW5kbGVyIGZ1bmN0aW9uIC0gZXZlbnQgZGF0YSBwYXNzZWQgaGVyZSB3aWxsIGJlIGluIGV2ZW50LmRhdGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXZlbnREYXRhXSBEYXRhIHRvIHBhc3MgaW4gZXZlbnQuZGF0YVxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgcm9vdCwgbGlzdGVuZXJNYXAsIG1hdGNoZXIsIG1hdGNoZXJQYXJhbTtcblxuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgZXZlbnQgdHlwZTogJyArIGV2ZW50VHlwZSk7XG4gIH1cblxuICAvLyBoYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIHNlbnNpYmxlIGRlZmF1bHRzXG4gIC8vIGlmIHVzZUNhcHR1cmUgbm90IHNldFxuICBpZiAodXNlQ2FwdHVyZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdXNlQ2FwdHVyZSA9IHRoaXMuY2FwdHVyZUZvclR5cGUoZXZlbnRUeXBlKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0hhbmRsZXIgbXVzdCBiZSBhIHR5cGUgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXBbdXNlQ2FwdHVyZSA/IDEgOiAwXTtcblxuICAvLyBBZGQgbWFzdGVyIGhhbmRsZXIgZm9yIHR5cGUgaWYgbm90IGNyZWF0ZWQgeWV0XG4gIGlmICghbGlzdGVuZXJNYXBbZXZlbnRUeXBlXSkge1xuICAgIGlmIChyb290KSB7XG4gICAgICByb290LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICAgIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0gPSBbXTtcbiAgfVxuXG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBudWxsO1xuXG4gICAgLy8gQ09NUExFWCAtIG1hdGNoZXNSb290IG5lZWRzIHRvIGhhdmUgYWNjZXNzIHRvXG4gICAgLy8gdGhpcy5yb290RWxlbWVudCwgc28gYmluZCB0aGUgZnVuY3Rpb24gdG8gdGhpcy5cbiAgICBtYXRjaGVyID0gbWF0Y2hlc1Jvb3QuYmluZCh0aGlzKTtcblxuICAvLyBDb21waWxlIGEgbWF0Y2hlciBmb3IgdGhlIGdpdmVuIHNlbGVjdG9yXG4gIH0gZWxzZSBpZiAoL15bYS16XSskL2kudGVzdChzZWxlY3RvcikpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlc1RhZztcbiAgfSBlbHNlIGlmICgvXiNbYS16MC05XFwtX10rJC9pLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3Iuc2xpY2UoMSk7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXNJZDtcbiAgfSBlbHNlIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gbWF0Y2hlcztcbiAgfVxuXG4gIC8vIEFkZCB0byB0aGUgbGlzdCBvZiBsaXN0ZW5lcnNcbiAgbGlzdGVuZXJNYXBbZXZlbnRUeXBlXS5wdXNoKHtcbiAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXG4gICAgaGFuZGxlcjogaGFuZGxlcixcbiAgICBtYXRjaGVyOiBtYXRjaGVyLFxuICAgIG1hdGNoZXJQYXJhbTogbWF0Y2hlclBhcmFtXG4gIH0pO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlclxuICogZm9yIGVsZW1lbnRzIHRoYXQgbWF0Y2hcbiAqIHRoZSBzZWxlY3RvciwgZm9yZXZlclxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZXZlbnRUeXBlXSBSZW1vdmUgaGFuZGxlcnMgZm9yIGV2ZW50cyBtYXRjaGluZyB0aGlzIHR5cGUsIGNvbnNpZGVyaW5nIHRoZSBvdGhlciBwYXJhbWV0ZXJzXG4gKiBAcGFyYW0ge3N0cmluZ30gW3NlbGVjdG9yXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBvdGhlciB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IFtoYW5kbGVyXSBJZiB0aGlzIHBhcmFtZXRlciBpcyBvbWl0dGVkLCBvbmx5IGhhbmRsZXJzIHdoaWNoIG1hdGNoIHRoZSBwcmV2aW91cyB0d28gd2lsbCBiZSByZW1vdmVkXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24oZXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlciwgdXNlQ2FwdHVyZSkge1xuICB2YXIgaSwgbGlzdGVuZXIsIGxpc3RlbmVyTWFwLCBsaXN0ZW5lckxpc3QsIHNpbmdsZUV2ZW50VHlwZTtcblxuICAvLyBIYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlQ2FwdHVyZSA9IGhhbmRsZXI7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIC8vIElmIHVzZUNhcHR1cmUgbm90IHNldCwgcmVtb3ZlXG4gIC8vIGFsbCBldmVudCBsaXN0ZW5lcnNcbiAgaWYgKHVzZUNhcHR1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHRydWUpO1xuICAgIHRoaXMub2ZmKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcFt1c2VDYXB0dXJlID8gMSA6IDBdO1xuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIGZvciAoc2luZ2xlRXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoc2luZ2xlRXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLm9mZihzaW5nbGVFdmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG4gIGlmICghbGlzdGVuZXJMaXN0IHx8ICFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBSZW1vdmUgb25seSBwYXJhbWV0ZXIgbWF0Y2hlc1xuICAvLyBpZiBzcGVjaWZpZWRcbiAgZm9yIChpID0gbGlzdGVuZXJMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICBpZiAoKCFzZWxlY3RvciB8fCBzZWxlY3RvciA9PT0gbGlzdGVuZXIuc2VsZWN0b3IpICYmICghaGFuZGxlciB8fCBoYW5kbGVyID09PSBsaXN0ZW5lci5oYW5kbGVyKSkge1xuICAgICAgbGlzdGVuZXJMaXN0LnNwbGljZShpLCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBBbGwgbGlzdGVuZXJzIHJlbW92ZWRcbiAgaWYgKCFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgZGVsZXRlIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG5cbiAgICAvLyBSZW1vdmUgdGhlIG1haW4gaGFuZGxlclxuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogSGFuZGxlIGFuIGFyYml0cmFyeSBldmVudC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIGksIGwsIHR5cGUgPSBldmVudC50eXBlLCByb290LCBwaGFzZSwgbGlzdGVuZXIsIHJldHVybmVkLCBsaXN0ZW5lckxpc3QgPSBbXSwgdGFyZ2V0LCAvKiogQGNvbnN0ICovIEVWRU5USUdOT1JFID0gJ2Z0TGFic0RlbGVnYXRlSWdub3JlJztcblxuICBpZiAoZXZlbnRbRVZFTlRJR05PUkVdID09PSB0cnVlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuXG4gIC8vIEhhcmRjb2RlIHZhbHVlIG9mIE5vZGUuVEVYVF9OT0RFXG4gIC8vIGFzIG5vdCBkZWZpbmVkIGluIElFOFxuICBpZiAodGFyZ2V0Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcblxuICBwaGFzZSA9IGV2ZW50LmV2ZW50UGhhc2UgfHwgKCBldmVudC50YXJnZXQgIT09IGV2ZW50LmN1cnJlbnRUYXJnZXQgPyAzIDogMiApO1xuICBcbiAgc3dpdGNoIChwaGFzZSkge1xuICAgIGNhc2UgMTogLy9FdmVudC5DQVBUVVJJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdO1xuICAgIGJyZWFrO1xuICAgIGNhc2UgMjogLy9FdmVudC5BVF9UQVJHRVQ6XG4gICAgICBpZiAodGhpcy5saXN0ZW5lck1hcFswXSAmJiB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdKSBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lckxpc3QuY29uY2F0KHRoaXMubGlzdGVuZXJNYXBbMF1bdHlwZV0pO1xuICAgICAgaWYgKHRoaXMubGlzdGVuZXJNYXBbMV0gJiYgdGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXSkgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJMaXN0LmNvbmNhdCh0aGlzLmxpc3RlbmVyTWFwWzFdW3R5cGVdKTtcbiAgICBicmVhaztcbiAgICBjYXNlIDM6IC8vRXZlbnQuQlVCQkxJTkdfUEhBU0U6XG4gICAgICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdO1xuICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gTmVlZCB0byBjb250aW51b3VzbHkgY2hlY2tcbiAgLy8gdGhhdCB0aGUgc3BlY2lmaWMgbGlzdCBpc1xuICAvLyBzdGlsbCBwb3B1bGF0ZWQgaW4gY2FzZSBvbmVcbiAgLy8gb2YgdGhlIGNhbGxiYWNrcyBhY3R1YWxseVxuICAvLyBjYXVzZXMgdGhlIGxpc3QgdG8gYmUgZGVzdHJveWVkLlxuICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgd2hpbGUgKHRhcmdldCAmJiBsKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICAgIC8vIEJhaWwgZnJvbSB0aGlzIGxvb3AgaWZcbiAgICAgIC8vIHRoZSBsZW5ndGggY2hhbmdlZCBhbmRcbiAgICAgIC8vIG5vIG1vcmUgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gZGVmaW5lZCBiZXR3ZWVuIGkgYW5kIGwuXG4gICAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBmb3IgbWF0Y2ggYW5kIGZpcmVcbiAgICAgIC8vIHRoZSBldmVudCBpZiB0aGVyZSdzIG9uZVxuICAgICAgLy9cbiAgICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5XG4gICAgICAvLyB0byBjaGVjayBpZiBldmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb25cbiAgICAgIC8vIHdhcyBjYWxsZWQuIElmIHNvLCBicmVhayBib3RoIGxvb3BzLlxuICAgICAgaWYgKGxpc3RlbmVyLm1hdGNoZXIuY2FsbCh0YXJnZXQsIGxpc3RlbmVyLm1hdGNoZXJQYXJhbSwgdGFyZ2V0KSkge1xuICAgICAgICByZXR1cm5lZCA9IHRoaXMuZmlyZShldmVudCwgdGFyZ2V0LCBsaXN0ZW5lcik7XG4gICAgICB9XG5cbiAgICAgIC8vIFN0b3AgcHJvcGFnYXRpb24gdG8gc3Vic2VxdWVudFxuICAgICAgLy8gY2FsbGJhY2tzIGlmIHRoZSBjYWxsYmFjayByZXR1cm5lZFxuICAgICAgLy8gZmFsc2VcbiAgICAgIGlmIChyZXR1cm5lZCA9PT0gZmFsc2UpIHtcbiAgICAgICAgZXZlbnRbRVZFTlRJR05PUkVdID0gdHJ1ZTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE86TUNHOjIwMTIwMTE3OiBOZWVkIGEgd2F5IHRvXG4gICAgLy8gY2hlY2sgaWYgZXZlbnQjc3RvcFByb3BhZ2F0aW9uXG4gICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGxvb3BpbmdcbiAgICAvLyB0aHJvdWdoIHRoZSBET00uIFN0b3AgaWYgdGhlXG4gICAgLy8gZGVsZWdhdGlvbiByb290IGhhcyBiZWVuIHJlYWNoZWRcbiAgICBpZiAodGFyZ2V0ID09PSByb290KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsID0gbGlzdGVuZXJMaXN0Lmxlbmd0aDtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcbiAgfVxufTtcblxuLyoqXG4gKiBGaXJlIGEgbGlzdGVuZXIgb24gYSB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqIEBwYXJhbSB7Tm9kZX0gdGFyZ2V0XG4gKiBAcGFyYW0ge09iamVjdH0gbGlzdGVuZXJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuZmlyZSA9IGZ1bmN0aW9uKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBsaXN0ZW5lci5oYW5kbGVyLmNhbGwodGFyZ2V0LCBldmVudCwgdGFyZ2V0KTtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgZ2VuZXJpYyBzZWxlY3Rvci5cbiAqXG4gKiBAdHlwZSBmdW5jdGlvbigpXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgQSBDU1Mgc2VsZWN0b3JcbiAqL1xudmFyIG1hdGNoZXMgPSAoZnVuY3Rpb24oZWwpIHtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICB2YXIgcCA9IGVsLnByb3RvdHlwZTtcbiAgcmV0dXJuIChwLm1hdGNoZXMgfHwgcC5tYXRjaGVzU2VsZWN0b3IgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBwLm9NYXRjaGVzU2VsZWN0b3IpO1xufShFbGVtZW50KSk7XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgdGFnIHNlbGVjdG9yLlxuICpcbiAqIFRhZ3MgYXJlIE5PVCBjYXNlLXNlbnNpdGl2ZSxcbiAqIGV4Y2VwdCBpbiBYTUwgKGFuZCBYTUwtYmFzZWRcbiAqIGxhbmd1YWdlcyBzdWNoIGFzIFhIVE1MKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBUaGUgdGFnIG5hbWUgdG8gdGVzdCBhZ2FpbnN0XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNUYWcodGFnTmFtZSwgZWxlbWVudCkge1xuICByZXR1cm4gdGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgdGhlIHJvb3QuXG4gKlxuICogQHBhcmFtIHs/U3RyaW5nfSBzZWxlY3RvciBJbiB0aGlzIGNhc2UgdGhpcyBpcyBhbHdheXMgcGFzc2VkIHRocm91Z2ggYXMgbnVsbCBhbmQgbm90IHVzZWRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc1Jvb3Qoc2VsZWN0b3IsIGVsZW1lbnQpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUqL1xuICBpZiAodGhpcy5yb290RWxlbWVudCA9PT0gd2luZG93KSByZXR1cm4gZWxlbWVudCA9PT0gZG9jdW1lbnQ7XG4gIHJldHVybiB0aGlzLnJvb3RFbGVtZW50ID09PSBlbGVtZW50O1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIElEIG9mXG4gKiB0aGUgZWxlbWVudCBpbiAndGhpcydcbiAqIG1hdGNoZXMgdGhlIGdpdmVuIElELlxuICpcbiAqIElEcyBhcmUgY2FzZS1zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBJRCB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuZnVuY3Rpb24gbWF0Y2hlc0lkKGlkLCBlbGVtZW50KSB7XG4gIHJldHVybiBpZCA9PT0gZWxlbWVudC5pZDtcbn1cblxuLyoqXG4gKiBTaG9ydCBoYW5kIGZvciBvZmYoKVxuICogYW5kIHJvb3QoKSwgaWUgYm90aFxuICogd2l0aCBubyBwYXJhbWV0ZXJzXG4gKlxuICogQHJldHVybiB2b2lkXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub2ZmKCk7XG4gIHRoaXMucm9vdCgpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcXdlc3QgPSByZXF1aXJlKFwiLi8uLi9yZXF3ZXN0L3JlcXdlc3QuanNcIik7XG52YXIgRGVsZWdhdGUgPSByZXF1aXJlKFwiLi8uLi9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzXCIpO1xudmFyIGhlYWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5vLWhlYWRlcicpO1xudmFyIG15RnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuby1oZWFkZXJfX3NlY29uZGFyeS0tbXlmdC1qcycpXG52YXIgZGVmYXVsdFBhbmVsID0gaGVhZGVyLmdldEF0dHJpYnV0ZSgnZGF0YS1kZWZhdWx0LXBhbmVsJyk7XG52YXIgZGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUoaGVhZGVyKTtcbnZhciBib2R5RGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUoKTtcbnZhciBuZXh0VXNlclByZWZlcmVuY2VzID0gcmVxdWlyZShcIi4vLi4vbmV4dC11c2VyLXByZWZlcmVuY2VzL3NyYy9tYWluLmpzXCIpO1xuXG5kZWxlZ2F0ZS5vbignY2xpY2snLCAnLm8taGVhZGVyLWJ1dHRvbi1qcycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdC8vIEhBQ0tcblx0dmFyIHRhcmdldFBhbmVsID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS10YXJnZXQtcGFuZWwnKVxuXHRcdHx8IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS10YXJnZXQtcGFuZWwnKVxuXHRcdHx8IGRlZmF1bHRQYW5lbDtcblx0dmFyIGN1cnJlbnRQYW5lbCA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnKTtcblx0aWYgKGN1cnJlbnRQYW5lbCAhPT0gdGFyZ2V0UGFuZWwgJiYgdGFyZ2V0UGFuZWwgIT09IGRlZmF1bHRQYW5lbCkge1xuXHRcdGJvZHlEZWxlZ2F0ZS5yb290KGRvY3VtZW50LmJvZHkpO1xuXHRcdGhlYWRlci5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnLCB0YXJnZXRQYW5lbCk7XG5cdH0gZWxzZSB7XG5cdFx0Ym9keURlbGVnYXRlLnJvb3QoKTtcblx0XHRpZiAoZGVmYXVsdFBhbmVsKSB7XG5cdFx0XHRoZWFkZXIuc2V0QXR0cmlidXRlKCdkYXRhLXBhbmVsJywgZGVmYXVsdFBhbmVsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aGVhZGVyLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1wYW5lbCcpO1xuXHRcdH1cblx0fVxufSk7XG5cbmRlbGVnYXRlLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufSk7XG5cbmJvZHlEZWxlZ2F0ZS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0aWYgKGRlZmF1bHRQYW5lbCkge1xuXHRcdGhlYWRlci5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnLCBkZWZhdWx0UGFuZWwpO1xuXHR9IGVsc2Uge1xuXHRcdGhlYWRlci5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnKTtcblx0fVxufSk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbnM6bmV3JywgZnVuY3Rpb24oZSkge1xuXHR2YXIgdG90YWwgPSAwLCBcblx0XHRcdG5vdGlmaWNhdGlvbnMgPSBlLmRldGFpbCxcblx0XHRcdG15RlRCdXR0b24gPSBoZWFkZXIucXVlcnlTZWxlY3RvcignLm8taGVhZGVyLWJ1dHRvbi1qc1tkYXRhLXRhcmdldC1wYW5lbD1cIm15ZnRcIl0nKTtcblx0Zm9yKHZhciBzdHJlYW0gaW4gbm90aWZpY2F0aW9ucykge1xuXHRcdGlmKG5vdGlmaWNhdGlvbnNbc3RyZWFtXSkge1xuXHRcdFx0dG90YWwgKz0gbm90aWZpY2F0aW9uc1tzdHJlYW1dLmxlbmd0aDtcblx0XHR9XG5cdH1cblx0aWYodG90YWwgPiAwKSB7XG5cdFx0aWYobXlGVEJ1dHRvbi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdub3RpZnktYmFkZ2UnKS5sZW5ndGgpIHtcblx0XHRcdG15RlRCdXR0b24uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbm90aWZ5LWJhZGdlJylbMF0udGV4dENvbnRlbnQgPSB0b3RhbDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bXlGVEJ1dHRvbi5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsICc8c3BhbiBjbGFzcz1cIm5vdGlmeS1iYWRnZVwiPicrdG90YWwgKyAnPC9zcGFuPicpXG5cblx0XHR9XG5cdH1cbn0pO1xuXG5yZXF3ZXN0KCdodHRwOi8vbmV4dC1jb21wYW5pZXMtZXQtYWwuaGVyb2t1YXBwLmNvbS92MS91YmVybmF2Lmpzb24nLCBmdW5jdGlvbihyZXNwKSB7XG5cdHZhciBkYXRhID0gcmVzcC5kYXRhO1xuXHRoZWFkZXIucXVlcnlTZWxlY3RvcignLm8taGVhZGVyX19zZWNvbmRhcnktLW1lbnUtanMnKS5pbm5lckhUTUwgPSAnPHVsIGNsYXNzPVwidWJlci1pbmRleFwiPidcblx0XHQrIGRhdGEubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRyZXR1cm4gJzxsaSBjbGFzcz1cInViZXItaW5kZXhfX3RpdGxlXCIgZGF0YS1vLWdyaWQtY29sc3Bhbj1cIjYgTTYgTDMgWEwzXCI+J1xuXHRcdFx0KyAnPGEgaHJlZj1cIicgKyBpdGVtLm5leHRVcmwgKyAnXCI+JyArIGl0ZW0udGl0bGUgKyAnPC9hPidcblx0XHRcdCsgJzx1bCBjbGFzcz1cInViZXItaW5kZXhfX2NoaWxkcmVuXCI+J1xuXHRcdFx0KyBpdGVtLm5hdmlnYXRpb25JdGVtcy5tYXAoZnVuY3Rpb24oY2hpbGQpIHtcblx0XHRcdFx0cmV0dXJuICc8bGkgY2xhc3M9XCJ1YmVyLWluZGV4X19jaGlsZFwiPjxhIGhyZWY9XCInICsgY2hpbGQubmV4dFVybCArICdcIj4nICsgY2hpbGQudGl0bGUgKyAnPC9hPjwvbGk+Jztcblx0XHRcdH0pLmpvaW4oJycpXG5cdFx0XHQrICc8L3VsPidcblx0XHRcdCsgJzwvbGk+Jztcblx0XHR9KS5qb2luKCcnKTtcblx0XHQrICc8L3VsPic7XG59KTtcblxuaWYgKG15RnQpIG5leHRVc2VyUHJlZmVyZW5jZXMuaW5pdChteUZ0LCB7IG5vdGlmeTogdHJ1ZSB9KTtcbiIsIi8vIFN0b3JlcyBhIHVuaXF1ZSBsaXN0IG9mIHRoaW5ncyAoRWcsIHNlY3Rpb25zLCBmYXZvdXJpdGVzLCBoaXN0b3J5KSBhZ2FpbnN0IGFcbi8vIGtleSBpbiBsb2NhbFN0b3JhZ2VcblxudmFyIHJlcXdlc3QgPSByZXF1aXJlKCcuLi92ZW5kb3IvcmVxd2VzdC5taW4nKTtcblxudmFyIEFQSV9VUkwgPSAnaHR0cDovL2Z0LW5leHQtYXBpLXVzZXItcHJlZnMuaGVyb2t1YXBwLmNvbS91c2VyLyc7XG5cbnZhciBlbWl0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICBpZiAoZGF0YSkge1xuICAgIGV2ZW50LmRldGFpbCA9IGRhdGE7XG4gIH1cbiAgdG9wLmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxuXG52YXIgTWUgPSBmdW5jdGlvbiAoa2V5LCB1c2VySWQpIHtcbiAgaWYgKCFrZXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IHN1cHBseSBhIGtleSAvXlthLXpdKyQvJyk7XG4gIH1cbiAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgdGhpcy5sb2NhbFN0b3JhZ2VLZXkgPSAnZnQubmV4dC51c2VyLicgKyBrZXk7XG5cbiAgaWYodXNlcklkKSB7XG4gICAgdGhpcy5hcGlVUkwgPSBBUElfVVJMICsga2V5O1xuICAgIHRoaXMudXNlcklkID0gdXNlcklkO1xuICB9ICAgICAgXG4gICAgLy9TdGFydCBvZmYgd2l0aCBsb2NhbCBjb3B5Li4uXG4gICAgdGhpcy52YWwgPSB0aGlzLmdldE9yQ3JlYXRlKCk7XG4gICAgLy9UaGVuIHRyeSBhbmQgZmV0Y2ggc2VydmVyIGNvcHlcbiAgICB0aGlzLmZldGNoKCk7XG5cbiAgfTtcblxuICBNZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIGtleSA9IGtleSB8fCB0aGlzLmxvY2FsU3RvcmFnZUtleTtcbiAgICB2YXIgZXhpc3RzID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICBpZiAoZXhpc3RzKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShleGlzdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5nZXRPckNyZWF0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBrZXkgPSBrZXkgfHwgdGhpcy5sb2NhbFN0b3JhZ2VLZXk7XG4gICAgdmFyIHNhdmVkID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZihzYXZlZCkge1xuICAgICAgcmV0dXJuIHNhdmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZW1wdHkgPSBbXTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoZW1wdHkpKTtcbiAgICAgIHJldHVybiBlbXB0eTtcbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgLy9JZiBubyB1c2VySUQgZG9uJ3QgZmV0Y2ggZnJvbSBzZXJ2ZXJcbiAgICBpZighdGhpcy51c2VySWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXF3ZXN0KHtcbiAgICAgIHVybDogdGhpcy5hcGlVUkwsXG4gICAgICB0eXBlOiAnanNvbicsXG4gICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1GVC1VSUQnOiB0aGlzLnVzZXJJZFxuICAgICAgfSxcbiAgICAgIGNyb3NzT3JpZ2luOiB0cnVlXG4gICAgfSkudGhlbihmdW5jdGlvbihmYXZlcykge1xuICAgICAgaWYoZmF2ZXMpIHtcbiAgICAgICAgbWUudmFsID0gZmF2ZXM7XG4gICAgICAgIC8vYWNjZXB0IHRoZSBzZXJ2ZXIgY29weSBhcyAndGhlIHRydXRoJy4uLlxuICAgICAgICBtZS5zYXZlKG1lLnZhbCk7XG4gICAgICAgIC8vYnV0IHRoZW4gcHJvY2VzcyBhbnkgbGVmdG92ZXIgcmVxdWVzdHMgbG9jYWxseVxuICAgICAgICBtZS5wcm9jZXNzUGVuZGluZygnYWRkJyk7XG4gICAgICAgIG1lLnByb2Nlc3NQZW5kaW5nKCdyZW1vdmUnKTtcbiAgICAgICAgbWUucHJvY2Vzc1BlbmRpbmcoJ2NsZWFyJyk7XG4gICAgICB9XG4gICAgfSkuYWx3YXlzKGZ1bmN0aW9uKGVycikge1xuICAgICAgLy90cmlnZ2VyIGxvYWQgYW5kIHVwZGF0ZSBldmVudHNcbiAgICAgIGVtaXQobWUua2V5ICsgJzpsb2FkJywgbWUpO1xuICAgICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTtcbiAgICB9KTsgIFxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gICAga2V5ID0ga2V5IHx8IHRoaXMubG9jYWxTdG9yYWdlS2V5O1xuICAgIGlmKG9iaiAmJiBvYmoubGVuZ3RoKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KG9iaikpOyBcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmFkZFBlbmRpbmcgPSBmdW5jdGlvbihvYmosIGFjdGlvbikge1xuICAgIHZhciBwZW5kaW5nID0gdGhpcy5nZXRPckNyZWF0ZSh0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuJyArIGFjdGlvbik7XG4gICAgcGVuZGluZy5wdXNoKG9iaik7XG4gICAgLy9pZiB3ZSdyZSBhZGRpbmcgc29tZXRoaW5nLCB0aGVuIGdldCByaWQgb2YgYW55IHBlbmRpbmcgY2xlYXIgcmVxdWVzdHNcbiAgICBpZihhY3Rpb24gPT09ICdhZGQnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuY2xlYXInKTtcbiAgICB9XG4gICAgdGhpcy5zYXZlKHBlbmRpbmcsIHRoaXMubG9jYWxTdG9yYWdlS2V5ICsgJy4nICsgYWN0aW9uKTtcbiAgfTtcblxuICBNZS5wcm90b3R5cGUucHJvY2Vzc1BlbmRpbmcgPSBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciBwZW5kaW5nID0gdGhpcy5nZXQodGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLicgKyBhY3Rpb24pO1xuICAgIGlmKHBlbmRpbmcgJiYgcGVuZGluZy5sZW5ndGgpIHtcbiAgICAgIC8vQ2xlYXIgaXMgYSBzcGVjaWFsIGNhc2VcbiAgICAgIGlmKGFjdGlvbiA9PT0gJ2NsZWFyJykge1xuICAgICAgICBpZihwZW5kaW5nW3BlbmRpbmcubGVuZ3RoIC0gMV0gPT09IHRydWUpIHtcbiAgICAgICAgICBtZS5jbGVhcigpO1xuICAgICAgICAgIHBlbmRpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZW5kaW5nLmZvckVhY2goZnVuY3Rpb24oaXRlbVRvQWRkLCBpbmRleCkge1xuICAgICAgICAgICAvLyByZW1vdmUgdGhlIGl0ZW0gZnJvbSB0aGUgdG9kbyBsaXN0IGFuZCBleGVjdXRlIHRoZSBhY3Rpb24gXG4gICAgICAgICAgIHBlbmRpbmcuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgbWVbYWN0aW9uXShpdGVtVG9BZGQpO1xuICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNhdmUocGVuZGluZywgdGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLicgKyBhY3Rpb24pO1xuICAgIH1cblxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB0aGlzLnZhbCA9IHRoaXMuZ2V0T3JDcmVhdGUoKTtcbiAgICBpZiAoIXRoaXMuZXhpc3RzKG9iai51dWlkdjMpKSB7XG4gICAgICB0aGlzLnZhbC5wdXNoKG9iaik7XG4gICAgICB0aGlzLnNhdmUodGhpcy52YWwpO1xuICAgICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTsgLy90cmlnZ2VyIGV2ZW50IHRvIHJlbmRlciBVSVxuXG4gICAgICAvL1NlbmQgYSByZXF1ZXN0IHRvIGFkZCB0byBzZXJ2ZXJcbiAgICAgIGlmKHRoaXMuYXBpVVJMKSB7XG4gICAgICAgIHJlcXdlc3Qoe1xuICAgICAgICAgIHVybDogdGhpcy5hcGlVUkwsXG4gICAgICAgICAgbWV0aG9kOiAncHV0JyxcbiAgICAgICAgICB0eXBlOiAnanNvbicsXG4gICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShvYmopLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdYLUZULVVJRCc6IHRoaXMudXNlcklkXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjcm9zc09yaWdpbjogdHJ1ZVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG1lLmFkZFBlbmRpbmcob2JqLCAnYWRkJyk7IC8vc2VydmVyIHJlcXVlc3QgZmFpbGVkIHNvIHB1c2ggaXQgdG8gdGhlIGxpc3Qgb2YgcGVuZGluZ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgdGhpcy52YWwgPSB0aGlzLmdldE9yQ3JlYXRlKCk7XG4gICAgdGhpcy52YWwgPSB0aGlzLnZhbC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIChpdGVtLnV1aWR2MyAhPT0gb2JqLnV1aWR2Myk7XG4gICAgfSk7XG4gICAgdGhpcy5zYXZlKHRoaXMudmFsKTtcblxuICAgIGVtaXQobWUua2V5ICsgJzp1cGRhdGUnLCBtZSk7IC8vdHJpZ2dlciBldmVudCB0byByZW5kZXIgVUlcblxuICAgIC8vU2VuZCBhIHJlcXVlc3QgdG8gZGVsZXRlIGZyb20gc2VydmVyXG4gICAgaWYodGhpcy5hcGlVUkwpIHtcblxuICAgICAgcmVxd2VzdCh7XG4gICAgICAgIHVybDogdGhpcy5hcGlVUkwgKyAnLycgKyBlbmNvZGVVUkkoZGVjb2RlVVJJKG9iai51dWlkdjMpKSxcbiAgICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgICBtZXRob2Q6ICdkZWxldGUnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ1gtRlQtVUlEJzogdGhpcy51c2VySWRcbiAgICAgICAgfSxcbiAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgIH0pLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1lLmFkZFBlbmRpbmcob2JqLCAncmVtb3ZlJyk7ICAvL3NlcnZlciByZXF1ZXN0IGZhaWxlZCBzbyBwdXNoIGl0IHRvIHRoZSBsaXN0IG9mIHBlbmRpbmdcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuXG4gIE1lLnByb3RvdHlwZS5leGlzdHMgPSBmdW5jdGlvbiAodXVpZCkge1xuICAgIHRoaXMudmFsID0gdGhpcy5nZXRPckNyZWF0ZSgpO1xuICAgIHJldHVybiB0aGlzLnZhbC5zb21lKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS51dWlkdjMgPT09IHV1aWQ7XG4gICAgfSk7XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIHN0YXR1cyA9IGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMubG9jYWxTdG9yYWdlS2V5KTtcbiAgICB0aGlzLnZhbCA9IFtdO1xuXG4gICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTsgLy90cmlnZ2VyIGV2ZW50IHRvIHJlbmRlciBVSVxuXG4gICAgICAvL1NlbmQgYSByZXF1ZXN0IHRvIGRlbGV0ZSBBTEwgZnJvbSBzZXJ2ZXJcbiAgICAgIGlmKHRoaXMuYXBpVVJMKSB7XG5cbiAgICAgICAgcmVxd2VzdCh7XG4gICAgICAgICAgdXJsOiB0aGlzLmFwaVVSTCxcbiAgICAgICAgICB0eXBlOiAnanNvbicsXG4gICAgICAgICAgbWV0aG9kOiAnZGVsZXRlJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnWC1GVC1VSUQnOiB0aGlzLnVzZXJJZFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgICBtZS5hZGRQZW5kaW5nKHRydWUsICdjbGVhcicpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9O1xuXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IE1lO1xuXG4iLCJ2YXIgcmVxd2VzdCA9IHJlcXVpcmUoJy4uL3ZlbmRvci9yZXF3ZXN0Lm1pbicpO1xuXG5cbnZhciBOT1RJRklDQVRJT05TX1VSTCA9ICdodHRwOi8vZnQtbmV4dC1hcGktdXNlci1wcmVmcy5oZXJva3VhcHAuY29tL3VzZXIvbm90aWZpY2F0aW9ucy8nO1xudmFyIGVtaXQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG5cdHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG5cdGlmIChkYXRhKSB7XG5cdFx0ZXZlbnQuZGV0YWlsID0gZGF0YTtcblx0fVxuXHR0b3AuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5cbmZ1bmN0aW9uIGV4dHJhY3RTZWFyY2hUZXJtKHF1ZXJ5U3RyaW5nKSB7XG4gICAgcmV0dXJuIHF1ZXJ5U3RyaW5nLm1hdGNoKC9xPShbXiZdKikvKVsxXTtcbn1cblxudmFyIGdldEN1cnJlbnRTdHJlYW0gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9uQXJ0aWNsZSA9IC9eXFwvW2EtZjAtOV0rLSguKikvLnRlc3QobG9jYXRpb24ucGF0aG5hbWUpOyAvLyAnMjdhNWUyODYtNDMxNC0xMWU0LThhNDMtMDAxNDRmZWFiZGMwJzsgXG4gIGlmKG9uQXJ0aWNsZSB8fCBsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKCcvc2VhcmNoJykgIT09IDApIHsgLy9oYWNreSB3YXkgdG8gZXhjbHVkZSBob21lcGFnZSFcbiAgXHRyZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gIFx0cmV0dXJuIGV4dHJhY3RTZWFyY2hUZXJtKGxvY2F0aW9uLnNlYXJjaCk7XG4gIH1cbn07XG5cblxuZnVuY3Rpb24gTm90aWZpY2F0aW9uUG9sbGVyKHVzZXJQcmVmZXJlbmNlTGlzdCkge1xuXHR0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdCA9IHVzZXJQcmVmZXJlbmNlTGlzdDtcblx0c2V0SW50ZXJ2YWwodGhpcy5wb2xsLmJpbmQodGhpcyksIDEwMDAgKiA2MCAqIDAuNSk7IC8vMzAgc2Vjb25kIHBvbGxpbmdcblx0dGhpcy5ub3RpZmljYXRpb25zID0ge307XG5cblx0Ly9DbGVhciBub3RpZmljYXRpb25zIGlmIGEgc3RyZWFtIGhhcyBiZWVuIG9wZW5lbmRcblx0dGhpcy5jdXJyZW50U3RyZWFtID0gZ2V0Q3VycmVudFN0cmVhbSgpO1xuXHR0aGlzLm9wZW5lZCA9IGZhbHNlOyAvL3doZXRoZXJlIHRoZXNlIG5vdGlmaWNhdGlvbnMgaGF2ZSBiZWVuIG9wZW5lZCBvciBub3Rcblx0aWYodGhpcy5jdXJyZW50U3RyZWFtKSB7XG5cdFx0dGhpcy5jbGVhcih0aGlzLmN1cnJlbnRTdHJlYW0pO1xuXHR9XG5cblx0dGhpcy5wb2xsKCk7XG5cbn1cblxuXG5Ob3RpZmljYXRpb25Qb2xsZXIucHJvdG90eXBlLnBvbGwgPSBmdW5jdGlvbigpIHtcblx0dmFyIHBvbGxlciA9IHRoaXM7XG5cdHZhciBub3RpZmljYXRpb25Qcm9taXNlcyA9IFtdO1xuXHR0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdC5saXN0LmdldCgpLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XG5cdFx0Ly9kb24ndCBib3RoZXIgZmV0Y2hpbmcgaWYgeW91IGFyZSBvbiB0aGF0IHN0cmVhbSBjdXJyZW50bHlcblxuXHRcdGlmKHN0cmVhbS5yZXNvdXJjZVR5cGUgIT09ICdzdHJlYW0nKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdG5vdGlmaWNhdGlvblByb21pc2VzLnB1c2gocmVxd2VzdCh7XG5cdFx0XHR1cmw6IE5PVElGSUNBVElPTlNfVVJMICsgc3RyZWFtLnV1aWR2Myxcblx0XHRcdHR5cGU6ICdqc29uJyxcblx0XHRcdG1ldGhvZDogJ2dldCcsXG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdYLUZULVVJRCc6IHBvbGxlci51c2VyUHJlZmVyZW5jZUxpc3QudXNlcklkXG5cdFx0XHR9LFxuXHRcdFx0Y3Jvc3NPcmlnaW46IHRydWVcblx0XHR9KS50aGVuKGZ1bmN0aW9uKG5vdGlmaWNhdGlvbnMpIHtcblx0XHRcdGlmKG5vdGlmaWNhdGlvbnMgJiYgbm90aWZpY2F0aW9ucy5sZW5ndGgpIHtcblxuXHRcdFx0XHQvL0lmIHRoZSBzdHJlYW0gaXMgY3VycmVudGx5IG9wZW4sIGVtaXQgYW4gZXZlbnQgd2l0aCB0aGUgbm90aWZpY2F0aW9ucywgYW5kIHRoZW4gY2xlYXIgdGhlbVxuXHRcdFx0XHQvLyAoYnV0IG9ubHkgZG8gdGhpcyBvbmNlKVxuXHRcdFx0XHRpZighcG9sbGVyLm9wZW5lZCAmJiBzdHJlYW0udXVpZHYzID09PSBwb2xsZXIuY3VycmVudFN0cmVhbSkge1xuXHRcdFx0XHRcdHBvbGxlci5vcGVuZWQgPSB0cnVlO1xuXHRcdFx0XHRcdGVtaXQoJ25vdGlmaWNhdGlvbnM6b3BlbmVkJywgeyB1dWlkdjM6IHN0cmVhbS51dWlkdjMsIG5vdGlmaWNhdGlvbnM6IG5vdGlmaWNhdGlvbnMgfSk7XG5cdFx0XHRcdFx0cG9sbGVyLmNsZWFyKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cG9sbGVyLm5vdGlmaWNhdGlvbnNbc3RyZWFtLnV1aWR2M10gPSBub3RpZmljYXRpb25zO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRlbGV0ZSBwb2xsZXIubm90aWZpY2F0aW9uc1tzdHJlYW0udXVpZHYzXTtcblx0XHRcdH1cblx0XHRcdHBvbGxlci5yZW5kZXIoKTtcblx0XHR9KSk7XG5cdH0pO1xuXG5cdFByb21pc2UuYWxsKG5vdGlmaWNhdGlvblByb21pc2VzKS50aGVuKGZ1bmN0aW9uKHN0cmVhbU5vdGlmaWNhdGlvbnMpIHtcblx0XHRpZihwb2xsZXIubm90aWZpY2F0aW9ucykge1xuXHRcdFx0ZW1pdCgnbm90aWZpY2F0aW9uczpuZXcnLCBwb2xsZXIubm90aWZpY2F0aW9ucyk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmZ1bmN0aW9uIHJlbmRlckJhZGdlKGVsLCBudW1iZXIpIHtcblx0dmFyIGJhZGdlID0gZWwuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnanMtbm90aWZ5LWJhZGdlJylbMF07XG5cdGlmKCFiYWRnZSkge1xuXHRcdGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXHRcdGJhZGdlLmNsYXNzTmFtZSA9ICdub3RpZnktYmFkZ2UganMtbm90aWZ5LWJhZGdlJztcblx0XHRlbC5hcHBlbmRDaGlsZChiYWRnZSk7XG5cdH1cblx0aWYobnVtYmVyID4gMCkge1xuXHRcdGJhZGdlLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKTtcblx0XHRiYWRnZS50ZXh0Q29udGVudCA9IG51bWJlcjtcblx0fSBlbHNlIHtcblx0XHRiYWRnZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJycpO1xuXHR9XG59XG5cbk5vdGlmaWNhdGlvblBvbGxlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG5cdGZvcih2YXIgc3RyZWFtIGluIHRoaXMubm90aWZpY2F0aW9ucykge1xuXHRcdGxpbmsgPSB0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdC5jb250YWluZXIucXVlcnlTZWxlY3RvcignW2hyZWY9XCIvc2VhcmNoP3E9JyArIHN0cmVhbSArICdcIl0nKTtcblx0XHRpZihsaW5rKSB7XG5cdFx0XHRyZW5kZXJCYWRnZShsaW5rLCB0aGlzLm5vdGlmaWNhdGlvbnNbc3RyZWFtXS5sZW5ndGgpO1xuXHRcdH1cblx0fVxufTtcblxuTm90aWZpY2F0aW9uUG9sbGVyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKHV1aWQpIHtcblx0aWYodXVpZCkge1xuXHRcdHRoaXMubm90aWZpY2F0aW9uc1t1dWlkXSA9IFtdO1xuXHRcdHJlcXdlc3Qoe1xuXHRcdFx0dXJsOiBOT1RJRklDQVRJT05TX1VSTCArIHV1aWQsXG5cdFx0XHR0eXBlOiAnanNvbicsXG5cdFx0XHRtZXRob2Q6ICdkZWxldGUnLFxuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnWC1GVC1VSUQnOiB0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdC51c2VySWRcblx0XHRcdH0sXG5cdFx0XHRjcm9zc09yaWdpbjogdHJ1ZVxuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiB1dWlkID09PSAndW5kZWZpbmVkJykge1xuXHRcdHRoaXMubm90aWZpY2F0aW9ucyA9IHt9O1xuXHR9XG5cdHRoaXMucmVuZGVyKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGlmaWNhdGlvblBvbGxlcjsiLCJ2YXIgTm90aWZpY2F0aW9uUG9sbGVyID0gcmVxdWlyZSgnLi9Ob3RpZmljYXRpb25Qb2xsZXInKTtcbnZhciBNZSA9IHJlcXVpcmUoJy4vTWUnKTtcblxudmFyICQgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgcmV0dXJuIFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpO1xufTtcbnZhciBlbWl0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICBpZiAoZGF0YSkge1xuICAgIGV2ZW50LmRldGFpbCA9IGRhdGE7XG4gIH1cbiAgdG9wLmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxudmFyIGdldFVzZXJJZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmFsdWUgPSBcIjsgXCIgKyBkb2N1bWVudC5jb29raWU7XG4gIHZhciBwYXJ0cyA9IHZhbHVlLnNwbGl0KFwiOyBGVF9VPVwiKTtcbiAgdmFyIGZ0VSA9IHBhcnRzLnBvcCgpLnNwbGl0KFwiO1wiKS5zaGlmdCgpO1xuICBpZihmdFUpIHtcbiAgICByZXR1cm4gZnRVLm1hdGNoKC9fRUlEPShcXGQrKV9QSUQvKVsxXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm47XG4gIH1cbn07XG5cbnZhciBVc2VyUHJlZmVyZW5jZUxpc3QgPSBmdW5jdGlvbihjb250YWluZXIsIG9wdHMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnVzZXJJZCA9IGdldFVzZXJJZCgpO1xuICB0aGlzLmtleSA9IGNvbnRhaW5lci5nZXRBdHRyaWJ1dGUoJ2RhdGEtdXNlci1wcmVmZXJlbmNlLWxpc3QnKTtcbiAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gIHRoaXMubm90aWZ5ID0gb3B0cy5ub3RpZnk7XG5cbn07XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmKCF0aGlzLnVzZXJJZCkge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMua2V5ICsgJzphZGQnLCBmdW5jdGlvbihldikge1xuICAgIHNlbGYuYWRkKGV2LmRldGFpbCk7XG4gIH0pO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMua2V5ICsgJzpyZW1vdmUnLCBmdW5jdGlvbihldikge1xuICAgIHNlbGYucmVtb3ZlKGV2LmRldGFpbCk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5rZXkgKyAnOmNsZWFyJywgdGhpcy5jbGVhci5iaW5kKHRoaXMpKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmtleSArICc6dXBkYXRlJywgdGhpcy5yZW5kZXIuYmluZCh0aGlzKSk7XG5cbiAgJCgnW2RhdGEtbGlzdC1zb3VyY2U9XCInICsgdGhpcy5rZXkgKyAnXCJdIC5jbGVhcl9fYnV0dG9uJykubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5jbGVhci5iaW5kKHNlbGYpKTtcbiAgfSk7XG5cbiAgdGhpcy5saXN0ID0gbmV3IE1lKHRoaXMua2V5LCB0aGlzLnVzZXJJZCk7XG5cbiAgaWYodGhpcy5ub3RpZnkgPT09IHRydWUpIHtcbiAgICB0aGlzLm5vdGlmaWVyID0gbmV3IE5vdGlmaWNhdGlvblBvbGxlcih0aGlzKTtcbiAgfVxufVxuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbWUgPSB0aGlzO1xuICB2YXIgaHJlZiA9ICcnO1xuXG4gIHZhciBsaW5rcyA9IHRoaXMubGlzdCA/IHRoaXMubGlzdC5nZXRPckNyZWF0ZSgpLnJldmVyc2UoKSA6IFtdO1xuXG4gIHZhciBsaW5rc0hUTUwgPSBsaW5rcy5tYXAoZnVuY3Rpb24gKHNlY3Rpb24pIHtcbiAgICBocmVmID0gc2VjdGlvbi5yZXNvdXJjZVR5cGUgPT09ICdzdHJlYW0nID8gJy9zZWFyY2g/cT0nICsgc2VjdGlvbi51dWlkdjMgOiAnLycgKyBzZWN0aW9uLnV1aWR2MztcbiAgICByZXR1cm4gJzxsaSBjbGFzcz1cIml0ZW0tdHlwZS0tJyArIHNlY3Rpb24ucmVzb3VyY2VUeXBlICsgJ1wiPjxhIGhyZWY9XCInICsgaHJlZiArICdcIj4nICsgc2VjdGlvbi5kaXNwbGF5VGV4dCArICc8L2E+PC9saT4nO1xuICB9KS5qb2luKCcnKTtcbiAgXG4gIGlmKHRoaXMuY29udGFpbmVyKSB7XG4gICAgdGhpcy5jb250YWluZXIuaW5uZXJIVE1MID0gIGxpbmtzSFRNTDtcbiAgfVxuICBpZih0aGlzLm5vdGlmaWVyKSB7XG4gICAgdGhpcy5ub3RpZmllci5yZW5kZXIoKTtcbiAgfVxufTtcblxuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG9iaikge1xuICB0aGlzLmxpc3QuYWRkKG9iaik7XG59O1xuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKG9iaikge1xuICB0aGlzLmxpc3QucmVtb3ZlKG9iaik7XG59O1xuXG5Vc2VyUHJlZmVyZW5jZUxpc3QucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubGlzdC5jbGVhcigpO1xufTtcblxuVXNlclByZWZlcmVuY2VMaXN0LmluaXQgPSBmdW5jdGlvbihyb290RWwsIG9wdHMpIHtcbiAgdmFyIGNvbXBvbmVudHMgPSB7fSwgXG4gICAgICBmRWxzLCBcbiAgICAgIGMsIGwsIFxuICAgICAgY29tcG9uZW50O1xuXG4gIHJvb3RFbCA9IHJvb3RFbCB8fCBkb2N1bWVudC5ib2R5O1xuICAvL3NldCBjb25maWcgd2l0aCBvdmVycmlkZXMgcGFzc2VkIHRocm91Z2hcblxuICBpZiAocm9vdEVsLnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICBmRWxzID0gcm9vdEVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXVzZXItcHJlZmVyZW5jZS1saXN0XScpO1xuICAgIGZvciAoYyA9IDAsIGwgPSBmRWxzLmxlbmd0aDsgYyA8IGw7IGMrKykge1xuICAgICAgaWYgKCFmRWxzW2NdLmhhc0F0dHJpYnV0ZSgnZGF0YS1vLWF1dGhvci1hbGVydHMtLWpzJykpIHtcbiAgICAgICAgY29tcG9uZW50ID0gbmV3IFVzZXJQcmVmZXJlbmNlTGlzdChmRWxzW2NdLCBvcHRzIHx8IHt9KTtcbiAgICAgICAgY29tcG9uZW50LmluaXQob3B0cyk7XG4gICAgICAgIGNvbXBvbmVudHNbZkVsc1tjXS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdXNlci1wcmVmZXJlbmNlLWxpc3QnKV0gPSBjb21wb25lbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbXBvbmVudHM7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVXNlclByZWZlcmVuY2VMaXN0O1xuIiwidmFyIFVzZXJQcmVmZXJlbmNlTGlzdCA9IHJlcXVpcmUoJy4vbGliL1VzZXJQcmVmZXJlbmNlTGlzdCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVzZXJQcmVmZXJlbmNlTGlzdDsiLCIvKiFcbiAgKiBSZXF3ZXN0ISBBIGdlbmVyYWwgcHVycG9zZSBYSFIgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICogbGljZW5zZSBNSVQgKGMpIER1c3RpbiBEaWF6IDIwMTRcbiAgKiBodHRwczovL2dpdGh1Yi5jb20vZGVkL3JlcXdlc3RcbiAgKi9cbiFmdW5jdGlvbihlLHQsbil7dHlwZW9mIG1vZHVsZSE9XCJ1bmRlZmluZWRcIiYmbW9kdWxlLmV4cG9ydHM/bW9kdWxlLmV4cG9ydHM9bigpOnR5cGVvZiBkZWZpbmU9PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZD9kZWZpbmUobik6dFtlXT1uKCl9KFwicmVxd2VzdFwiLHRoaXMsZnVuY3Rpb24oKXtmdW5jdGlvbiBzdWNjZWVkKGUpe3JldHVybiBodHRwc1JlLnRlc3Qod2luZG93LmxvY2F0aW9uLnByb3RvY29sKT90d29IdW5kby50ZXN0KGUuc3RhdHVzKTohIWUucmVzcG9uc2V9ZnVuY3Rpb24gaGFuZGxlUmVhZHlTdGF0ZShlLHQsbil7cmV0dXJuIGZ1bmN0aW9uKCl7aWYoZS5fYWJvcnRlZClyZXR1cm4gbihlLnJlcXVlc3QpO2UucmVxdWVzdCYmZS5yZXF1ZXN0W3JlYWR5U3RhdGVdPT00JiYoZS5yZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZT1ub29wLHN1Y2NlZWQoZS5yZXF1ZXN0KT90KGUucmVxdWVzdCk6bihlLnJlcXVlc3QpKX19ZnVuY3Rpb24gc2V0SGVhZGVycyhlLHQpe3ZhciBuPXQuaGVhZGVyc3x8e30scjtuLkFjY2VwdD1uLkFjY2VwdHx8ZGVmYXVsdEhlYWRlcnMuYWNjZXB0W3QudHlwZV18fGRlZmF1bHRIZWFkZXJzLmFjY2VwdFtcIipcIl07dmFyIGk9dHlwZW9mIEZvcm1EYXRhPT1cImZ1bmN0aW9uXCImJnQuZGF0YSBpbnN0YW5jZW9mIEZvcm1EYXRhOyF0LmNyb3NzT3JpZ2luJiYhbltyZXF1ZXN0ZWRXaXRoXSYmKG5bcmVxdWVzdGVkV2l0aF09ZGVmYXVsdEhlYWRlcnMucmVxdWVzdGVkV2l0aCksIW5bY29udGVudFR5cGVdJiYhaSYmKG5bY29udGVudFR5cGVdPXQuY29udGVudFR5cGV8fGRlZmF1bHRIZWFkZXJzLmNvbnRlbnRUeXBlKTtmb3IociBpbiBuKW4uaGFzT3duUHJvcGVydHkocikmJlwic2V0UmVxdWVzdEhlYWRlclwiaW4gZSYmZS5zZXRSZXF1ZXN0SGVhZGVyKHIsbltyXSl9ZnVuY3Rpb24gc2V0Q3JlZGVudGlhbHMoZSx0KXt0eXBlb2YgdC53aXRoQ3JlZGVudGlhbHMhPVwidW5kZWZpbmVkXCImJnR5cGVvZiBlLndpdGhDcmVkZW50aWFscyE9XCJ1bmRlZmluZWRcIiYmKGUud2l0aENyZWRlbnRpYWxzPSEhdC53aXRoQ3JlZGVudGlhbHMpfWZ1bmN0aW9uIGdlbmVyYWxDYWxsYmFjayhlKXtsYXN0VmFsdWU9ZX1mdW5jdGlvbiB1cmxhcHBlbmQoZSx0KXtyZXR1cm4gZSsoL1xcPy8udGVzdChlKT9cIiZcIjpcIj9cIikrdH1mdW5jdGlvbiBoYW5kbGVKc29ucChlLHQsbixyKXt2YXIgaT11bmlxaWQrKyxzPWUuanNvbnBDYWxsYmFja3x8XCJjYWxsYmFja1wiLG89ZS5qc29ucENhbGxiYWNrTmFtZXx8cmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeChpKSx1PW5ldyBSZWdFeHAoXCIoKF58XFxcXD98JilcIitzK1wiKT0oW14mXSspXCIpLGE9ci5tYXRjaCh1KSxmPWRvYy5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpLGw9MCxjPW5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1TSUUgMTAuMFwiKSE9PS0xO3JldHVybiBhP2FbM109PT1cIj9cIj9yPXIucmVwbGFjZSh1LFwiJDE9XCIrbyk6bz1hWzNdOnI9dXJsYXBwZW5kKHIscytcIj1cIitvKSx3aW5bb109Z2VuZXJhbENhbGxiYWNrLGYudHlwZT1cInRleHQvamF2YXNjcmlwdFwiLGYuc3JjPXIsZi5hc3luYz0hMCx0eXBlb2YgZi5vbnJlYWR5c3RhdGVjaGFuZ2UhPVwidW5kZWZpbmVkXCImJiFjJiYoZi5odG1sRm9yPWYuaWQ9XCJfcmVxd2VzdF9cIitpKSxmLm9ubG9hZD1mLm9ucmVhZHlzdGF0ZWNoYW5nZT1mdW5jdGlvbigpe2lmKGZbcmVhZHlTdGF0ZV0mJmZbcmVhZHlTdGF0ZV0hPT1cImNvbXBsZXRlXCImJmZbcmVhZHlTdGF0ZV0hPT1cImxvYWRlZFwifHxsKXJldHVybiExO2Yub25sb2FkPWYub25yZWFkeXN0YXRlY2hhbmdlPW51bGwsZi5vbmNsaWNrJiZmLm9uY2xpY2soKSx0KGxhc3RWYWx1ZSksbGFzdFZhbHVlPXVuZGVmaW5lZCxoZWFkLnJlbW92ZUNoaWxkKGYpLGw9MX0saGVhZC5hcHBlbmRDaGlsZChmKSx7YWJvcnQ6ZnVuY3Rpb24oKXtmLm9ubG9hZD1mLm9ucmVhZHlzdGF0ZWNoYW5nZT1udWxsLG4oe30sXCJSZXF1ZXN0IGlzIGFib3J0ZWQ6IHRpbWVvdXRcIix7fSksbGFzdFZhbHVlPXVuZGVmaW5lZCxoZWFkLnJlbW92ZUNoaWxkKGYpLGw9MX19fWZ1bmN0aW9uIGdldFJlcXVlc3QoZSx0KXt2YXIgbj10aGlzLm8scj0obi5tZXRob2R8fFwiR0VUXCIpLnRvVXBwZXJDYXNlKCksaT10eXBlb2Ygbj09XCJzdHJpbmdcIj9uOm4udXJsLHM9bi5wcm9jZXNzRGF0YSE9PSExJiZuLmRhdGEmJnR5cGVvZiBuLmRhdGEhPVwic3RyaW5nXCI/cmVxd2VzdC50b1F1ZXJ5U3RyaW5nKG4uZGF0YSk6bi5kYXRhfHxudWxsLG8sdT0hMTtyZXR1cm4obltcInR5cGVcIl09PVwianNvbnBcInx8cj09XCJHRVRcIikmJnMmJihpPXVybGFwcGVuZChpLHMpLHM9bnVsbCksbltcInR5cGVcIl09PVwianNvbnBcIj9oYW5kbGVKc29ucChuLGUsdCxpKToobz1uLnhociYmbi54aHIobil8fHhocihuKSxvLm9wZW4ocixpLG4uYXN5bmM9PT0hMT8hMTohMCksc2V0SGVhZGVycyhvLG4pLHNldENyZWRlbnRpYWxzKG8sbiksd2luW3hEb21haW5SZXF1ZXN0XSYmbyBpbnN0YW5jZW9mIHdpblt4RG9tYWluUmVxdWVzdF0/KG8ub25sb2FkPWUsby5vbmVycm9yPXQsby5vbnByb2dyZXNzPWZ1bmN0aW9uKCl7fSx1PSEwKTpvLm9ucmVhZHlzdGF0ZWNoYW5nZT1oYW5kbGVSZWFkeVN0YXRlKHRoaXMsZSx0KSxuLmJlZm9yZSYmbi5iZWZvcmUobyksdT9zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7by5zZW5kKHMpfSwyMDApOm8uc2VuZChzKSxvKX1mdW5jdGlvbiBSZXF3ZXN0KGUsdCl7dGhpcy5vPWUsdGhpcy5mbj10LGluaXQuYXBwbHkodGhpcyxhcmd1bWVudHMpfWZ1bmN0aW9uIHNldFR5cGUoZSl7aWYoZS5tYXRjaChcImpzb25cIikpcmV0dXJuXCJqc29uXCI7aWYoZS5tYXRjaChcImphdmFzY3JpcHRcIikpcmV0dXJuXCJqc1wiO2lmKGUubWF0Y2goXCJ0ZXh0XCIpKXJldHVyblwiaHRtbFwiO2lmKGUubWF0Y2goXCJ4bWxcIikpcmV0dXJuXCJ4bWxcIn1mdW5jdGlvbiBpbml0KG8sZm4pe2Z1bmN0aW9uIGNvbXBsZXRlKGUpe28udGltZW91dCYmY2xlYXJUaW1lb3V0KHNlbGYudGltZW91dCksc2VsZi50aW1lb3V0PW51bGw7d2hpbGUoc2VsZi5fY29tcGxldGVIYW5kbGVycy5sZW5ndGg+MClzZWxmLl9jb21wbGV0ZUhhbmRsZXJzLnNoaWZ0KCkoZSl9ZnVuY3Rpb24gc3VjY2VzcyhyZXNwKXt2YXIgdHlwZT1vLnR5cGV8fHNldFR5cGUocmVzcC5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtVHlwZVwiKSk7cmVzcD10eXBlIT09XCJqc29ucFwiP3NlbGYucmVxdWVzdDpyZXNwO3ZhciBmaWx0ZXJlZFJlc3BvbnNlPWdsb2JhbFNldHVwT3B0aW9ucy5kYXRhRmlsdGVyKHJlc3AucmVzcG9uc2VUZXh0LHR5cGUpLHI9ZmlsdGVyZWRSZXNwb25zZTt0cnl7cmVzcC5yZXNwb25zZVRleHQ9cn1jYXRjaChlKXt9aWYocilzd2l0Y2godHlwZSl7Y2FzZVwianNvblwiOnRyeXtyZXNwPXdpbi5KU09OP3dpbi5KU09OLnBhcnNlKHIpOmV2YWwoXCIoXCIrcitcIilcIil9Y2F0Y2goZXJyKXtyZXR1cm4gZXJyb3IocmVzcCxcIkNvdWxkIG5vdCBwYXJzZSBKU09OIGluIHJlc3BvbnNlXCIsZXJyKX1icmVhaztjYXNlXCJqc1wiOnJlc3A9ZXZhbChyKTticmVhaztjYXNlXCJodG1sXCI6cmVzcD1yO2JyZWFrO2Nhc2VcInhtbFwiOnJlc3A9cmVzcC5yZXNwb25zZVhNTCYmcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yJiZyZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IuZXJyb3JDb2RlJiZyZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IucmVhc29uP251bGw6cmVzcC5yZXNwb25zZVhNTH1zZWxmLl9yZXNwb25zZUFyZ3MucmVzcD1yZXNwLHNlbGYuX2Z1bGZpbGxlZD0hMCxmbihyZXNwKSxzZWxmLl9zdWNjZXNzSGFuZGxlcihyZXNwKTt3aGlsZShzZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLmxlbmd0aD4wKXJlc3A9c2VsZi5fZnVsZmlsbG1lbnRIYW5kbGVycy5zaGlmdCgpKHJlc3ApO2NvbXBsZXRlKHJlc3ApfWZ1bmN0aW9uIGVycm9yKGUsdCxuKXtlPXNlbGYucmVxdWVzdCxzZWxmLl9yZXNwb25zZUFyZ3MucmVzcD1lLHNlbGYuX3Jlc3BvbnNlQXJncy5tc2c9dCxzZWxmLl9yZXNwb25zZUFyZ3MudD1uLHNlbGYuX2VycmVkPSEwO3doaWxlKHNlbGYuX2Vycm9ySGFuZGxlcnMubGVuZ3RoPjApc2VsZi5fZXJyb3JIYW5kbGVycy5zaGlmdCgpKGUsdCxuKTtjb21wbGV0ZShlKX10aGlzLnVybD10eXBlb2Ygbz09XCJzdHJpbmdcIj9vOm8udXJsLHRoaXMudGltZW91dD1udWxsLHRoaXMuX2Z1bGZpbGxlZD0hMSx0aGlzLl9zdWNjZXNzSGFuZGxlcj1mdW5jdGlvbigpe30sdGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycz1bXSx0aGlzLl9lcnJvckhhbmRsZXJzPVtdLHRoaXMuX2NvbXBsZXRlSGFuZGxlcnM9W10sdGhpcy5fZXJyZWQ9ITEsdGhpcy5fcmVzcG9uc2VBcmdzPXt9O3ZhciBzZWxmPXRoaXM7Zm49Zm58fGZ1bmN0aW9uKCl7fSxvLnRpbWVvdXQmJih0aGlzLnRpbWVvdXQ9c2V0VGltZW91dChmdW5jdGlvbigpe3NlbGYuYWJvcnQoKX0sby50aW1lb3V0KSksby5zdWNjZXNzJiYodGhpcy5fc3VjY2Vzc0hhbmRsZXI9ZnVuY3Rpb24oKXtvLnN1Y2Nlc3MuYXBwbHkobyxhcmd1bWVudHMpfSksby5lcnJvciYmdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGZ1bmN0aW9uKCl7by5lcnJvci5hcHBseShvLGFyZ3VtZW50cyl9KSxvLmNvbXBsZXRlJiZ0aGlzLl9jb21wbGV0ZUhhbmRsZXJzLnB1c2goZnVuY3Rpb24oKXtvLmNvbXBsZXRlLmFwcGx5KG8sYXJndW1lbnRzKX0pLHRoaXMucmVxdWVzdD1nZXRSZXF1ZXN0LmNhbGwodGhpcyxzdWNjZXNzLGVycm9yKX1mdW5jdGlvbiByZXF3ZXN0KGUsdCl7cmV0dXJuIG5ldyBSZXF3ZXN0KGUsdCl9ZnVuY3Rpb24gbm9ybWFsaXplKGUpe3JldHVybiBlP2UucmVwbGFjZSgvXFxyP1xcbi9nLFwiXFxyXFxuXCIpOlwiXCJ9ZnVuY3Rpb24gc2VyaWFsKGUsdCl7dmFyIG49ZS5uYW1lLHI9ZS50YWdOYW1lLnRvTG93ZXJDYXNlKCksaT1mdW5jdGlvbihlKXtlJiYhZS5kaXNhYmxlZCYmdChuLG5vcm1hbGl6ZShlLmF0dHJpYnV0ZXMudmFsdWUmJmUuYXR0cmlidXRlcy52YWx1ZS5zcGVjaWZpZWQ/ZS52YWx1ZTplLnRleHQpKX0scyxvLHUsYTtpZihlLmRpc2FibGVkfHwhbilyZXR1cm47c3dpdGNoKHIpe2Nhc2VcImlucHV0XCI6L3Jlc2V0fGJ1dHRvbnxpbWFnZXxmaWxlL2kudGVzdChlLnR5cGUpfHwocz0vY2hlY2tib3gvaS50ZXN0KGUudHlwZSksbz0vcmFkaW8vaS50ZXN0KGUudHlwZSksdT1lLnZhbHVlLCghcyYmIW98fGUuY2hlY2tlZCkmJnQobixub3JtYWxpemUocyYmdT09PVwiXCI/XCJvblwiOnUpKSk7YnJlYWs7Y2FzZVwidGV4dGFyZWFcIjp0KG4sbm9ybWFsaXplKGUudmFsdWUpKTticmVhaztjYXNlXCJzZWxlY3RcIjppZihlLnR5cGUudG9Mb3dlckNhc2UoKT09PVwic2VsZWN0LW9uZVwiKWkoZS5zZWxlY3RlZEluZGV4Pj0wP2Uub3B0aW9uc1tlLnNlbGVjdGVkSW5kZXhdOm51bGwpO2Vsc2UgZm9yKGE9MDtlLmxlbmd0aCYmYTxlLmxlbmd0aDthKyspZS5vcHRpb25zW2FdLnNlbGVjdGVkJiZpKGUub3B0aW9uc1thXSl9fWZ1bmN0aW9uIGVhY2hGb3JtRWxlbWVudCgpe3ZhciBlPXRoaXMsdCxuLHI9ZnVuY3Rpb24odCxuKXt2YXIgcixpLHM7Zm9yKHI9MDtyPG4ubGVuZ3RoO3IrKyl7cz10W2J5VGFnXShuW3JdKTtmb3IoaT0wO2k8cy5sZW5ndGg7aSsrKXNlcmlhbChzW2ldLGUpfX07Zm9yKG49MDtuPGFyZ3VtZW50cy5sZW5ndGg7bisrKXQ9YXJndW1lbnRzW25dLC9pbnB1dHxzZWxlY3R8dGV4dGFyZWEvaS50ZXN0KHQudGFnTmFtZSkmJnNlcmlhbCh0LGUpLHIodCxbXCJpbnB1dFwiLFwic2VsZWN0XCIsXCJ0ZXh0YXJlYVwiXSl9ZnVuY3Rpb24gc2VyaWFsaXplUXVlcnlTdHJpbmcoKXtyZXR1cm4gcmVxd2VzdC50b1F1ZXJ5U3RyaW5nKHJlcXdlc3Quc2VyaWFsaXplQXJyYXkuYXBwbHkobnVsbCxhcmd1bWVudHMpKX1mdW5jdGlvbiBzZXJpYWxpemVIYXNoKCl7dmFyIGU9e307cmV0dXJuIGVhY2hGb3JtRWxlbWVudC5hcHBseShmdW5jdGlvbih0LG4pe3QgaW4gZT8oZVt0XSYmIWlzQXJyYXkoZVt0XSkmJihlW3RdPVtlW3RdXSksZVt0XS5wdXNoKG4pKTplW3RdPW59LGFyZ3VtZW50cyksZX1mdW5jdGlvbiBidWlsZFBhcmFtcyhlLHQsbixyKXt2YXIgaSxzLG8sdT0vXFxbXFxdJC87aWYoaXNBcnJheSh0KSlmb3Iocz0wO3QmJnM8dC5sZW5ndGg7cysrKW89dFtzXSxufHx1LnRlc3QoZSk/cihlLG8pOmJ1aWxkUGFyYW1zKGUrXCJbXCIrKHR5cGVvZiBvPT1cIm9iamVjdFwiP3M6XCJcIikrXCJdXCIsbyxuLHIpO2Vsc2UgaWYodCYmdC50b1N0cmluZygpPT09XCJbb2JqZWN0IE9iamVjdF1cIilmb3IoaSBpbiB0KWJ1aWxkUGFyYW1zKGUrXCJbXCIraStcIl1cIix0W2ldLG4scik7ZWxzZSByKGUsdCl9dmFyIHdpbj13aW5kb3csZG9jPWRvY3VtZW50LGh0dHBzUmU9L15odHRwLyx0d29IdW5kbz0vXigyMFxcZHwxMjIzKSQvLGJ5VGFnPVwiZ2V0RWxlbWVudHNCeVRhZ05hbWVcIixyZWFkeVN0YXRlPVwicmVhZHlTdGF0ZVwiLGNvbnRlbnRUeXBlPVwiQ29udGVudC1UeXBlXCIscmVxdWVzdGVkV2l0aD1cIlgtUmVxdWVzdGVkLVdpdGhcIixoZWFkPWRvY1tieVRhZ10oXCJoZWFkXCIpWzBdLHVuaXFpZD0wLGNhbGxiYWNrUHJlZml4PVwicmVxd2VzdF9cIisgKyhuZXcgRGF0ZSksbGFzdFZhbHVlLHhtbEh0dHBSZXF1ZXN0PVwiWE1MSHR0cFJlcXVlc3RcIix4RG9tYWluUmVxdWVzdD1cIlhEb21haW5SZXF1ZXN0XCIsbm9vcD1mdW5jdGlvbigpe30saXNBcnJheT10eXBlb2YgQXJyYXkuaXNBcnJheT09XCJmdW5jdGlvblwiP0FycmF5LmlzQXJyYXk6ZnVuY3Rpb24oZSl7cmV0dXJuIGUgaW5zdGFuY2VvZiBBcnJheX0sZGVmYXVsdEhlYWRlcnM9e2NvbnRlbnRUeXBlOlwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCIscmVxdWVzdGVkV2l0aDp4bWxIdHRwUmVxdWVzdCxhY2NlcHQ6e1wiKlwiOlwidGV4dC9qYXZhc2NyaXB0LCB0ZXh0L2h0bWwsIGFwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwsICovKlwiLHhtbDpcImFwcGxpY2F0aW9uL3htbCwgdGV4dC94bWxcIixodG1sOlwidGV4dC9odG1sXCIsdGV4dDpcInRleHQvcGxhaW5cIixqc29uOlwiYXBwbGljYXRpb24vanNvbiwgdGV4dC9qYXZhc2NyaXB0XCIsanM6XCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0LCB0ZXh0L2phdmFzY3JpcHRcIn19LHhocj1mdW5jdGlvbihlKXtpZihlLmNyb3NzT3JpZ2luPT09ITApe3ZhciB0PXdpblt4bWxIdHRwUmVxdWVzdF0/bmV3IFhNTEh0dHBSZXF1ZXN0Om51bGw7aWYodCYmXCJ3aXRoQ3JlZGVudGlhbHNcImluIHQpcmV0dXJuIHQ7aWYod2luW3hEb21haW5SZXF1ZXN0XSlyZXR1cm4gbmV3IFhEb21haW5SZXF1ZXN0O3Rocm93IG5ldyBFcnJvcihcIkJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBjcm9zcy1vcmlnaW4gcmVxdWVzdHNcIil9cmV0dXJuIHdpblt4bWxIdHRwUmVxdWVzdF0/bmV3IFhNTEh0dHBSZXF1ZXN0Om5ldyBBY3RpdmVYT2JqZWN0KFwiTWljcm9zb2Z0LlhNTEhUVFBcIil9LGdsb2JhbFNldHVwT3B0aW9ucz17ZGF0YUZpbHRlcjpmdW5jdGlvbihlKXtyZXR1cm4gZX19O3JldHVybiBSZXF3ZXN0LnByb3RvdHlwZT17YWJvcnQ6ZnVuY3Rpb24oKXt0aGlzLl9hYm9ydGVkPSEwLHRoaXMucmVxdWVzdC5hYm9ydCgpfSxyZXRyeTpmdW5jdGlvbigpe2luaXQuY2FsbCh0aGlzLHRoaXMubyx0aGlzLmZuKX0sdGhlbjpmdW5jdGlvbihlLHQpe3JldHVybiBlPWV8fGZ1bmN0aW9uKCl7fSx0PXR8fGZ1bmN0aW9uKCl7fSx0aGlzLl9mdWxmaWxsZWQ/dGhpcy5fcmVzcG9uc2VBcmdzLnJlc3A9ZSh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCk6dGhpcy5fZXJyZWQ/dCh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCx0aGlzLl9yZXNwb25zZUFyZ3MubXNnLHRoaXMuX3Jlc3BvbnNlQXJncy50KToodGhpcy5fZnVsZmlsbG1lbnRIYW5kbGVycy5wdXNoKGUpLHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaCh0KSksdGhpc30sYWx3YXlzOmZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLl9mdWxmaWxsZWR8fHRoaXMuX2VycmVkP2UodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3ApOnRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChlKSx0aGlzfSxmYWlsOmZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLl9lcnJlZD9lKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwLHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csdGhpcy5fcmVzcG9uc2VBcmdzLnQpOnRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChlKSx0aGlzfSxcImNhdGNoXCI6ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuZmFpbChlKX19LHJlcXdlc3Quc2VyaWFsaXplQXJyYXk9ZnVuY3Rpb24oKXt2YXIgZT1bXTtyZXR1cm4gZWFjaEZvcm1FbGVtZW50LmFwcGx5KGZ1bmN0aW9uKHQsbil7ZS5wdXNoKHtuYW1lOnQsdmFsdWU6bn0pfSxhcmd1bWVudHMpLGV9LHJlcXdlc3Quc2VyaWFsaXplPWZ1bmN0aW9uKCl7aWYoYXJndW1lbnRzLmxlbmd0aD09PTApcmV0dXJuXCJcIjt2YXIgZSx0LG49QXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLDApO3JldHVybiBlPW4ucG9wKCksZSYmZS5ub2RlVHlwZSYmbi5wdXNoKGUpJiYoZT1udWxsKSxlJiYoZT1lLnR5cGUpLGU9PVwibWFwXCI/dD1zZXJpYWxpemVIYXNoOmU9PVwiYXJyYXlcIj90PXJlcXdlc3Quc2VyaWFsaXplQXJyYXk6dD1zZXJpYWxpemVRdWVyeVN0cmluZyx0LmFwcGx5KG51bGwsbil9LHJlcXdlc3QudG9RdWVyeVN0cmluZz1mdW5jdGlvbihlLHQpe3ZhciBuLHIsaT10fHwhMSxzPVtdLG89ZW5jb2RlVVJJQ29tcG9uZW50LHU9ZnVuY3Rpb24oZSx0KXt0PVwiZnVuY3Rpb25cIj09dHlwZW9mIHQ/dCgpOnQ9PW51bGw/XCJcIjp0LHNbcy5sZW5ndGhdPW8oZSkrXCI9XCIrbyh0KX07aWYoaXNBcnJheShlKSlmb3Iocj0wO2UmJnI8ZS5sZW5ndGg7cisrKXUoZVtyXS5uYW1lLGVbcl0udmFsdWUpO2Vsc2UgZm9yKG4gaW4gZSllLmhhc093blByb3BlcnR5KG4pJiZidWlsZFBhcmFtcyhuLGVbbl0saSx1KTtyZXR1cm4gcy5qb2luKFwiJlwiKS5yZXBsYWNlKC8lMjAvZyxcIitcIil9LHJlcXdlc3QuZ2V0Y2FsbGJhY2tQcmVmaXg9ZnVuY3Rpb24oKXtyZXR1cm4gY2FsbGJhY2tQcmVmaXh9LHJlcXdlc3QuY29tcGF0PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGUmJihlLnR5cGUmJihlLm1ldGhvZD1lLnR5cGUpJiZkZWxldGUgZS50eXBlLGUuZGF0YVR5cGUmJihlLnR5cGU9ZS5kYXRhVHlwZSksZS5qc29ucENhbGxiYWNrJiYoZS5qc29ucENhbGxiYWNrTmFtZT1lLmpzb25wQ2FsbGJhY2spJiZkZWxldGUgZS5qc29ucENhbGxiYWNrLGUuanNvbnAmJihlLmpzb25wQ2FsbGJhY2s9ZS5qc29ucCkpLG5ldyBSZXF3ZXN0KGUsdCl9LHJlcXdlc3QuYWpheFNldHVwPWZ1bmN0aW9uKGUpe2U9ZXx8e307Zm9yKHZhciB0IGluIGUpZ2xvYmFsU2V0dXBPcHRpb25zW3RdPWVbdF19LHJlcXdlc3R9KSIsIi8qIVxuICAqIFJlcXdlc3QhIEEgZ2VuZXJhbCBwdXJwb3NlIFhIUiBjb25uZWN0aW9uIG1hbmFnZXJcbiAgKiBsaWNlbnNlIE1JVCAoYykgRHVzdGluIERpYXogMjAxNFxuICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kZWQvcmVxd2VzdFxuICAqL1xuXG4hZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGRlZmluaXRpb24pIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpXG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSBkZWZpbmUoZGVmaW5pdGlvbilcbiAgZWxzZSBjb250ZXh0W25hbWVdID0gZGVmaW5pdGlvbigpXG59KCdyZXF3ZXN0JywgdGhpcywgZnVuY3Rpb24gKCkge1xuXG4gIHZhciB3aW4gPSB3aW5kb3dcbiAgICAsIGRvYyA9IGRvY3VtZW50XG4gICAgLCBodHRwc1JlID0gL15odHRwL1xuICAgICwgcHJvdG9jb2xSZSA9IC8oXlxcdyspOlxcL1xcLy9cbiAgICAsIHR3b0h1bmRvID0gL14oMjBcXGR8MTIyMykkLyAvL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTAwNDY5NzIvbXNpZS1yZXR1cm5zLXN0YXR1cy1jb2RlLW9mLTEyMjMtZm9yLWFqYXgtcmVxdWVzdFxuICAgICwgYnlUYWcgPSAnZ2V0RWxlbWVudHNCeVRhZ05hbWUnXG4gICAgLCByZWFkeVN0YXRlID0gJ3JlYWR5U3RhdGUnXG4gICAgLCBjb250ZW50VHlwZSA9ICdDb250ZW50LVR5cGUnXG4gICAgLCByZXF1ZXN0ZWRXaXRoID0gJ1gtUmVxdWVzdGVkLVdpdGgnXG4gICAgLCBoZWFkID0gZG9jW2J5VGFnXSgnaGVhZCcpWzBdXG4gICAgLCB1bmlxaWQgPSAwXG4gICAgLCBjYWxsYmFja1ByZWZpeCA9ICdyZXF3ZXN0XycgKyAoK25ldyBEYXRlKCkpXG4gICAgLCBsYXN0VmFsdWUgLy8gZGF0YSBzdG9yZWQgYnkgdGhlIG1vc3QgcmVjZW50IEpTT05QIGNhbGxiYWNrXG4gICAgLCB4bWxIdHRwUmVxdWVzdCA9ICdYTUxIdHRwUmVxdWVzdCdcbiAgICAsIHhEb21haW5SZXF1ZXN0ID0gJ1hEb21haW5SZXF1ZXN0J1xuICAgICwgbm9vcCA9IGZ1bmN0aW9uICgpIHt9XG5cbiAgICAsIGlzQXJyYXkgPSB0eXBlb2YgQXJyYXkuaXNBcnJheSA9PSAnZnVuY3Rpb24nXG4gICAgICAgID8gQXJyYXkuaXNBcnJheVxuICAgICAgICA6IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICByZXR1cm4gYSBpbnN0YW5jZW9mIEFycmF5XG4gICAgICAgICAgfVxuXG4gICAgLCBkZWZhdWx0SGVhZGVycyA9IHtcbiAgICAgICAgICAnY29udGVudFR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xuICAgICAgICAsICdyZXF1ZXN0ZWRXaXRoJzogeG1sSHR0cFJlcXVlc3RcbiAgICAgICAgLCAnYWNjZXB0Jzoge1xuICAgICAgICAgICAgICAnKic6ICAndGV4dC9qYXZhc2NyaXB0LCB0ZXh0L2h0bWwsIGFwcGxpY2F0aW9uL3htbCwgdGV4dC94bWwsICovKidcbiAgICAgICAgICAgICwgJ3htbCc6ICAnYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbCdcbiAgICAgICAgICAgICwgJ2h0bWwnOiAndGV4dC9odG1sJ1xuICAgICAgICAgICAgLCAndGV4dCc6ICd0ZXh0L3BsYWluJ1xuICAgICAgICAgICAgLCAnanNvbic6ICdhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L2phdmFzY3JpcHQnXG4gICAgICAgICAgICAsICdqcyc6ICAgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQsIHRleHQvamF2YXNjcmlwdCdcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAsIHhociA9IGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgLy8gaXMgaXQgeC1kb21haW5cbiAgICAgICAgaWYgKG9bJ2Nyb3NzT3JpZ2luJ10gPT09IHRydWUpIHtcbiAgICAgICAgICB2YXIgeGhyID0gd2luW3htbEh0dHBSZXF1ZXN0XSA/IG5ldyBYTUxIdHRwUmVxdWVzdCgpIDogbnVsbFxuICAgICAgICAgIGlmICh4aHIgJiYgJ3dpdGhDcmVkZW50aWFscycgaW4geGhyKSB7XG4gICAgICAgICAgICByZXR1cm4geGhyXG4gICAgICAgICAgfSBlbHNlIGlmICh3aW5beERvbWFpblJlcXVlc3RdKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhEb21haW5SZXF1ZXN0KClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCcm93c2VyIGRvZXMgbm90IHN1cHBvcnQgY3Jvc3Mtb3JpZ2luIHJlcXVlc3RzJylcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAod2luW3htbEh0dHBSZXF1ZXN0XSkge1xuICAgICAgICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgLCBnbG9iYWxTZXR1cE9wdGlvbnMgPSB7XG4gICAgICAgIGRhdGFGaWx0ZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgfVxuICAgICAgfVxuXG4gIGZ1bmN0aW9uIHN1Y2NlZWQocikge1xuICAgIHZhciBwcm90b2NvbCA9IHByb3RvY29sUmUuZXhlYyhyLnVybCk7XG4gICAgcHJvdG9jb2wgPSAocHJvdG9jb2wgJiYgcHJvdG9jb2xbMV0pIHx8IHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbDtcbiAgICByZXR1cm4gaHR0cHNSZS50ZXN0KHByb3RvY29sKSA/IHR3b0h1bmRvLnRlc3Qoci5yZXF1ZXN0LnN0YXR1cykgOiAhIXIucmVxdWVzdC5yZXNwb25zZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVJlYWR5U3RhdGUociwgc3VjY2VzcywgZXJyb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gdXNlIF9hYm9ydGVkIHRvIG1pdGlnYXRlIGFnYWluc3QgSUUgZXJyIGMwMGMwMjNmXG4gICAgICAvLyAoY2FuJ3QgcmVhZCBwcm9wcyBvbiBhYm9ydGVkIHJlcXVlc3Qgb2JqZWN0cylcbiAgICAgIGlmIChyLl9hYm9ydGVkKSByZXR1cm4gZXJyb3Ioci5yZXF1ZXN0KVxuICAgICAgaWYgKHIucmVxdWVzdCAmJiByLnJlcXVlc3RbcmVhZHlTdGF0ZV0gPT0gNCkge1xuICAgICAgICByLnJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gbm9vcFxuICAgICAgICBpZiAoc3VjY2VlZChyKSkgc3VjY2VzcyhyLnJlcXVlc3QpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBlcnJvcihyLnJlcXVlc3QpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0SGVhZGVycyhodHRwLCBvKSB7XG4gICAgdmFyIGhlYWRlcnMgPSBvWydoZWFkZXJzJ10gfHwge31cbiAgICAgICwgaFxuXG4gICAgaGVhZGVyc1snQWNjZXB0J10gPSBoZWFkZXJzWydBY2NlcHQnXVxuICAgICAgfHwgZGVmYXVsdEhlYWRlcnNbJ2FjY2VwdCddW29bJ3R5cGUnXV1cbiAgICAgIHx8IGRlZmF1bHRIZWFkZXJzWydhY2NlcHQnXVsnKiddXG5cbiAgICB2YXIgaXNBRm9ybURhdGEgPSB0eXBlb2YgRm9ybURhdGEgPT09ICdmdW5jdGlvbicgJiYgKG9bJ2RhdGEnXSBpbnN0YW5jZW9mIEZvcm1EYXRhKTtcbiAgICAvLyBicmVha3MgY3Jvc3Mtb3JpZ2luIHJlcXVlc3RzIHdpdGggbGVnYWN5IGJyb3dzZXJzXG4gICAgaWYgKCFvWydjcm9zc09yaWdpbiddICYmICFoZWFkZXJzW3JlcXVlc3RlZFdpdGhdKSBoZWFkZXJzW3JlcXVlc3RlZFdpdGhdID0gZGVmYXVsdEhlYWRlcnNbJ3JlcXVlc3RlZFdpdGgnXVxuICAgIGlmICghaGVhZGVyc1tjb250ZW50VHlwZV0gJiYgIWlzQUZvcm1EYXRhKSBoZWFkZXJzW2NvbnRlbnRUeXBlXSA9IG9bJ2NvbnRlbnRUeXBlJ10gfHwgZGVmYXVsdEhlYWRlcnNbJ2NvbnRlbnRUeXBlJ11cbiAgICBmb3IgKGggaW4gaGVhZGVycylcbiAgICAgIGhlYWRlcnMuaGFzT3duUHJvcGVydHkoaCkgJiYgJ3NldFJlcXVlc3RIZWFkZXInIGluIGh0dHAgJiYgaHR0cC5zZXRSZXF1ZXN0SGVhZGVyKGgsIGhlYWRlcnNbaF0pXG4gIH1cblxuICBmdW5jdGlvbiBzZXRDcmVkZW50aWFscyhodHRwLCBvKSB7XG4gICAgaWYgKHR5cGVvZiBvWyd3aXRoQ3JlZGVudGlhbHMnXSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGh0dHAud2l0aENyZWRlbnRpYWxzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgaHR0cC53aXRoQ3JlZGVudGlhbHMgPSAhIW9bJ3dpdGhDcmVkZW50aWFscyddXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhbENhbGxiYWNrKGRhdGEpIHtcbiAgICBsYXN0VmFsdWUgPSBkYXRhXG4gIH1cblxuICBmdW5jdGlvbiB1cmxhcHBlbmQgKHVybCwgcykge1xuICAgIHJldHVybiB1cmwgKyAoL1xcPy8udGVzdCh1cmwpID8gJyYnIDogJz8nKSArIHNcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUpzb25wKG8sIGZuLCBlcnIsIHVybCkge1xuICAgIHZhciByZXFJZCA9IHVuaXFpZCsrXG4gICAgICAsIGNia2V5ID0gb1snanNvbnBDYWxsYmFjayddIHx8ICdjYWxsYmFjaycgLy8gdGhlICdjYWxsYmFjaycga2V5XG4gICAgICAsIGNidmFsID0gb1snanNvbnBDYWxsYmFja05hbWUnXSB8fCByZXF3ZXN0LmdldGNhbGxiYWNrUHJlZml4KHJlcUlkKVxuICAgICAgLCBjYnJlZyA9IG5ldyBSZWdFeHAoJygoXnxcXFxcP3wmKScgKyBjYmtleSArICcpPShbXiZdKyknKVxuICAgICAgLCBtYXRjaCA9IHVybC5tYXRjaChjYnJlZylcbiAgICAgICwgc2NyaXB0ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgICAsIGxvYWRlZCA9IDBcbiAgICAgICwgaXNJRTEwID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNU0lFIDEwLjAnKSAhPT0gLTFcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgaWYgKG1hdGNoWzNdID09PSAnPycpIHtcbiAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoY2JyZWcsICckMT0nICsgY2J2YWwpIC8vIHdpbGRjYXJkIGNhbGxiYWNrIGZ1bmMgbmFtZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2J2YWwgPSBtYXRjaFszXSAvLyBwcm92aWRlZCBjYWxsYmFjayBmdW5jIG5hbWVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdXJsID0gdXJsYXBwZW5kKHVybCwgY2JrZXkgKyAnPScgKyBjYnZhbCkgLy8gbm8gY2FsbGJhY2sgZGV0YWlscywgYWRkICdlbVxuICAgIH1cblxuICAgIHdpbltjYnZhbF0gPSBnZW5lcmFsQ2FsbGJhY2tcblxuICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCdcbiAgICBzY3JpcHQuc3JjID0gdXJsXG4gICAgc2NyaXB0LmFzeW5jID0gdHJ1ZVxuICAgIGlmICh0eXBlb2Ygc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSAhPT0gJ3VuZGVmaW5lZCcgJiYgIWlzSUUxMCkge1xuICAgICAgLy8gbmVlZCB0aGlzIGZvciBJRSBkdWUgdG8gb3V0LW9mLW9yZGVyIG9ucmVhZHlzdGF0ZWNoYW5nZSgpLCBiaW5kaW5nIHNjcmlwdFxuICAgICAgLy8gZXhlY3V0aW9uIHRvIGFuIGV2ZW50IGxpc3RlbmVyIGdpdmVzIHVzIGNvbnRyb2wgb3ZlciB3aGVuIHRoZSBzY3JpcHRcbiAgICAgIC8vIGlzIGV4ZWN1dGVkLiBTZWUgaHR0cDovL2phdWJvdXJnLm5ldC8yMDEwLzA3L2xvYWRpbmctc2NyaXB0LWFzLW9uY2xpY2staGFuZGxlci1vZi5odG1sXG4gICAgICBzY3JpcHQuaHRtbEZvciA9IHNjcmlwdC5pZCA9ICdfcmVxd2VzdF8nICsgcmVxSWRcbiAgICB9XG5cbiAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgoc2NyaXB0W3JlYWR5U3RhdGVdICYmIHNjcmlwdFtyZWFkeVN0YXRlXSAhPT0gJ2NvbXBsZXRlJyAmJiBzY3JpcHRbcmVhZHlTdGF0ZV0gIT09ICdsb2FkZWQnKSB8fCBsb2FkZWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGxcbiAgICAgIHNjcmlwdC5vbmNsaWNrICYmIHNjcmlwdC5vbmNsaWNrKClcbiAgICAgIC8vIENhbGwgdGhlIHVzZXIgY2FsbGJhY2sgd2l0aCB0aGUgbGFzdCB2YWx1ZSBzdG9yZWQgYW5kIGNsZWFuIHVwIHZhbHVlcyBhbmQgc2NyaXB0cy5cbiAgICAgIGZuKGxhc3RWYWx1ZSlcbiAgICAgIGxhc3RWYWx1ZSA9IHVuZGVmaW5lZFxuICAgICAgaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICBsb2FkZWQgPSAxXG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBzY3JpcHQgdG8gdGhlIERPTSBoZWFkXG4gICAgaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpXG5cbiAgICAvLyBFbmFibGUgSlNPTlAgdGltZW91dFxuICAgIHJldHVybiB7XG4gICAgICBhYm9ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICBzY3JpcHQub25sb2FkID0gc2NyaXB0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGxcbiAgICAgICAgZXJyKHt9LCAnUmVxdWVzdCBpcyBhYm9ydGVkOiB0aW1lb3V0Jywge30pXG4gICAgICAgIGxhc3RWYWx1ZSA9IHVuZGVmaW5lZFxuICAgICAgICBoZWFkLnJlbW92ZUNoaWxkKHNjcmlwdClcbiAgICAgICAgbG9hZGVkID0gMVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlcXVlc3QoZm4sIGVycikge1xuICAgIHZhciBvID0gdGhpcy5vXG4gICAgICAsIG1ldGhvZCA9IChvWydtZXRob2QnXSB8fCAnR0VUJykudG9VcHBlckNhc2UoKVxuICAgICAgLCB1cmwgPSB0eXBlb2YgbyA9PT0gJ3N0cmluZycgPyBvIDogb1sndXJsJ11cbiAgICAgIC8vIGNvbnZlcnQgbm9uLXN0cmluZyBvYmplY3RzIHRvIHF1ZXJ5LXN0cmluZyBmb3JtIHVubGVzcyBvWydwcm9jZXNzRGF0YSddIGlzIGZhbHNlXG4gICAgICAsIGRhdGEgPSAob1sncHJvY2Vzc0RhdGEnXSAhPT0gZmFsc2UgJiYgb1snZGF0YSddICYmIHR5cGVvZiBvWydkYXRhJ10gIT09ICdzdHJpbmcnKVxuICAgICAgICA/IHJlcXdlc3QudG9RdWVyeVN0cmluZyhvWydkYXRhJ10pXG4gICAgICAgIDogKG9bJ2RhdGEnXSB8fCBudWxsKVxuICAgICAgLCBodHRwXG4gICAgICAsIHNlbmRXYWl0ID0gZmFsc2VcblxuICAgIC8vIGlmIHdlJ3JlIHdvcmtpbmcgb24gYSBHRVQgcmVxdWVzdCBhbmQgd2UgaGF2ZSBkYXRhIHRoZW4gd2Ugc2hvdWxkIGFwcGVuZFxuICAgIC8vIHF1ZXJ5IHN0cmluZyB0byBlbmQgb2YgVVJMIGFuZCBub3QgcG9zdCBkYXRhXG4gICAgaWYgKChvWyd0eXBlJ10gPT0gJ2pzb25wJyB8fCBtZXRob2QgPT0gJ0dFVCcpICYmIGRhdGEpIHtcbiAgICAgIHVybCA9IHVybGFwcGVuZCh1cmwsIGRhdGEpXG4gICAgICBkYXRhID0gbnVsbFxuICAgIH1cblxuICAgIGlmIChvWyd0eXBlJ10gPT0gJ2pzb25wJykgcmV0dXJuIGhhbmRsZUpzb25wKG8sIGZuLCBlcnIsIHVybClcblxuICAgIC8vIGdldCB0aGUgeGhyIGZyb20gdGhlIGZhY3RvcnkgaWYgcGFzc2VkXG4gICAgLy8gaWYgdGhlIGZhY3RvcnkgcmV0dXJucyBudWxsLCBmYWxsLWJhY2sgdG8gb3Vyc1xuICAgIGh0dHAgPSAoby54aHIgJiYgby54aHIobykpIHx8IHhocihvKVxuXG4gICAgaHR0cC5vcGVuKG1ldGhvZCwgdXJsLCBvWydhc3luYyddID09PSBmYWxzZSA/IGZhbHNlIDogdHJ1ZSlcbiAgICBzZXRIZWFkZXJzKGh0dHAsIG8pXG4gICAgc2V0Q3JlZGVudGlhbHMoaHR0cCwgbylcbiAgICBpZiAod2luW3hEb21haW5SZXF1ZXN0XSAmJiBodHRwIGluc3RhbmNlb2Ygd2luW3hEb21haW5SZXF1ZXN0XSkge1xuICAgICAgICBodHRwLm9ubG9hZCA9IGZuXG4gICAgICAgIGh0dHAub25lcnJvciA9IGVyclxuICAgICAgICAvLyBOT1RFOiBzZWVcbiAgICAgICAgLy8gaHR0cDovL3NvY2lhbC5tc2RuLm1pY3Jvc29mdC5jb20vRm9ydW1zL2VuLVVTL2lld2ViZGV2ZWxvcG1lbnQvdGhyZWFkLzMwZWYzYWRkLTc2N2MtNDQzNi1iOGE5LWYxY2ExOWI0ODEyZVxuICAgICAgICBodHRwLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbigpIHt9XG4gICAgICAgIHNlbmRXYWl0ID0gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICBodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZVJlYWR5U3RhdGUodGhpcywgZm4sIGVycilcbiAgICB9XG4gICAgb1snYmVmb3JlJ10gJiYgb1snYmVmb3JlJ10oaHR0cClcbiAgICBpZiAoc2VuZFdhaXQpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBodHRwLnNlbmQoZGF0YSlcbiAgICAgIH0sIDIwMClcbiAgICB9IGVsc2Uge1xuICAgICAgaHR0cC5zZW5kKGRhdGEpXG4gICAgfVxuICAgIHJldHVybiBodHRwXG4gIH1cblxuICBmdW5jdGlvbiBSZXF3ZXN0KG8sIGZuKSB7XG4gICAgdGhpcy5vID0gb1xuICAgIHRoaXMuZm4gPSBmblxuXG4gICAgaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gIH1cblxuICBmdW5jdGlvbiBzZXRUeXBlKGhlYWRlcikge1xuICAgIC8vIGpzb24sIGphdmFzY3JpcHQsIHRleHQvcGxhaW4sIHRleHQvaHRtbCwgeG1sXG4gICAgaWYgKGhlYWRlci5tYXRjaCgnanNvbicpKSByZXR1cm4gJ2pzb24nXG4gICAgaWYgKGhlYWRlci5tYXRjaCgnamF2YXNjcmlwdCcpKSByZXR1cm4gJ2pzJ1xuICAgIGlmIChoZWFkZXIubWF0Y2goJ3RleHQnKSkgcmV0dXJuICdodG1sJ1xuICAgIGlmIChoZWFkZXIubWF0Y2goJ3htbCcpKSByZXR1cm4gJ3htbCdcbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQobywgZm4pIHtcblxuICAgIHRoaXMudXJsID0gdHlwZW9mIG8gPT0gJ3N0cmluZycgPyBvIDogb1sndXJsJ11cbiAgICB0aGlzLnRpbWVvdXQgPSBudWxsXG5cbiAgICAvLyB3aGV0aGVyIHJlcXVlc3QgaGFzIGJlZW4gZnVsZmlsbGVkIGZvciBwdXJwb3NlXG4gICAgLy8gb2YgdHJhY2tpbmcgdGhlIFByb21pc2VzXG4gICAgdGhpcy5fZnVsZmlsbGVkID0gZmFsc2VcbiAgICAvLyBzdWNjZXNzIGhhbmRsZXJzXG4gICAgdGhpcy5fc3VjY2Vzc0hhbmRsZXIgPSBmdW5jdGlvbigpe31cbiAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJzID0gW11cbiAgICAvLyBlcnJvciBoYW5kbGVyc1xuICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMgPSBbXVxuICAgIC8vIGNvbXBsZXRlIChib3RoIHN1Y2Nlc3MgYW5kIGZhaWwpIGhhbmRsZXJzXG4gICAgdGhpcy5fY29tcGxldGVIYW5kbGVycyA9IFtdXG4gICAgdGhpcy5fZXJyZWQgPSBmYWxzZVxuICAgIHRoaXMuX3Jlc3BvbnNlQXJncyA9IHt9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgIGZuID0gZm4gfHwgZnVuY3Rpb24gKCkge31cblxuICAgIGlmIChvWyd0aW1lb3V0J10pIHtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmFib3J0KClcbiAgICAgIH0sIG9bJ3RpbWVvdXQnXSlcbiAgICB9XG5cbiAgICBpZiAob1snc3VjY2VzcyddKSB7XG4gICAgICB0aGlzLl9zdWNjZXNzSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb1snc3VjY2VzcyddLmFwcGx5KG8sIGFyZ3VtZW50cylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob1snZXJyb3InXSkge1xuICAgICAgdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgb1snZXJyb3InXS5hcHBseShvLCBhcmd1bWVudHMpXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChvWydjb21wbGV0ZSddKSB7XG4gICAgICB0aGlzLl9jb21wbGV0ZUhhbmRsZXJzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICBvWydjb21wbGV0ZSddLmFwcGx5KG8sIGFyZ3VtZW50cylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcGxldGUgKHJlc3ApIHtcbiAgICAgIG9bJ3RpbWVvdXQnXSAmJiBjbGVhclRpbWVvdXQoc2VsZi50aW1lb3V0KVxuICAgICAgc2VsZi50aW1lb3V0ID0gbnVsbFxuICAgICAgd2hpbGUgKHNlbGYuX2NvbXBsZXRlSGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICBzZWxmLl9jb21wbGV0ZUhhbmRsZXJzLnNoaWZ0KCkocmVzcClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWNjZXNzIChyZXNwKSB7XG4gICAgICB2YXIgdHlwZSA9IG9bJ3R5cGUnXSB8fCByZXNwICYmIHNldFR5cGUocmVzcC5nZXRSZXNwb25zZUhlYWRlcignQ29udGVudC1UeXBlJykpIC8vIHJlc3AgY2FuIGJlIHVuZGVmaW5lZCBpbiBJRVxuICAgICAgcmVzcCA9ICh0eXBlICE9PSAnanNvbnAnKSA/IHNlbGYucmVxdWVzdCA6IHJlc3BcbiAgICAgIC8vIHVzZSBnbG9iYWwgZGF0YSBmaWx0ZXIgb24gcmVzcG9uc2UgdGV4dFxuICAgICAgdmFyIGZpbHRlcmVkUmVzcG9uc2UgPSBnbG9iYWxTZXR1cE9wdGlvbnMuZGF0YUZpbHRlcihyZXNwLnJlc3BvbnNlVGV4dCwgdHlwZSlcbiAgICAgICAgLCByID0gZmlsdGVyZWRSZXNwb25zZVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzcC5yZXNwb25zZVRleHQgPSByXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIGNhbid0IGFzc2lnbiB0aGlzIGluIElFPD04LCBqdXN0IGlnbm9yZVxuICAgICAgfVxuICAgICAgaWYgKHIpIHtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ2pzb24nOlxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNwID0gd2luLkpTT04gPyB3aW4uSlNPTi5wYXJzZShyKSA6IGV2YWwoJygnICsgciArICcpJylcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBlcnJvcihyZXNwLCAnQ291bGQgbm90IHBhcnNlIEpTT04gaW4gcmVzcG9uc2UnLCBlcnIpXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2pzJzpcbiAgICAgICAgICByZXNwID0gZXZhbChyKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICAgIHJlc3AgPSByXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAneG1sJzpcbiAgICAgICAgICByZXNwID0gcmVzcC5yZXNwb25zZVhNTFxuICAgICAgICAgICAgICAmJiByZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IgLy8gSUUgdHJvbG9sb1xuICAgICAgICAgICAgICAmJiByZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3IuZXJyb3JDb2RlXG4gICAgICAgICAgICAgICYmIHJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvci5yZWFzb25cbiAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgOiByZXNwLnJlc3BvbnNlWE1MXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MucmVzcCA9IHJlc3BcbiAgICAgIHNlbGYuX2Z1bGZpbGxlZCA9IHRydWVcbiAgICAgIGZuKHJlc3ApXG4gICAgICBzZWxmLl9zdWNjZXNzSGFuZGxlcihyZXNwKVxuICAgICAgd2hpbGUgKHNlbGYuX2Z1bGZpbGxtZW50SGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXNwID0gc2VsZi5fZnVsZmlsbG1lbnRIYW5kbGVycy5zaGlmdCgpKHJlc3ApXG4gICAgICB9XG5cbiAgICAgIGNvbXBsZXRlKHJlc3ApXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IocmVzcCwgbXNnLCB0KSB7XG4gICAgICByZXNwID0gc2VsZi5yZXF1ZXN0XG4gICAgICBzZWxmLl9yZXNwb25zZUFyZ3MucmVzcCA9IHJlc3BcbiAgICAgIHNlbGYuX3Jlc3BvbnNlQXJncy5tc2cgPSBtc2dcbiAgICAgIHNlbGYuX3Jlc3BvbnNlQXJncy50ID0gdFxuICAgICAgc2VsZi5fZXJyZWQgPSB0cnVlXG4gICAgICB3aGlsZSAoc2VsZi5fZXJyb3JIYW5kbGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNlbGYuX2Vycm9ySGFuZGxlcnMuc2hpZnQoKShyZXNwLCBtc2csIHQpXG4gICAgICB9XG4gICAgICBjb21wbGV0ZShyZXNwKVxuICAgIH1cblxuICAgIHRoaXMucmVxdWVzdCA9IGdldFJlcXVlc3QuY2FsbCh0aGlzLCBzdWNjZXNzLCBlcnJvcilcbiAgfVxuXG4gIFJlcXdlc3QucHJvdG90eXBlID0ge1xuICAgIGFib3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLl9hYm9ydGVkID0gdHJ1ZVxuICAgICAgdGhpcy5yZXF1ZXN0LmFib3J0KClcbiAgICB9XG5cbiAgLCByZXRyeTogZnVuY3Rpb24gKCkge1xuICAgICAgaW5pdC5jYWxsKHRoaXMsIHRoaXMubywgdGhpcy5mbilcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTbWFsbCBkZXZpYXRpb24gZnJvbSB0aGUgUHJvbWlzZXMgQSBDb21tb25KcyBzcGVjaWZpY2F0aW9uXG4gICAgICogaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvUHJvbWlzZXMvQVxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogYHRoZW5gIHdpbGwgZXhlY3V0ZSB1cG9uIHN1Y2Nlc3NmdWwgcmVxdWVzdHNcbiAgICAgKi9cbiAgLCB0aGVuOiBmdW5jdGlvbiAoc3VjY2VzcywgZmFpbCkge1xuICAgICAgc3VjY2VzcyA9IHN1Y2Nlc3MgfHwgZnVuY3Rpb24gKCkge31cbiAgICAgIGZhaWwgPSBmYWlsIHx8IGZ1bmN0aW9uICgpIHt9XG4gICAgICBpZiAodGhpcy5fZnVsZmlsbGVkKSB7XG4gICAgICAgIHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwID0gc3VjY2Vzcyh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcClcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZXJyZWQpIHtcbiAgICAgICAgZmFpbCh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCwgdGhpcy5fcmVzcG9uc2VBcmdzLm1zZywgdGhpcy5fcmVzcG9uc2VBcmdzLnQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJzLnB1c2goc3VjY2VzcylcbiAgICAgICAgdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGZhaWwpXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGBhbHdheXNgIHdpbGwgZXhlY3V0ZSB3aGV0aGVyIHRoZSByZXF1ZXN0IHN1Y2NlZWRzIG9yIGZhaWxzXG4gICAgICovXG4gICwgYWx3YXlzOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIGlmICh0aGlzLl9mdWxmaWxsZWQgfHwgdGhpcy5fZXJyZWQpIHtcbiAgICAgICAgZm4odGhpcy5fcmVzcG9uc2VBcmdzLnJlc3ApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jb21wbGV0ZUhhbmRsZXJzLnB1c2goZm4pXG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGBmYWlsYCB3aWxsIGV4ZWN1dGUgd2hlbiB0aGUgcmVxdWVzdCBmYWlsc1xuICAgICAqL1xuICAsIGZhaWw6IGZ1bmN0aW9uIChmbikge1xuICAgICAgaWYgKHRoaXMuX2VycmVkKSB7XG4gICAgICAgIGZuKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwLCB0aGlzLl9yZXNwb25zZUFyZ3MubXNnLCB0aGlzLl9yZXNwb25zZUFyZ3MudClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2Vycm9ySGFuZGxlcnMucHVzaChmbilcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuICAsICdjYXRjaCc6IGZ1bmN0aW9uIChmbikge1xuICAgICAgcmV0dXJuIHRoaXMuZmFpbChmbilcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXF3ZXN0KG8sIGZuKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF3ZXN0KG8sIGZuKVxuICB9XG5cbiAgLy8gbm9ybWFsaXplIG5ld2xpbmUgdmFyaWFudHMgYWNjb3JkaW5nIHRvIHNwZWMgLT4gQ1JMRlxuICBmdW5jdGlvbiBub3JtYWxpemUocykge1xuICAgIHJldHVybiBzID8gcy5yZXBsYWNlKC9cXHI/XFxuL2csICdcXHJcXG4nKSA6ICcnXG4gIH1cblxuICBmdW5jdGlvbiBzZXJpYWwoZWwsIGNiKSB7XG4gICAgdmFyIG4gPSBlbC5uYW1lXG4gICAgICAsIHQgPSBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICwgb3B0Q2IgPSBmdW5jdGlvbiAobykge1xuICAgICAgICAgIC8vIElFIGdpdmVzIHZhbHVlPVwiXCIgZXZlbiB3aGVyZSB0aGVyZSBpcyBubyB2YWx1ZSBhdHRyaWJ1dGVcbiAgICAgICAgICAvLyAnc3BlY2lmaWVkJyByZWY6IGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0zLUNvcmUvY29yZS5odG1sI0lELTg2MjUyOTI3M1xuICAgICAgICAgIGlmIChvICYmICFvWydkaXNhYmxlZCddKVxuICAgICAgICAgICAgY2Iobiwgbm9ybWFsaXplKG9bJ2F0dHJpYnV0ZXMnXVsndmFsdWUnXSAmJiBvWydhdHRyaWJ1dGVzJ11bJ3ZhbHVlJ11bJ3NwZWNpZmllZCddID8gb1sndmFsdWUnXSA6IG9bJ3RleHQnXSkpXG4gICAgICAgIH1cbiAgICAgICwgY2gsIHJhLCB2YWwsIGlcblxuICAgIC8vIGRvbid0IHNlcmlhbGl6ZSBlbGVtZW50cyB0aGF0IGFyZSBkaXNhYmxlZCBvciB3aXRob3V0IGEgbmFtZVxuICAgIGlmIChlbC5kaXNhYmxlZCB8fCAhbikgcmV0dXJuXG5cbiAgICBzd2l0Y2ggKHQpIHtcbiAgICBjYXNlICdpbnB1dCc6XG4gICAgICBpZiAoIS9yZXNldHxidXR0b258aW1hZ2V8ZmlsZS9pLnRlc3QoZWwudHlwZSkpIHtcbiAgICAgICAgY2ggPSAvY2hlY2tib3gvaS50ZXN0KGVsLnR5cGUpXG4gICAgICAgIHJhID0gL3JhZGlvL2kudGVzdChlbC50eXBlKVxuICAgICAgICB2YWwgPSBlbC52YWx1ZVxuICAgICAgICAvLyBXZWJLaXQgZ2l2ZXMgdXMgXCJcIiBpbnN0ZWFkIG9mIFwib25cIiBpZiBhIGNoZWNrYm94IGhhcyBubyB2YWx1ZSwgc28gY29ycmVjdCBpdCBoZXJlXG4gICAgICAgIDsoIShjaCB8fCByYSkgfHwgZWwuY2hlY2tlZCkgJiYgY2Iobiwgbm9ybWFsaXplKGNoICYmIHZhbCA9PT0gJycgPyAnb24nIDogdmFsKSlcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndGV4dGFyZWEnOlxuICAgICAgY2Iobiwgbm9ybWFsaXplKGVsLnZhbHVlKSlcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgIGlmIChlbC50eXBlLnRvTG93ZXJDYXNlKCkgPT09ICdzZWxlY3Qtb25lJykge1xuICAgICAgICBvcHRDYihlbC5zZWxlY3RlZEluZGV4ID49IDAgPyBlbC5vcHRpb25zW2VsLnNlbGVjdGVkSW5kZXhdIDogbnVsbClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGVsLmxlbmd0aCAmJiBpIDwgZWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBlbC5vcHRpb25zW2ldLnNlbGVjdGVkICYmIG9wdENiKGVsLm9wdGlvbnNbaV0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgLy8gY29sbGVjdCB1cCBhbGwgZm9ybSBlbGVtZW50cyBmb3VuZCBmcm9tIHRoZSBwYXNzZWQgYXJndW1lbnQgZWxlbWVudHMgYWxsXG4gIC8vIHRoZSB3YXkgZG93biB0byBjaGlsZCBlbGVtZW50czsgcGFzcyBhICc8Zm9ybT4nIG9yIGZvcm0gZmllbGRzLlxuICAvLyBjYWxsZWQgd2l0aCAndGhpcyc9Y2FsbGJhY2sgdG8gdXNlIGZvciBzZXJpYWwoKSBvbiBlYWNoIGVsZW1lbnRcbiAgZnVuY3Rpb24gZWFjaEZvcm1FbGVtZW50KCkge1xuICAgIHZhciBjYiA9IHRoaXNcbiAgICAgICwgZSwgaVxuICAgICAgLCBzZXJpYWxpemVTdWJ0YWdzID0gZnVuY3Rpb24gKGUsIHRhZ3MpIHtcbiAgICAgICAgICB2YXIgaSwgaiwgZmFcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZmEgPSBlW2J5VGFnXSh0YWdzW2ldKVxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGZhLmxlbmd0aDsgaisrKSBzZXJpYWwoZmFbal0sIGNiKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgZSA9IGFyZ3VtZW50c1tpXVxuICAgICAgaWYgKC9pbnB1dHxzZWxlY3R8dGV4dGFyZWEvaS50ZXN0KGUudGFnTmFtZSkpIHNlcmlhbChlLCBjYilcbiAgICAgIHNlcmlhbGl6ZVN1YnRhZ3MoZSwgWyAnaW5wdXQnLCAnc2VsZWN0JywgJ3RleHRhcmVhJyBdKVxuICAgIH1cbiAgfVxuXG4gIC8vIHN0YW5kYXJkIHF1ZXJ5IHN0cmluZyBzdHlsZSBzZXJpYWxpemF0aW9uXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZVF1ZXJ5U3RyaW5nKCkge1xuICAgIHJldHVybiByZXF3ZXN0LnRvUXVlcnlTdHJpbmcocmVxd2VzdC5zZXJpYWxpemVBcnJheS5hcHBseShudWxsLCBhcmd1bWVudHMpKVxuICB9XG5cbiAgLy8geyAnbmFtZSc6ICd2YWx1ZScsIC4uLiB9IHN0eWxlIHNlcmlhbGl6YXRpb25cbiAgZnVuY3Rpb24gc2VyaWFsaXplSGFzaCgpIHtcbiAgICB2YXIgaGFzaCA9IHt9XG4gICAgZWFjaEZvcm1FbGVtZW50LmFwcGx5KGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgaWYgKG5hbWUgaW4gaGFzaCkge1xuICAgICAgICBoYXNoW25hbWVdICYmICFpc0FycmF5KGhhc2hbbmFtZV0pICYmIChoYXNoW25hbWVdID0gW2hhc2hbbmFtZV1dKVxuICAgICAgICBoYXNoW25hbWVdLnB1c2godmFsdWUpXG4gICAgICB9IGVsc2UgaGFzaFtuYW1lXSA9IHZhbHVlXG4gICAgfSwgYXJndW1lbnRzKVxuICAgIHJldHVybiBoYXNoXG4gIH1cblxuICAvLyBbIHsgbmFtZTogJ25hbWUnLCB2YWx1ZTogJ3ZhbHVlJyB9LCAuLi4gXSBzdHlsZSBzZXJpYWxpemF0aW9uXG4gIHJlcXdlc3Quc2VyaWFsaXplQXJyYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyciA9IFtdXG4gICAgZWFjaEZvcm1FbGVtZW50LmFwcGx5KGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSkge1xuICAgICAgYXJyLnB1c2goe25hbWU6IG5hbWUsIHZhbHVlOiB2YWx1ZX0pXG4gICAgfSwgYXJndW1lbnRzKVxuICAgIHJldHVybiBhcnJcbiAgfVxuXG4gIHJlcXdlc3Quc2VyaWFsaXplID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgICB2YXIgb3B0LCBmblxuICAgICAgLCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKVxuXG4gICAgb3B0ID0gYXJncy5wb3AoKVxuICAgIG9wdCAmJiBvcHQubm9kZVR5cGUgJiYgYXJncy5wdXNoKG9wdCkgJiYgKG9wdCA9IG51bGwpXG4gICAgb3B0ICYmIChvcHQgPSBvcHQudHlwZSlcblxuICAgIGlmIChvcHQgPT0gJ21hcCcpIGZuID0gc2VyaWFsaXplSGFzaFxuICAgIGVsc2UgaWYgKG9wdCA9PSAnYXJyYXknKSBmbiA9IHJlcXdlc3Quc2VyaWFsaXplQXJyYXlcbiAgICBlbHNlIGZuID0gc2VyaWFsaXplUXVlcnlTdHJpbmdcblxuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKVxuICB9XG5cbiAgcmVxd2VzdC50b1F1ZXJ5U3RyaW5nID0gZnVuY3Rpb24gKG8sIHRyYWQpIHtcbiAgICB2YXIgcHJlZml4LCBpXG4gICAgICAsIHRyYWRpdGlvbmFsID0gdHJhZCB8fCBmYWxzZVxuICAgICAgLCBzID0gW11cbiAgICAgICwgZW5jID0gZW5jb2RlVVJJQ29tcG9uZW50XG4gICAgICAsIGFkZCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgLy8gSWYgdmFsdWUgaXMgYSBmdW5jdGlvbiwgaW52b2tlIGl0IGFuZCByZXR1cm4gaXRzIHZhbHVlXG4gICAgICAgICAgdmFsdWUgPSAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHZhbHVlKSA/IHZhbHVlKCkgOiAodmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWUpXG4gICAgICAgICAgc1tzLmxlbmd0aF0gPSBlbmMoa2V5KSArICc9JyArIGVuYyh2YWx1ZSlcbiAgICAgICAgfVxuICAgIC8vIElmIGFuIGFycmF5IHdhcyBwYXNzZWQgaW4sIGFzc3VtZSB0aGF0IGl0IGlzIGFuIGFycmF5IG9mIGZvcm0gZWxlbWVudHMuXG4gICAgaWYgKGlzQXJyYXkobykpIHtcbiAgICAgIGZvciAoaSA9IDA7IG8gJiYgaSA8IG8ubGVuZ3RoOyBpKyspIGFkZChvW2ldWyduYW1lJ10sIG9baV1bJ3ZhbHVlJ10pXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHRyYWRpdGlvbmFsLCBlbmNvZGUgdGhlIFwib2xkXCIgd2F5ICh0aGUgd2F5IDEuMy4yIG9yIG9sZGVyXG4gICAgICAvLyBkaWQgaXQpLCBvdGhlcndpc2UgZW5jb2RlIHBhcmFtcyByZWN1cnNpdmVseS5cbiAgICAgIGZvciAocHJlZml4IGluIG8pIHtcbiAgICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkocHJlZml4KSkgYnVpbGRQYXJhbXMocHJlZml4LCBvW3ByZWZpeF0sIHRyYWRpdGlvbmFsLCBhZGQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gc3BhY2VzIHNob3VsZCBiZSArIGFjY29yZGluZyB0byBzcGVjXG4gICAgcmV0dXJuIHMuam9pbignJicpLnJlcGxhY2UoLyUyMC9nLCAnKycpXG4gIH1cblxuICBmdW5jdGlvbiBidWlsZFBhcmFtcyhwcmVmaXgsIG9iaiwgdHJhZGl0aW9uYWwsIGFkZCkge1xuICAgIHZhciBuYW1lLCBpLCB2XG4gICAgICAsIHJicmFja2V0ID0gL1xcW1xcXSQvXG5cbiAgICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgICAvLyBTZXJpYWxpemUgYXJyYXkgaXRlbS5cbiAgICAgIGZvciAoaSA9IDA7IG9iaiAmJiBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHYgPSBvYmpbaV1cbiAgICAgICAgaWYgKHRyYWRpdGlvbmFsIHx8IHJicmFja2V0LnRlc3QocHJlZml4KSkge1xuICAgICAgICAgIC8vIFRyZWF0IGVhY2ggYXJyYXkgaXRlbSBhcyBhIHNjYWxhci5cbiAgICAgICAgICBhZGQocHJlZml4LCB2KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJ1aWxkUGFyYW1zKHByZWZpeCArICdbJyArICh0eXBlb2YgdiA9PT0gJ29iamVjdCcgPyBpIDogJycpICsgJ10nLCB2LCB0cmFkaXRpb25hbCwgYWRkKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvYmogJiYgb2JqLnRvU3RyaW5nKCkgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAvLyBTZXJpYWxpemUgb2JqZWN0IGl0ZW0uXG4gICAgICBmb3IgKG5hbWUgaW4gb2JqKSB7XG4gICAgICAgIGJ1aWxkUGFyYW1zKHByZWZpeCArICdbJyArIG5hbWUgKyAnXScsIG9ialtuYW1lXSwgdHJhZGl0aW9uYWwsIGFkZClcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTZXJpYWxpemUgc2NhbGFyIGl0ZW0uXG4gICAgICBhZGQocHJlZml4LCBvYmopXG4gICAgfVxuICB9XG5cbiAgcmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY2FsbGJhY2tQcmVmaXhcbiAgfVxuXG4gIC8vIGpRdWVyeSBhbmQgWmVwdG8gY29tcGF0aWJpbGl0eSwgZGlmZmVyZW5jZXMgY2FuIGJlIHJlbWFwcGVkIGhlcmUgc28geW91IGNhbiBjYWxsXG4gIC8vIC5hamF4LmNvbXBhdChvcHRpb25zLCBjYWxsYmFjaylcbiAgcmVxd2VzdC5jb21wYXQgPSBmdW5jdGlvbiAobywgZm4pIHtcbiAgICBpZiAobykge1xuICAgICAgb1sndHlwZSddICYmIChvWydtZXRob2QnXSA9IG9bJ3R5cGUnXSkgJiYgZGVsZXRlIG9bJ3R5cGUnXVxuICAgICAgb1snZGF0YVR5cGUnXSAmJiAob1sndHlwZSddID0gb1snZGF0YVR5cGUnXSlcbiAgICAgIG9bJ2pzb25wQ2FsbGJhY2snXSAmJiAob1snanNvbnBDYWxsYmFja05hbWUnXSA9IG9bJ2pzb25wQ2FsbGJhY2snXSkgJiYgZGVsZXRlIG9bJ2pzb25wQ2FsbGJhY2snXVxuICAgICAgb1snanNvbnAnXSAmJiAob1snanNvbnBDYWxsYmFjayddID0gb1snanNvbnAnXSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBSZXF3ZXN0KG8sIGZuKVxuICB9XG5cbiAgcmVxd2VzdC5hamF4U2V0dXAgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgZm9yICh2YXIgayBpbiBvcHRpb25zKSB7XG4gICAgICBnbG9iYWxTZXR1cE9wdGlvbnNba10gPSBvcHRpb25zW2tdXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcXdlc3Rcbn0pO1xuIiwidmFyIGhlYWRlciA9IHJlcXVpcmUoXCIuLy4uL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC1oZWFkZXIvbWFpbi5qc1wiKTtcbiJdfQ==
