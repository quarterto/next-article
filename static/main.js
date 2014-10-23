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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvbm9kZV9tb2R1bGVzL29yaWdhbWktYnVpbGQtdG9vbHMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzIiwiL1VzZXJzL2FyanVuLmdhZGhpYS9EZXZlbG9wbWVudC9uZXh0L25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtaGVhZGVyL21haW4uanMiLCIvVXNlcnMvYXJqdW4uZ2FkaGlhL0RldmVsb3BtZW50L25leHQvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC1oZWFkZXIvc3JjL2pzL05vdGlmeS5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL2xpYi9NZS5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL2xpYi9Ob3RpZmljYXRpb25Qb2xsZXIuanMiLCIvVXNlcnMvYXJqdW4uZ2FkaGlhL0RldmVsb3BtZW50L25leHQvbmV4dC1kb2JpL2Jvd2VyX2NvbXBvbmVudHMvbmV4dC11c2VyLXByZWZlcmVuY2VzL3NyYy9saWIvVXNlclByZWZlcmVuY2VMaXN0LmpzIiwiL1VzZXJzL2FyanVuLmdhZGhpYS9EZXZlbG9wbWVudC9uZXh0L25leHQtZG9iaS9ib3dlcl9jb21wb25lbnRzL25leHQtdXNlci1wcmVmZXJlbmNlcy9zcmMvbWFpbi5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9uZXh0LXVzZXItcHJlZmVyZW5jZXMvc3JjL3ZlbmRvci9yZXF3ZXN0Lm1pbi5qcyIsIi9Vc2Vycy9hcmp1bi5nYWRoaWEvRGV2ZWxvcG1lbnQvbmV4dC9uZXh0LWRvYmkvYm93ZXJfY29tcG9uZW50cy9yZXF3ZXN0L3JlcXdlc3QuanMiLCIvVXNlcnMvYXJqdW4uZ2FkaGlhL0RldmVsb3BtZW50L25leHQvbmV4dC1kb2JpL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqbUJBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlLCBub2RlOnRydWUqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVsZWdhdGU7XG5cbi8qKlxuICogRE9NIGV2ZW50IGRlbGVnYXRvclxuICpcbiAqIFRoZSBkZWxlZ2F0b3Igd2lsbCBsaXN0ZW5cbiAqIGZvciBldmVudHMgdGhhdCBidWJibGUgdXBcbiAqIHRvIHRoZSByb290IG5vZGUuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKi9cbmZ1bmN0aW9uIERlbGVnYXRlKHJvb3QpIHtcblxuICAvKipcbiAgICogTWFpbnRhaW4gYSBtYXAgb2YgbGlzdGVuZXJcbiAgICogbGlzdHMsIGtleWVkIGJ5IGV2ZW50IG5hbWUuXG4gICAqXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKi9cbiAgdGhpcy5saXN0ZW5lck1hcCA9IFt7fSwge31dO1xuICBpZiAocm9vdCkge1xuICAgIHRoaXMucm9vdChyb290KTtcbiAgfVxuXG4gIC8qKiBAdHlwZSBmdW5jdGlvbigpICovXG4gIHRoaXMuaGFuZGxlID0gRGVsZWdhdGUucHJvdG90eXBlLmhhbmRsZS5iaW5kKHRoaXMpO1xufVxuXG4vKipcbiAqIFN0YXJ0IGxpc3RlbmluZyBmb3IgZXZlbnRzXG4gKiBvbiB0aGUgcHJvdmlkZWQgRE9NIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0gIHtOb2RlfHN0cmluZ30gW3Jvb3RdIFRoZSByb290IG5vZGUgb3IgYSBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmcgdGhlIHJvb3Qgbm9kZVxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLnJvb3QgPSBmdW5jdGlvbihyb290KSB7XG4gIHZhciBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXA7XG4gIHZhciBldmVudFR5cGU7XG5cbiAgLy8gUmVtb3ZlIG1hc3RlciBldmVudCBsaXN0ZW5lcnNcbiAgaWYgKHRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFsxXSkge1xuICAgICAgaWYgKGxpc3RlbmVyTWFwWzFdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFswXSkge1xuICAgICAgaWYgKGxpc3RlbmVyTWFwWzBdLmhhc093blByb3BlcnR5KGV2ZW50VHlwZSkpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBubyByb290IG9yIHJvb3QgaXMgbm90XG4gIC8vIGEgZG9tIG5vZGUsIHRoZW4gcmVtb3ZlIGludGVybmFsXG4gIC8vIHJvb3QgcmVmZXJlbmNlIGFuZCBleGl0IGhlcmVcbiAgaWYgKCFyb290IHx8ICFyb290LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgICAgZGVsZXRlIHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSByb290IG5vZGUgYXQgd2hpY2hcbiAgICogbGlzdGVuZXJzIGFyZSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHR5cGUgTm9kZVxuICAgKi9cbiAgdGhpcy5yb290RWxlbWVudCA9IHJvb3Q7XG5cbiAgLy8gU2V0IHVwIG1hc3RlciBldmVudCBsaXN0ZW5lcnNcbiAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXBbMV0pIHtcbiAgICBpZiAobGlzdGVuZXJNYXBbMV0uaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHRydWUpO1xuICAgIH1cbiAgfVxuICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcFswXSkge1xuICAgIGlmIChsaXN0ZW5lck1hcFswXS5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5jYXB0dXJlRm9yVHlwZSA9IGZ1bmN0aW9uKGV2ZW50VHlwZSkge1xuICByZXR1cm4gWydibHVyJywgJ2Vycm9yJywgJ2ZvY3VzJywgJ2xvYWQnLCAncmVzaXplJywgJ3Njcm9sbCddLmluZGV4T2YoZXZlbnRUeXBlKSAhPT0gLTE7XG59O1xuXG4vKipcbiAqIEF0dGFjaCBhIGhhbmRsZXIgdG8gb25lXG4gKiBldmVudCBmb3IgYWxsIGVsZW1lbnRzXG4gKiB0aGF0IG1hdGNoIHRoZSBzZWxlY3RvcixcbiAqIG5vdyBvciBpbiB0aGUgZnV0dXJlXG4gKlxuICogVGhlIGhhbmRsZXIgZnVuY3Rpb24gcmVjZWl2ZXNcbiAqIHRocmVlIGFyZ3VtZW50czogdGhlIERPTSBldmVudFxuICogb2JqZWN0LCB0aGUgbm9kZSB0aGF0IG1hdGNoZWRcbiAqIHRoZSBzZWxlY3RvciB3aGlsZSB0aGUgZXZlbnRcbiAqIHdhcyBidWJibGluZyBhbmQgYSByZWZlcmVuY2VcbiAqIHRvIGl0c2VsZi4gV2l0aGluIHRoZSBoYW5kbGVyLFxuICogJ3RoaXMnIGlzIGVxdWFsIHRvIHRoZSBzZWNvbmRcbiAqIGFyZ3VtZW50LlxuICpcbiAqIFRoZSBub2RlIHRoYXQgYWN0dWFsbHkgcmVjZWl2ZWRcbiAqIHRoZSBldmVudCBjYW4gYmUgYWNjZXNzZWQgdmlhXG4gKiAnZXZlbnQudGFyZ2V0Jy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIExpc3RlbiBmb3IgdGhlc2UgZXZlbnRzXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNlbGVjdG9yIE9ubHkgaGFuZGxlIGV2ZW50cyBvbiBlbGVtZW50cyBtYXRjaGluZyB0aGlzIHNlbGVjdG9yLCBpZiB1bmRlZmluZWQgbWF0Y2ggcm9vdCBlbGVtZW50XG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IGhhbmRsZXIgSGFuZGxlciBmdW5jdGlvbiAtIGV2ZW50IGRhdGEgcGFzc2VkIGhlcmUgd2lsbCBiZSBpbiBldmVudC5kYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gW2V2ZW50RGF0YV0gRGF0YSB0byBwYXNzIGluIGV2ZW50LmRhdGFcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgdmFyIHJvb3QsIGxpc3RlbmVyTWFwLCBtYXRjaGVyLCBtYXRjaGVyUGFyYW07XG5cbiAgaWYgKCFldmVudFR5cGUpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGV2ZW50IHR5cGU6ICcgKyBldmVudFR5cGUpO1xuICB9XG5cbiAgLy8gaGFuZGxlciBjYW4gYmUgcGFzc2VkIGFzXG4gIC8vIHRoZSBzZWNvbmQgb3IgdGhpcmQgYXJndW1lbnRcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHVzZUNhcHR1cmUgPSBoYW5kbGVyO1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBzZW5zaWJsZSBkZWZhdWx0c1xuICAvLyBpZiB1c2VDYXB0dXJlIG5vdCBzZXRcbiAgaWYgKHVzZUNhcHR1cmUgPT09IHVuZGVmaW5lZCkge1xuICAgIHVzZUNhcHR1cmUgPSB0aGlzLmNhcHR1cmVGb3JUeXBlKGV2ZW50VHlwZSk7XG4gIH1cblxuICBpZiAodHlwZW9mIGhhbmRsZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdIYW5kbGVyIG11c3QgYmUgYSB0eXBlIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwW3VzZUNhcHR1cmUgPyAxIDogMF07XG5cbiAgLy8gQWRkIG1hc3RlciBoYW5kbGVyIGZvciB0eXBlIGlmIG5vdCBjcmVhdGVkIHlldFxuICBpZiAoIWxpc3RlbmVyTWFwW2V2ZW50VHlwZV0pIHtcbiAgICBpZiAocm9vdCkge1xuICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHVzZUNhcHR1cmUpO1xuICAgIH1cbiAgICBsaXN0ZW5lck1hcFtldmVudFR5cGVdID0gW107XG4gIH1cblxuICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gbnVsbDtcblxuICAgIC8vIENPTVBMRVggLSBtYXRjaGVzUm9vdCBuZWVkcyB0byBoYXZlIGFjY2VzcyB0b1xuICAgIC8vIHRoaXMucm9vdEVsZW1lbnQsIHNvIGJpbmQgdGhlIGZ1bmN0aW9uIHRvIHRoaXMuXG4gICAgbWF0Y2hlciA9IG1hdGNoZXNSb290LmJpbmQodGhpcyk7XG5cbiAgLy8gQ29tcGlsZSBhIG1hdGNoZXIgZm9yIHRoZSBnaXZlbiBzZWxlY3RvclxuICB9IGVsc2UgaWYgKC9eW2Etel0rJC9pLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3I7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXNUYWc7XG4gIH0gZWxzZSBpZiAoL14jW2EtejAtOVxcLV9dKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yLnNsaWNlKDEpO1xuICAgIG1hdGNoZXIgPSBtYXRjaGVzSWQ7XG4gIH0gZWxzZSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3I7XG4gICAgbWF0Y2hlciA9IG1hdGNoZXM7XG4gIH1cblxuICAvLyBBZGQgdG8gdGhlIGxpc3Qgb2YgbGlzdGVuZXJzXG4gIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0ucHVzaCh7XG4gICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgbWF0Y2hlcjogbWF0Y2hlcixcbiAgICBtYXRjaGVyUGFyYW06IG1hdGNoZXJQYXJhbVxuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFuIGV2ZW50IGhhbmRsZXJcbiAqIGZvciBlbGVtZW50cyB0aGF0IG1hdGNoXG4gKiB0aGUgc2VsZWN0b3IsIGZvcmV2ZXJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW2V2ZW50VHlwZV0gUmVtb3ZlIGhhbmRsZXJzIGZvciBldmVudHMgbWF0Y2hpbmcgdGhpcyB0eXBlLCBjb25zaWRlcmluZyB0aGUgb3RoZXIgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd9IFtzZWxlY3Rvcl0gSWYgdGhpcyBwYXJhbWV0ZXIgaXMgb21pdHRlZCwgb25seSBoYW5kbGVycyB3aGljaCBtYXRjaCB0aGUgb3RoZXIgdHdvIHdpbGwgYmUgcmVtb3ZlZFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBbaGFuZGxlcl0gSWYgdGhpcyBwYXJhbWV0ZXIgaXMgb21pdHRlZCwgb25seSBoYW5kbGVycyB3aGljaCBtYXRjaCB0aGUgcHJldmlvdXMgdHdvIHdpbGwgYmUgcmVtb3ZlZFxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIHVzZUNhcHR1cmUpIHtcbiAgdmFyIGksIGxpc3RlbmVyLCBsaXN0ZW5lck1hcCwgbGlzdGVuZXJMaXN0LCBzaW5nbGVFdmVudFR5cGU7XG5cbiAgLy8gSGFuZGxlciBjYW4gYmUgcGFzc2VkIGFzXG4gIC8vIHRoZSBzZWNvbmQgb3IgdGhpcmQgYXJndW1lbnRcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHVzZUNhcHR1cmUgPSBoYW5kbGVyO1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gIH1cblxuICAvLyBJZiB1c2VDYXB0dXJlIG5vdCBzZXQsIHJlbW92ZVxuICAvLyBhbGwgZXZlbnQgbGlzdGVuZXJzXG4gIGlmICh1c2VDYXB0dXJlID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzLm9mZihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCB0cnVlKTtcbiAgICB0aGlzLm9mZihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXBbdXNlQ2FwdHVyZSA/IDEgOiAwXTtcbiAgaWYgKCFldmVudFR5cGUpIHtcbiAgICBmb3IgKHNpbmdsZUV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcCkge1xuICAgICAgaWYgKGxpc3RlbmVyTWFwLmhhc093blByb3BlcnR5KHNpbmdsZUV2ZW50VHlwZSkpIHtcbiAgICAgICAgdGhpcy5vZmYoc2luZ2xlRXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lck1hcFtldmVudFR5cGVdO1xuICBpZiAoIWxpc3RlbmVyTGlzdCB8fCAhbGlzdGVuZXJMaXN0Lmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gUmVtb3ZlIG9ubHkgcGFyYW1ldGVyIG1hdGNoZXNcbiAgLy8gaWYgc3BlY2lmaWVkXG4gIGZvciAoaSA9IGxpc3RlbmVyTGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGxpc3RlbmVyID0gbGlzdGVuZXJMaXN0W2ldO1xuXG4gICAgaWYgKCghc2VsZWN0b3IgfHwgc2VsZWN0b3IgPT09IGxpc3RlbmVyLnNlbGVjdG9yKSAmJiAoIWhhbmRsZXIgfHwgaGFuZGxlciA9PT0gbGlzdGVuZXIuaGFuZGxlcikpIHtcbiAgICAgIGxpc3RlbmVyTGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWxsIGxpc3RlbmVycyByZW1vdmVkXG4gIGlmICghbGlzdGVuZXJMaXN0Lmxlbmd0aCkge1xuICAgIGRlbGV0ZSBsaXN0ZW5lck1hcFtldmVudFR5cGVdO1xuXG4gICAgLy8gUmVtb3ZlIHRoZSBtYWluIGhhbmRsZXJcbiAgICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHVzZUNhcHR1cmUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKipcbiAqIEhhbmRsZSBhbiBhcmJpdHJhcnkgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmhhbmRsZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gIHZhciBpLCBsLCB0eXBlID0gZXZlbnQudHlwZSwgcm9vdCwgcGhhc2UsIGxpc3RlbmVyLCByZXR1cm5lZCwgbGlzdGVuZXJMaXN0ID0gW10sIHRhcmdldCwgLyoqIEBjb25zdCAqLyBFVkVOVElHTk9SRSA9ICdmdExhYnNEZWxlZ2F0ZUlnbm9yZSc7XG5cbiAgaWYgKGV2ZW50W0VWRU5USUdOT1JFXSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRhcmdldCA9IGV2ZW50LnRhcmdldDtcblxuICAvLyBIYXJkY29kZSB2YWx1ZSBvZiBOb2RlLlRFWFRfTk9ERVxuICAvLyBhcyBub3QgZGVmaW5lZCBpbiBJRThcbiAgaWYgKHRhcmdldC5ub2RlVHlwZSA9PT0gMykge1xuICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICB9XG5cbiAgcm9vdCA9IHRoaXMucm9vdEVsZW1lbnQ7XG5cbiAgcGhhc2UgPSBldmVudC5ldmVudFBoYXNlIHx8ICggZXZlbnQudGFyZ2V0ICE9PSBldmVudC5jdXJyZW50VGFyZ2V0ID8gMyA6IDIgKTtcbiAgXG4gIHN3aXRjaCAocGhhc2UpIHtcbiAgICBjYXNlIDE6IC8vRXZlbnQuQ0FQVFVSSU5HX1BIQVNFOlxuICAgICAgbGlzdGVuZXJMaXN0ID0gdGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXTtcbiAgICBicmVhaztcbiAgICBjYXNlIDI6IC8vRXZlbnQuQVRfVEFSR0VUOlxuICAgICAgaWYgKHRoaXMubGlzdGVuZXJNYXBbMF0gJiYgdGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXSkgbGlzdGVuZXJMaXN0ID0gbGlzdGVuZXJMaXN0LmNvbmNhdCh0aGlzLmxpc3RlbmVyTWFwWzBdW3R5cGVdKTtcbiAgICAgIGlmICh0aGlzLmxpc3RlbmVyTWFwWzFdICYmIHRoaXMubGlzdGVuZXJNYXBbMV1bdHlwZV0pIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTGlzdC5jb25jYXQodGhpcy5saXN0ZW5lck1hcFsxXVt0eXBlXSk7XG4gICAgYnJlYWs7XG4gICAgY2FzZSAzOiAvL0V2ZW50LkJVQkJMSU5HX1BIQVNFOlxuICAgICAgbGlzdGVuZXJMaXN0ID0gdGhpcy5saXN0ZW5lck1hcFswXVt0eXBlXTtcbiAgICBicmVhaztcbiAgfVxuXG4gIC8vIE5lZWQgdG8gY29udGludW91c2x5IGNoZWNrXG4gIC8vIHRoYXQgdGhlIHNwZWNpZmljIGxpc3QgaXNcbiAgLy8gc3RpbGwgcG9wdWxhdGVkIGluIGNhc2Ugb25lXG4gIC8vIG9mIHRoZSBjYWxsYmFja3MgYWN0dWFsbHlcbiAgLy8gY2F1c2VzIHRoZSBsaXN0IHRvIGJlIGRlc3Ryb3llZC5cbiAgbCA9IGxpc3RlbmVyTGlzdC5sZW5ndGg7XG4gIHdoaWxlICh0YXJnZXQgJiYgbCkge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyID0gbGlzdGVuZXJMaXN0W2ldO1xuXG4gICAgICAvLyBCYWlsIGZyb20gdGhpcyBsb29wIGlmXG4gICAgICAvLyB0aGUgbGVuZ3RoIGNoYW5nZWQgYW5kXG4gICAgICAvLyBubyBtb3JlIGxpc3RlbmVycyBhcmVcbiAgICAgIC8vIGRlZmluZWQgYmV0d2VlbiBpIGFuZCBsLlxuICAgICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgZm9yIG1hdGNoIGFuZCBmaXJlXG4gICAgICAvLyB0aGUgZXZlbnQgaWYgdGhlcmUncyBvbmVcbiAgICAgIC8vXG4gICAgICAvLyBUT0RPOk1DRzoyMDEyMDExNzogTmVlZCBhIHdheVxuICAgICAgLy8gdG8gY2hlY2sgaWYgZXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uXG4gICAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgYm90aCBsb29wcy5cbiAgICAgIGlmIChsaXN0ZW5lci5tYXRjaGVyLmNhbGwodGFyZ2V0LCBsaXN0ZW5lci5tYXRjaGVyUGFyYW0sIHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuZWQgPSB0aGlzLmZpcmUoZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICAvLyBTdG9wIHByb3BhZ2F0aW9uIHRvIHN1YnNlcXVlbnRcbiAgICAgIC8vIGNhbGxiYWNrcyBpZiB0aGUgY2FsbGJhY2sgcmV0dXJuZWRcbiAgICAgIC8vIGZhbHNlXG4gICAgICBpZiAocmV0dXJuZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIGV2ZW50W0VWRU5USUdOT1JFXSA9IHRydWU7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPOk1DRzoyMDEyMDExNzogTmVlZCBhIHdheSB0b1xuICAgIC8vIGNoZWNrIGlmIGV2ZW50I3N0b3BQcm9wYWdhdGlvblxuICAgIC8vIHdhcyBjYWxsZWQuIElmIHNvLCBicmVhayBsb29waW5nXG4gICAgLy8gdGhyb3VnaCB0aGUgRE9NLiBTdG9wIGlmIHRoZVxuICAgIC8vIGRlbGVnYXRpb24gcm9vdCBoYXMgYmVlbiByZWFjaGVkXG4gICAgaWYgKHRhcmdldCA9PT0gcm9vdCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgbCA9IGxpc3RlbmVyTGlzdC5sZW5ndGg7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ7XG4gIH1cbn07XG5cbi8qKlxuICogRmlyZSBhIGxpc3RlbmVyIG9uIGEgdGFyZ2V0LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge05vZGV9IHRhcmdldFxuICogQHBhcmFtIHtPYmplY3R9IGxpc3RlbmVyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbihldmVudCwgdGFyZ2V0LCBsaXN0ZW5lcikge1xuICByZXR1cm4gbGlzdGVuZXIuaGFuZGxlci5jYWxsKHRhcmdldCwgZXZlbnQsIHRhcmdldCk7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyBhIGdlbmVyaWMgc2VsZWN0b3IuXG4gKlxuICogQHR5cGUgZnVuY3Rpb24oKVxuICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yIEEgQ1NTIHNlbGVjdG9yXG4gKi9cbnZhciBtYXRjaGVzID0gKGZ1bmN0aW9uKGVsKSB7XG4gIGlmICghZWwpIHJldHVybjtcbiAgdmFyIHAgPSBlbC5wcm90b3R5cGU7XG4gIHJldHVybiAocC5tYXRjaGVzIHx8IHAubWF0Y2hlc1NlbGVjdG9yIHx8IHAud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IHAubW96TWF0Y2hlc1NlbGVjdG9yIHx8IHAubXNNYXRjaGVzU2VsZWN0b3IgfHwgcC5vTWF0Y2hlc1NlbGVjdG9yKTtcbn0oRWxlbWVudCkpO1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyBhIHRhZyBzZWxlY3Rvci5cbiAqXG4gKiBUYWdzIGFyZSBOT1QgY2FzZS1zZW5zaXRpdmUsXG4gKiBleGNlcHQgaW4gWE1MIChhbmQgWE1MLWJhc2VkXG4gKiBsYW5ndWFnZXMgc3VjaCBhcyBYSFRNTCkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRhZ05hbWUgVGhlIHRhZyBuYW1lIHRvIHRlc3QgYWdhaW5zdFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5mdW5jdGlvbiBtYXRjaGVzVGFnKHRhZ05hbWUsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIHRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIHRoZSByb290LlxuICpcbiAqIEBwYXJhbSB7P1N0cmluZ30gc2VsZWN0b3IgSW4gdGhpcyBjYXNlIHRoaXMgaXMgYWx3YXlzIHBhc3NlZCB0aHJvdWdoIGFzIG51bGwgYW5kIG5vdCB1c2VkXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNSb290KHNlbGVjdG9yLCBlbGVtZW50KSB7XG4gIC8qanNoaW50IHZhbGlkdGhpczp0cnVlKi9cbiAgaWYgKHRoaXMucm9vdEVsZW1lbnQgPT09IHdpbmRvdykgcmV0dXJuIGVsZW1lbnQgPT09IGRvY3VtZW50O1xuICByZXR1cm4gdGhpcy5yb290RWxlbWVudCA9PT0gZWxlbWVudDtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHRoZSBJRCBvZlxuICogdGhlIGVsZW1lbnQgaW4gJ3RoaXMnXG4gKiBtYXRjaGVzIHRoZSBnaXZlbiBJRC5cbiAqXG4gKiBJRHMgYXJlIGNhc2Utc2Vuc2l0aXZlLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBUaGUgSUQgdG8gdGVzdCBhZ2FpbnN0XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoZXNJZChpZCwgZWxlbWVudCkge1xuICByZXR1cm4gaWQgPT09IGVsZW1lbnQuaWQ7XG59XG5cbi8qKlxuICogU2hvcnQgaGFuZCBmb3Igb2ZmKClcbiAqIGFuZCByb290KCksIGllIGJvdGhcbiAqIHdpdGggbm8gcGFyYW1ldGVyc1xuICpcbiAqIEByZXR1cm4gdm9pZFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm9mZigpO1xuICB0aGlzLnJvb3QoKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciByZXF3ZXN0ID0gcmVxdWlyZShcIi4vLi4vcmVxd2VzdC9yZXF3ZXN0LmpzXCIpO1xudmFyIERlbGVnYXRlID0gcmVxdWlyZShcIi4vLi4vZG9tLWRlbGVnYXRlL2xpYi9kZWxlZ2F0ZS5qc1wiKTtcbnZhciBoZWFkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuby1oZWFkZXInKTtcbnZhciBteUZ0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm8taGVhZGVyX19zZWNvbmRhcnktLW15ZnQtanMnKTtcbnZhciBteUZUQnV0dG9uID0gaGVhZGVyLnF1ZXJ5U2VsZWN0b3IoJy5vLWhlYWRlci1idXR0b24tanNbZGF0YS10YXJnZXQtcGFuZWw9XCJteWZ0XCJdJyk7XG52YXIgZGVmYXVsdFBhbmVsID0gaGVhZGVyLmdldEF0dHJpYnV0ZSgnZGF0YS1kZWZhdWx0LXBhbmVsJyk7XG52YXIgZGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUoaGVhZGVyKTtcbnZhciBib2R5RGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUoKTtcbnZhciBOb3RpZnkgPSByZXF1aXJlKCcuL3NyYy9qcy9Ob3RpZnknKTtcbnZhciBuZXh0VXNlclByZWZlcmVuY2VzID0gcmVxdWlyZShcIi4vLi4vbmV4dC11c2VyLXByZWZlcmVuY2VzL3NyYy9tYWluLmpzXCIpO1xuXG5kZWxlZ2F0ZS5vbignY2xpY2snLCAnLm8taGVhZGVyLWJ1dHRvbi1qcycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdC8vIEhBQ0tcblx0dmFyIHRhcmdldFBhbmVsID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS10YXJnZXQtcGFuZWwnKVxuXHRcdHx8IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnZGF0YS10YXJnZXQtcGFuZWwnKVxuXHRcdHx8IGRlZmF1bHRQYW5lbDtcblx0dmFyIGN1cnJlbnRQYW5lbCA9IGhlYWRlci5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnKTtcblx0aWYgKGN1cnJlbnRQYW5lbCAhPT0gdGFyZ2V0UGFuZWwgJiYgdGFyZ2V0UGFuZWwgIT09IGRlZmF1bHRQYW5lbCkge1xuXHRcdGJvZHlEZWxlZ2F0ZS5yb290KGRvY3VtZW50LmJvZHkpO1xuXHRcdGhlYWRlci5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnLCB0YXJnZXRQYW5lbCk7XG5cdH0gZWxzZSB7XG5cdFx0Ym9keURlbGVnYXRlLnJvb3QoKTtcblx0XHRpZiAoZGVmYXVsdFBhbmVsKSB7XG5cdFx0XHRoZWFkZXIuc2V0QXR0cmlidXRlKCdkYXRhLXBhbmVsJywgZGVmYXVsdFBhbmVsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aGVhZGVyLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1wYW5lbCcpO1xuXHRcdH1cblx0fVxufSk7XG5cbmRlbGVnYXRlLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufSk7XG5cbmJvZHlEZWxlZ2F0ZS5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0aWYgKGRlZmF1bHRQYW5lbCkge1xuXHRcdGhlYWRlci5zZXRBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnLCBkZWZhdWx0UGFuZWwpO1xuXHR9IGVsc2Uge1xuXHRcdGhlYWRlci5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcGFuZWwnKTtcblx0fVxufSk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbnM6bG9hZCcsIGZ1bmN0aW9uKGUpIHtcblx0dmFyIHRvdGFsID0gMCwgXG5cdFx0XHRub3RpZmljYXRpb25zID0gZS5kZXRhaWw7XG5cdGZvcih2YXIgc3RyZWFtIGluIG5vdGlmaWNhdGlvbnMpIHtcblx0XHRpZihub3RpZmljYXRpb25zW3N0cmVhbV0pIHtcblx0XHRcdHRvdGFsICs9IG5vdGlmaWNhdGlvbnNbc3RyZWFtXS5sZW5ndGg7XG5cdFx0fVxuXHR9XG5cdGlmKHRvdGFsID4gMCkge1xuXHRcdGlmKG15RlRCdXR0b24uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbm90aWZ5LWJhZGdlJykubGVuZ3RoKSB7XG5cdFx0XHRteUZUQnV0dG9uLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ25vdGlmeS1iYWRnZScpWzBdLnRleHRDb250ZW50ID0gdG90YWw7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG15RlRCdXR0b24uaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCAnPHNwYW4gY2xhc3M9XCJub3RpZnktYmFkZ2VcIj4nK3RvdGFsICsgJzwvc3Bhbj4nKVxuXHRcdH1cblx0fVxufSk7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbnM6bmV3JywgZnVuY3Rpb24oZSkge1xuXHR2YXIgdG90YWwgPSAwLCBcblx0XHRcdGRhdGEgPSBlLmRldGFpbDtcblx0XG5cdHZhciBpZCA9IGRhdGEubm90aWZpY2F0aW9uc1swXS5pdGVtO1xuXHRyZXF3ZXN0KHtcblx0XHR1cmw6ICcvJyArIGlkLFxuXHRcdGhlYWRlcnM6IHtcblx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHQnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXG5cdFx0fVxuXHR9KS50aGVuKGZ1bmN0aW9uKHJlcykge1xuXHRcdG5ldyBOb3RpZnkoe1xuXHRcdFx0dGl0bGU6ICdOZXcgYXJ0aWNsZSBpbiAnICsgZGF0YS5zdHJlYW0uZGlzcGxheVRleHQsXG5cdFx0XHRib2R5OiByZXMuaGVhZGxpbmUsXG5cdFx0XHRsaWZlc3BhbjogMTAwMCAqIDEwLFxuXHRcdFx0b25jbGljazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGxvY2F0aW9uLmhyZWYgPSAnLycgKyByZXMuaWRcblx0XHRcdH1cblx0XHR9KS5zaG93KCk7XG5cdH0pLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG5cdFx0bmV3IE5vdGlmeSh7XG5cdFx0XHR0aXRsZTogJ05ldyBhcnRpY2xlIGluICcgKyBkYXRhLnN0cmVhbS5kaXNwbGF5VGV4dCxcblx0XHRcdGxpZmVzcGFuOiAxMDAwICogMTAsXG5cdFx0XHRvbmNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0bG9jYXRpb24uaHJlZiA9ICcvJyArIGRhdGEubm90aWZpY2F0aW9uc1swXS5pdGVtXG5cdFx0XHR9XG5cdFx0fSkuc2hvdygpO1xuXHR9KTtcblxuXG59KTtcblxuXG5cbmZ1bmN0aW9uIHRyYW5zaXRpb25NeUZUQnV0dG9uICh0eXBlKSB7XG5cblx0ZnVuY3Rpb24gbGlzdGVuZXIoKSB7XG5cdFx0bXlGVEJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCd0cmFuc2l0aW9uaW5nJyk7XG5cdFx0bXlGVEJ1dHRvbi5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgbGlzdGVuZXIpO1xuXHR9O1xuXG5cdG15RlRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGxpc3RlbmVyKTtcblx0bXlGVEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCd0cmFuc2l0aW9uaW5nJyk7XG5cdG15RlRCdXR0b24uY2xhc3NMaXN0LmFkZCgnbXlmdC0tJyArIHR5cGUpO1xuXHRteUZUQnV0dG9uLm9mZnNldFdpZHRoOyAvL2ZvcmNlcyByZXBhaW50XG5cblx0bXlGVEJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdteWZ0LS0nICsgdHlwZSk7XG59XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Zhdm91cml0ZXM6YWRkJywgZnVuY3Rpb24gKGUpIHtcblx0dHJhbnNpdGlvbk15RlRCdXR0b24oJ2FkZC1mYXZvdXJpdGUnKTtcbn0pO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmYXZvdXJpdGVzOnJlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG5cdHRyYW5zaXRpb25NeUZUQnV0dG9uKCdyZW1vdmUtZmF2b3VyaXRlJyk7XG59KTtcblxucmVxd2VzdCgnaHR0cDovL25leHQtY29tcGFuaWVzLWV0LWFsLmhlcm9rdWFwcC5jb20vdjEvdWJlcm5hdi5qc29uJywgZnVuY3Rpb24ocmVzcCkge1xuXHR2YXIgZGF0YSA9IHJlc3AuZGF0YTtcblx0aGVhZGVyLnF1ZXJ5U2VsZWN0b3IoJy5vLWhlYWRlcl9fc2Vjb25kYXJ5LS1tZW51LWpzJykuaW5uZXJIVE1MID0gJzx1bCBjbGFzcz1cInViZXItaW5kZXhcIj4nXG5cdFx0KyBkYXRhLm1hcChmdW5jdGlvbihpdGVtKSB7XG5cdFx0cmV0dXJuICc8bGkgY2xhc3M9XCJ1YmVyLWluZGV4X190aXRsZVwiIGRhdGEtby1ncmlkLWNvbHNwYW49XCI2IE02IEwzIFhMM1wiPidcblx0XHRcdCsgJzxhIGhyZWY9XCInICsgaXRlbS5uZXh0VXJsICsgJ1wiPicgKyBpdGVtLnRpdGxlICsgJzwvYT4nXG5cdFx0XHQrICc8dWwgY2xhc3M9XCJ1YmVyLWluZGV4X19jaGlsZHJlblwiPidcblx0XHRcdCsgaXRlbS5uYXZpZ2F0aW9uSXRlbXMubWFwKGZ1bmN0aW9uKGNoaWxkKSB7XG5cdFx0XHRcdHJldHVybiAnPGxpIGNsYXNzPVwidWJlci1pbmRleF9fY2hpbGRcIj48YSBocmVmPVwiJyArIGNoaWxkLm5leHRVcmwgKyAnXCI+JyArIGNoaWxkLnRpdGxlICsgJzwvYT48L2xpPic7XG5cdFx0XHR9KS5qb2luKCcnKVxuXHRcdFx0KyAnPC91bD4nXG5cdFx0XHQrICc8L2xpPic7XG5cdFx0fSkuam9pbignJyk7XG5cdFx0KyAnPC91bD4nO1xufSk7XG5cbmlmIChteUZ0KSBuZXh0VXNlclByZWZlcmVuY2VzLmluaXQobXlGdCwgeyBub3RpZnk6IHRydWUgfSk7XG4iLCIvKipcbiAqIE1lc3NhZ2UgdGhlIHVzZXJcbiAqXG4gKiA+IG5ldyBOb3RpZnkoeyBodG1sOiBcIllvdSd2ZSBnb3QgbWFpbFwiLCBsaWZlc3BhY2U6IDEwMDAwIH0pLnNob3coKTtcbiAqXG4gKiBUT0RPXG4gKlxuICogIC0gVVggdG8gZGVhbCB3aXRoIG11bHRpcGxlIG1lc3NhZ2VzLlxuICogIC0gVzMgLyBDaHJvbWUgZGVza3RvcCBub3RpZmljYXRpb25zIHBlcm1pc3Npb24uXG4gKiAgLSBBY2tub3dsZWRnZW1lbnQgVVhcbiAqXG4gKi9cbnZhciBOb3RpZnkgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgIHRoaXMudGVtcGxhdGUgPSAnPGgzIGNsYXNzPVwibWVzc2FnZV9fdGl0bGVcIj4nICsgbWVzc2FnZS50aXRsZSArICc8aSBjbGFzcz1cIm1lc3NhZ2VfX2Nsb3NlIGljb24gaWNvbl9fY2xvc2VcIj48L2k+PC9oMz48c3BhbiBjbGFzcz1cIm1lc3NhZ2VfX2JvZHlcIj4nICsgbWVzc2FnZS5ib2R5ICsgJzwvc3Bhbj4nO1xuICAgIHRoaXMubGlmZXNwYW4gPSBtZXNzYWdlLmxpZmVzcGFuIHx8IDUwMDA7XG4gICAgdGhpcy5kb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmRvbS5jbGFzc05hbWUgPSAnbWVzc2FnZV9fY29udGFpbmVyJ1xuICAgIHRoaXMuZG9tLmlubmVySFRNTCA9IHRoaXMudGVtcGxhdGU7IFxuICAgIHRoaXMuaGFzRGVza3RvcFBlcm1pc3Npb24gPSBmYWxzZTtcbiAgICB0aGlzLnJvb3QgPSBkb2N1bWVudC5ib2R5O1xuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVOb3RpZmljYXRpb24obWVzc2FnZSkge1xuICAgIHZhciBub3RpZmljYXRpb24gPSBuZXcgTm90aWZpY2F0aW9uKG1lc3NhZ2UudGl0bGUsIHtib2R5OiBtZXNzYWdlLmJvZHl9KTtcbiAgICBub3RpZmljYXRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBtZXNzYWdlLm9uY2xpY2spO1xuICAgIHJldHVybiBub3RpZmljYXRpb247XG59XG5cbk5vdGlmeS5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICBcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gZ3JhbnRlZFxuICAgIC8vVE9ETyAtIGVuYWJsZSB0aGlzIGFnYWluIG9uY2Ugd2UndmUgdGhvdWdodCBhYm91dCB0aGUgVVghXG4gICAgaWYgKGZhbHNlICYmIHdpbmRvdy5Ob3RpZmljYXRpb24gJiYgTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgIGNyZWF0ZU5vdGlmaWNhdGlvbihzZWxmLm1lc3NhZ2UpO1xuICAgIH0gZWxzZSBpZiAoZmFsc2UgJiYgd2luZG93Lk5vdGlmaWNhdGlvbiAmJiBOb3RpZmljYXRpb24ucGVybWlzc2lvbiAhPT0gXCJkZW5pZWRcIikge1xuICAgICAgXG4gICAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbihmdW5jdGlvbiAoc3RhdHVzKSB7XG4gICAgICAgICAgICBpZiAoTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gIT09IHN0YXR1cykge1xuICAgICAgICAgICAgICAgIE5vdGlmaWNhdGlvbi5wZXJtaXNzaW9uID0gc3RhdHVzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBncmFudGVkXG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSBcImdyYW50ZWRcIikge1xuICAgICAgICAgICAgICAgIGNyZWF0ZU5vdGlmaWNhdGlvbihzZWxmLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNob3dIdG1sTm90aWZpY2F0aW9uKCk7ICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAvLyBkZW5pZWRcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNob3dIdG1sTm90aWZpY2F0aW9uKCk7ICAgIFxuICAgIH1cbn07XG5cbk5vdGlmeS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBGSVhNRSBmb3JnZXQgaWYgSSBuZWVkIHRvIHJlbW92ZSBldmVudCBsaXN0ZW5lciA6KVxuICAgIHRoaXMuZG9tLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5kb20pO1xufTtcblxuTm90aWZ5LnByb3RvdHlwZS5zaG93SHRtbE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMucm9vdC5hcHBlbmRDaGlsZCh0aGlzLmRvbSk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGRlc3Ryb3kgdGhlIGJveCBhZnRlciBhIGZldyBzZWNvbmRzXG4gICAgdmFyIHNlbGZEZXN0cnVjdCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICB9LCB0aGlzLmxpZmVzcGFuKTsgXG5cbiAgICAvLyBBY2tub3dsZWRnbWVudCBVSVxuICAgIHRoaXMuZG9tLnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlX19jbG9zZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGZEZXN0cnVjdCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmRvbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmKGUudGFyZ2V0LmNsYXNzTmFtZS5pbmRleE9mKCdtZXNzYWdlX19jbG9zZScpID49IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLm1lc3NhZ2Uub25jbGljaygpO1xuICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGZEZXN0cnVjdCk7XG4gICAgfSk7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTm90aWZ5OyIsIi8vIFN0b3JlcyBhIHVuaXF1ZSBsaXN0IG9mIHRoaW5ncyAoRWcsIHNlY3Rpb25zLCBmYXZvdXJpdGVzLCBoaXN0b3J5KSBhZ2FpbnN0IGFcbi8vIGtleSBpbiBsb2NhbFN0b3JhZ2VcblxudmFyIHJlcXdlc3QgPSByZXF1aXJlKCcuLi92ZW5kb3IvcmVxd2VzdC5taW4nKTtcblxudmFyIEFQSV9VUkwgPSAnaHR0cDovL2Z0LW5leHQtYXBpLXVzZXItcHJlZnMuaGVyb2t1YXBwLmNvbS91c2VyLyc7XG5cbnZhciBlbWl0ID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICBpZiAoZGF0YSkge1xuICAgIGV2ZW50LmRldGFpbCA9IGRhdGE7XG4gIH1cbiAgdG9wLmRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxuXG52YXIgTWUgPSBmdW5jdGlvbiAoa2V5LCB1c2VySWQpIHtcbiAgaWYgKCFrZXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IHN1cHBseSBhIGtleSAvXlthLXpdKyQvJyk7XG4gIH1cbiAgdGhpcy5rZXkgPSBrZXk7XG5cbiAgdGhpcy5sb2NhbFN0b3JhZ2VLZXkgPSAnZnQubmV4dC51c2VyLicgKyBrZXk7XG5cbiAgaWYodXNlcklkKSB7XG4gICAgdGhpcy5hcGlVUkwgPSBBUElfVVJMICsga2V5O1xuICAgIHRoaXMudXNlcklkID0gdXNlcklkO1xuICB9ICAgICAgXG4gICAgLy9TdGFydCBvZmYgd2l0aCBsb2NhbCBjb3B5Li4uXG4gICAgdGhpcy52YWwgPSB0aGlzLmdldE9yQ3JlYXRlKCk7XG4gICAgLy9UaGVuIHRyeSBhbmQgZmV0Y2ggc2VydmVyIGNvcHlcbiAgICB0aGlzLmZldGNoKCk7XG5cbiAgfTtcblxuICBNZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIGtleSA9IGtleSB8fCB0aGlzLmxvY2FsU3RvcmFnZUtleTtcbiAgICB2YXIgZXhpc3RzID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICBpZiAoZXhpc3RzKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShleGlzdHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5nZXRPckNyZWF0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBrZXkgPSBrZXkgfHwgdGhpcy5sb2NhbFN0b3JhZ2VLZXk7XG4gICAgdmFyIHNhdmVkID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZihzYXZlZCkge1xuICAgICAgcmV0dXJuIHNhdmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZW1wdHkgPSBbXTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoZW1wdHkpKTtcbiAgICAgIHJldHVybiBlbXB0eTtcbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgLy9JZiBubyB1c2VySUQgZG9uJ3QgZmV0Y2ggZnJvbSBzZXJ2ZXJcbiAgICBpZighdGhpcy51c2VySWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXF3ZXN0KHtcbiAgICAgIHVybDogdGhpcy5hcGlVUkwsXG4gICAgICB0eXBlOiAnanNvbicsXG4gICAgICBtZXRob2Q6ICdnZXQnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1GVC1VSUQnOiB0aGlzLnVzZXJJZFxuICAgICAgfSxcbiAgICAgIGNyb3NzT3JpZ2luOiB0cnVlXG4gICAgfSkudGhlbihmdW5jdGlvbihmYXZlcykge1xuICAgICAgaWYoZmF2ZXMpIHtcbiAgICAgICAgbWUudmFsID0gZmF2ZXM7XG4gICAgICAgIC8vYWNjZXB0IHRoZSBzZXJ2ZXIgY29weSBhcyAndGhlIHRydXRoJy4uLlxuICAgICAgICBtZS5zYXZlKG1lLnZhbCk7XG4gICAgICAgIC8vYnV0IHRoZW4gcHJvY2VzcyBhbnkgbGVmdG92ZXIgcmVxdWVzdHMgbG9jYWxseVxuICAgICAgICBtZS5wcm9jZXNzUGVuZGluZygnYWRkJyk7XG4gICAgICAgIG1lLnByb2Nlc3NQZW5kaW5nKCdyZW1vdmUnKTtcbiAgICAgICAgbWUucHJvY2Vzc1BlbmRpbmcoJ2NsZWFyJyk7XG4gICAgICB9XG4gICAgfSkuYWx3YXlzKGZ1bmN0aW9uKGVycikge1xuICAgICAgLy90cmlnZ2VyIGxvYWQgYW5kIHVwZGF0ZSBldmVudHNcbiAgICAgIGVtaXQobWUua2V5ICsgJzpsb2FkJywgbWUpO1xuICAgICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTtcbiAgICB9KTsgIFxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24gKG9iaiwga2V5KSB7XG4gICAga2V5ID0ga2V5IHx8IHRoaXMubG9jYWxTdG9yYWdlS2V5O1xuICAgIGlmKG9iaiAmJiBvYmoubGVuZ3RoKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KG9iaikpOyBcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmFkZFBlbmRpbmcgPSBmdW5jdGlvbihvYmosIGFjdGlvbikge1xuICAgIHZhciBwZW5kaW5nID0gdGhpcy5nZXRPckNyZWF0ZSh0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuJyArIGFjdGlvbik7XG4gICAgcGVuZGluZy5wdXNoKG9iaik7XG4gICAgLy9pZiB3ZSdyZSBhZGRpbmcgc29tZXRoaW5nLCB0aGVuIGdldCByaWQgb2YgYW55IHBlbmRpbmcgY2xlYXIgcmVxdWVzdHNcbiAgICBpZihhY3Rpb24gPT09ICdhZGQnKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLmxvY2FsU3RvcmFnZUtleSArICcuY2xlYXInKTtcbiAgICB9XG4gICAgdGhpcy5zYXZlKHBlbmRpbmcsIHRoaXMubG9jYWxTdG9yYWdlS2V5ICsgJy4nICsgYWN0aW9uKTtcbiAgfTtcblxuICBNZS5wcm90b3R5cGUucHJvY2Vzc1BlbmRpbmcgPSBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHZhciBwZW5kaW5nID0gdGhpcy5nZXQodGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLicgKyBhY3Rpb24pO1xuICAgIGlmKHBlbmRpbmcgJiYgcGVuZGluZy5sZW5ndGgpIHtcbiAgICAgIC8vQ2xlYXIgaXMgYSBzcGVjaWFsIGNhc2VcbiAgICAgIGlmKGFjdGlvbiA9PT0gJ2NsZWFyJykge1xuICAgICAgICBpZihwZW5kaW5nW3BlbmRpbmcubGVuZ3RoIC0gMV0gPT09IHRydWUpIHtcbiAgICAgICAgICBtZS5jbGVhcigpO1xuICAgICAgICAgIHBlbmRpbmcgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwZW5kaW5nLmZvckVhY2goZnVuY3Rpb24oaXRlbVRvQWRkLCBpbmRleCkge1xuICAgICAgICAgICAvLyByZW1vdmUgdGhlIGl0ZW0gZnJvbSB0aGUgdG9kbyBsaXN0IGFuZCBleGVjdXRlIHRoZSBhY3Rpb24gXG4gICAgICAgICAgIHBlbmRpbmcuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgbWVbYWN0aW9uXShpdGVtVG9BZGQpO1xuICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNhdmUocGVuZGluZywgdGhpcy5sb2NhbFN0b3JhZ2VLZXkgKyAnLicgKyBhY3Rpb24pO1xuICAgIH1cblxuICB9O1xuXG4gIE1lLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICB0aGlzLnZhbCA9IHRoaXMuZ2V0T3JDcmVhdGUoKTtcbiAgICBpZiAoIXRoaXMuZXhpc3RzKG9iai51dWlkdjMpKSB7XG4gICAgICB0aGlzLnZhbC5wdXNoKG9iaik7XG4gICAgICB0aGlzLnNhdmUodGhpcy52YWwpO1xuICAgICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTsgLy90cmlnZ2VyIGV2ZW50IHRvIHJlbmRlciBVSVxuXG4gICAgICAvL1NlbmQgYSByZXF1ZXN0IHRvIGFkZCB0byBzZXJ2ZXJcbiAgICAgIGlmKHRoaXMuYXBpVVJMKSB7XG4gICAgICAgIHJlcXdlc3Qoe1xuICAgICAgICAgIHVybDogdGhpcy5hcGlVUkwsXG4gICAgICAgICAgbWV0aG9kOiAncHV0JyxcbiAgICAgICAgICB0eXBlOiAnanNvbicsXG4gICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShvYmopLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdYLUZULVVJRCc6IHRoaXMudXNlcklkXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjcm9zc09yaWdpbjogdHJ1ZVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG1lLmFkZFBlbmRpbmcob2JqLCAnYWRkJyk7IC8vc2VydmVyIHJlcXVlc3QgZmFpbGVkIHNvIHB1c2ggaXQgdG8gdGhlIGxpc3Qgb2YgcGVuZGluZ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgdGhpcy52YWwgPSB0aGlzLmdldE9yQ3JlYXRlKCk7XG4gICAgdGhpcy52YWwgPSB0aGlzLnZhbC5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIChpdGVtLnV1aWR2MyAhPT0gb2JqLnV1aWR2Myk7XG4gICAgfSk7XG4gICAgdGhpcy5zYXZlKHRoaXMudmFsKTtcblxuICAgIGVtaXQobWUua2V5ICsgJzp1cGRhdGUnLCBtZSk7IC8vdHJpZ2dlciBldmVudCB0byByZW5kZXIgVUlcblxuICAgIC8vU2VuZCBhIHJlcXVlc3QgdG8gZGVsZXRlIGZyb20gc2VydmVyXG4gICAgaWYodGhpcy5hcGlVUkwpIHtcblxuICAgICAgcmVxd2VzdCh7XG4gICAgICAgIHVybDogdGhpcy5hcGlVUkwgKyAnLycgKyBlbmNvZGVVUkkoZGVjb2RlVVJJKG9iai51dWlkdjMpKSxcbiAgICAgICAgdHlwZTogJ2pzb24nLFxuICAgICAgICBtZXRob2Q6ICdkZWxldGUnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ1gtRlQtVUlEJzogdGhpcy51c2VySWRcbiAgICAgICAgfSxcbiAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgIH0pLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIG1lLmFkZFBlbmRpbmcob2JqLCAncmVtb3ZlJyk7ICAvL3NlcnZlciByZXF1ZXN0IGZhaWxlZCBzbyBwdXNoIGl0IHRvIHRoZSBsaXN0IG9mIHBlbmRpbmdcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuXG4gIE1lLnByb3RvdHlwZS5leGlzdHMgPSBmdW5jdGlvbiAodXVpZCkge1xuICAgIHRoaXMudmFsID0gdGhpcy5nZXRPckNyZWF0ZSgpO1xuICAgIHJldHVybiB0aGlzLnZhbC5zb21lKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICByZXR1cm4gaXRlbS51dWlkdjMgPT09IHV1aWQ7XG4gICAgfSk7XG4gIH07XG5cbiAgTWUucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtZSA9IHRoaXM7XG4gICAgdmFyIHN0YXR1cyA9IGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMubG9jYWxTdG9yYWdlS2V5KTtcbiAgICB0aGlzLnZhbCA9IFtdO1xuXG4gICAgZW1pdChtZS5rZXkgKyAnOnVwZGF0ZScsIG1lKTsgLy90cmlnZ2VyIGV2ZW50IHRvIHJlbmRlciBVSVxuXG4gICAgICAvL1NlbmQgYSByZXF1ZXN0IHRvIGRlbGV0ZSBBTEwgZnJvbSBzZXJ2ZXJcbiAgICAgIGlmKHRoaXMuYXBpVVJMKSB7XG5cbiAgICAgICAgcmVxd2VzdCh7XG4gICAgICAgICAgdXJsOiB0aGlzLmFwaVVSTCxcbiAgICAgICAgICB0eXBlOiAnanNvbicsXG4gICAgICAgICAgbWV0aG9kOiAnZGVsZXRlJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnWC1GVC1VSUQnOiB0aGlzLnVzZXJJZFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY3Jvc3NPcmlnaW46IHRydWVcbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgICBtZS5hZGRQZW5kaW5nKHRydWUsICdjbGVhcicpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9O1xuXG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IE1lO1xuXG4iLCJ2YXIgcmVxd2VzdCA9IHJlcXVpcmUoJy4uL3ZlbmRvci9yZXF3ZXN0Lm1pbicpO1xuXG5cbnZhciBOT1RJRklDQVRJT05TX1VSTCA9ICdodHRwOi8vZnQtbmV4dC1hcGktdXNlci1wcmVmcy5oZXJva3VhcHAuY29tL3VzZXIvbm90aWZpY2F0aW9ucy8nO1xudmFyIGVtaXQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG5cdHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuXHRldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG5cdGlmIChkYXRhKSB7XG5cdFx0ZXZlbnQuZGV0YWlsID0gZGF0YTtcblx0fVxuXHR0b3AuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5cbmZ1bmN0aW9uIGV4dHJhY3RTZWFyY2hUZXJtKHF1ZXJ5U3RyaW5nKSB7XG4gICAgcmV0dXJuIHF1ZXJ5U3RyaW5nLm1hdGNoKC9xPShbXiZdKikvKVsxXTtcbn1cblxudmFyIGdldEN1cnJlbnRTdHJlYW0gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG9uQXJ0aWNsZSA9IC9eXFwvW2EtZjAtOV0rLSguKikvLnRlc3QobG9jYXRpb24ucGF0aG5hbWUpOyAvLyAnMjdhNWUyODYtNDMxNC0xMWU0LThhNDMtMDAxNDRmZWFiZGMwJzsgXG4gIGlmKG9uQXJ0aWNsZSB8fCBsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKCcvc2VhcmNoJykgIT09IDApIHsgLy9oYWNreSB3YXkgdG8gZXhjbHVkZSBob21lcGFnZSFcbiAgXHRyZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gIFx0cmV0dXJuIGV4dHJhY3RTZWFyY2hUZXJtKGxvY2F0aW9uLnNlYXJjaCk7XG4gIH1cbn07XG5cblxuZnVuY3Rpb24gTm90aWZpY2F0aW9uUG9sbGVyKHVzZXJQcmVmZXJlbmNlTGlzdCkge1xuXHR0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdCA9IHVzZXJQcmVmZXJlbmNlTGlzdDtcblx0c2V0SW50ZXJ2YWwodGhpcy5wb2xsLmJpbmQodGhpcyksIDEwMDAgKiA2MCAqIDAuMik7IC8vMzAgc2Vjb25kIHBvbGxpbmdcblx0dGhpcy5ub3RpZmljYXRpb25zID0ge307XG5cblx0Ly9DbGVhciBub3RpZmljYXRpb25zIGlmIGEgc3RyZWFtIGhhcyBiZWVuIG9wZW5lbmRcblx0dGhpcy5jdXJyZW50U3RyZWFtID0gZ2V0Q3VycmVudFN0cmVhbSgpO1xuXHRpZihsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKCcvZmF2b3VyaXRlcycpID49IDApIHtcblx0XHR0aGlzLmNsZWFyKClcblx0fSBlbHNlIGlmKHRoaXMuY3VycmVudFN0cmVhbSkge1xuXHRcdHRoaXMuY2xlYXIodGhpcy5jdXJyZW50U3RyZWFtKTtcblx0fVxuXG5cdHRoaXMucG9sbCh0cnVlKTsgLy9wYXNzIGZsYWcgdG8gaW5kaWNhdGUgdGhpcyBpcyB0aGUgZmlyc3QgbG9hZFxuXG59XG5cbk5vdGlmaWNhdGlvblBvbGxlci5wcm90b3R5cGUucG9sbCA9IGZ1bmN0aW9uKGZpcnN0TG9hZCkge1xuXHR2YXIgcG9sbGVyID0gdGhpcztcblx0dmFyIG5vdGlmaWNhdGlvblByb21pc2VzID0gW107XG5cdHZhciBuZXdOb3RpZmljYXRpb25zO1xuXHR0aGlzLnVzZXJQcmVmZXJlbmNlTGlzdC5saXN0LmdldCgpLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XG5cdFx0Ly9kb24ndCBib3RoZXIgZmV0Y2hpbmcgaWYgeW91IGFyZSBvbiB0aGF0IHN0cmVhbSBjdXJyZW50bHlcblx0XHQoZnVuY3Rpb24oc3RyZWFtKSB7XG5cdFx0XHRpZihzdHJlYW0ucmVzb3VyY2VUeXBlICE9PSAnc3RyZWFtJykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRub3RpZmljYXRpb25Qcm9taXNlcy5wdXNoKHJlcXdlc3Qoe1xuXHRcdFx0XHR1cmw6IE5PVElGSUNBVElPTlNfVVJMICsgc3RyZWFtLnV1aWR2Myxcblx0XHRcdFx0dHlwZTogJ2pzb24nLFxuXHRcdFx0XHRtZXRob2Q6ICdnZXQnLFxuXHRcdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdFx0J1gtRlQtVUlEJzogcG9sbGVyLnVzZXJQcmVmZXJlbmNlTGlzdC51c2VySWRcblx0XHRcdFx0fSxcblx0XHRcdFx0Y3Jvc3NPcmlnaW46IHRydWVcblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24obm90aWZpY2F0aW9ucykge1xuXHRcdFx0XHRpZihub3RpZmljYXRpb25zICYmIG5vdGlmaWNhdGlvbnMubGVuZ3RoKSB7XG5cblx0XHRcdFx0XHQvL0lmIHRoZSBzdHJlYW0gaXMgY3VycmVudGx5IG9wZW4sIGVtaXQgYW4gZXZlbnQgd2l0aCB0aGUgbm90aWZpY2F0aW9ucywgYW5kIHRoZW4gY2xlYXIgdGhlbVxuXHRcdFx0XHRcdC8vIChidXQgb25seSBkbyB0aGlzIG9uY2UpXG5cdFx0XHRcdFx0aWYoZmlyc3RMb2FkICYmIHN0cmVhbS51dWlkdjMgPT09IHBvbGxlci5jdXJyZW50U3RyZWFtKSB7XG5cdFx0XHRcdFx0XHRlbWl0KCdub3RpZmljYXRpb25zOm9wZW5lZCcsIHsgdXVpZHYzOiBzdHJlYW0udXVpZHYzLCBub3RpZmljYXRpb25zOiBub3RpZmljYXRpb25zIH0pO1xuXHRcdFx0XHRcdFx0cG9sbGVyLmNsZWFyKHN0cmVhbS51dWlkdjMpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG5ld05vdGlmaWNhdGlvbnMgPSBmaWx0ZXJOZXcocG9sbGVyLm5vdGlmaWNhdGlvbnNbc3RyZWFtLnV1aWR2M10sIG5vdGlmaWNhdGlvbnMpO1xuXG5cdFx0XHRcdFx0aWYoIWZpcnN0TG9hZCAmJiBuZXdOb3RpZmljYXRpb25zLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0ZW1pdCgnbm90aWZpY2F0aW9uczpuZXcnLCB7IHN0cmVhbTogc3RyZWFtLCBub3RpZmljYXRpb25zOiBuZXdOb3RpZmljYXRpb25zIH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRwb2xsZXIubm90aWZpY2F0aW9uc1tzdHJlYW0udXVpZHYzXSA9IG5vdGlmaWNhdGlvbnM7XG5cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkZWxldGUgcG9sbGVyLm5vdGlmaWNhdGlvbnNbc3RyZWFtLnV1aWR2M107XG5cdFx0XHRcdH1cblx0XHRcdFx0cG9sbGVyLnJlbmRlcigpO1xuXHRcdFx0fSkpO1xuXG5cdFx0fShzdHJlYW0pKVxuXHRcdFxuXHR9KTtcblxuXHRQcm9taXNlLmFsbChub3RpZmljYXRpb25Qcm9taXNlcykudGhlbihmdW5jdGlvbihzdHJlYW1Ob3RpZmljYXRpb25zKSB7XG5cdFx0aWYocG9sbGVyLm5vdGlmaWNhdGlvbnMpIHtcblx0XHRcdGVtaXQoJ25vdGlmaWNhdGlvbnM6bG9hZCcsIHBvbGxlci5ub3RpZmljYXRpb25zKTtcblx0XHR9XG5cdH0pO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyTmV3KG9yaWdpbmFsTGlzdCwgbmV3TGlzdCkge1xuXHRvcmlnaW5hbExpc3QgPSBvcmlnaW5hbExpc3QgfHwgW107XG5cdG5ld0xpc3QgPSBuZXdMaXN0IHx8IFtdO1xuXHR2YXIgb3JpZ2luYWxJZHMgPSBvcmlnaW5hbExpc3QubWFwKGZ1bmN0aW9uKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uaWQ7IH0pO1xuXHRyZXR1cm4gbmV3TGlzdC5maWx0ZXIoZnVuY3Rpb24obm90aWYpIHsgcmV0dXJuIChvcmlnaW5hbElkcy5pbmRleE9mKG5vdGlmLmlkKSA8IDApOyB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQmFkZ2UoZWwsIG51bWJlcikge1xuXHR2YXIgYmFkZ2UgPSBlbC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdqcy1ub3RpZnktYmFkZ2UnKVswXTtcblx0aWYoIWJhZGdlKSB7XG5cdFx0YmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cdFx0YmFkZ2UuY2xhc3NOYW1lID0gJ25vdGlmeS1iYWRnZSBqcy1ub3RpZnktYmFkZ2UnO1xuXHRcdGVsLmFwcGVuZENoaWxkKGJhZGdlKTtcblx0fVxuXHRpZihudW1iZXIgPiAwKSB7XG5cdFx0YmFkZ2UucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuXHRcdGJhZGdlLnRleHRDb250ZW50ID0gbnVtYmVyO1xuXHR9IGVsc2Uge1xuXHRcdGJhZGdlLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnJyk7XG5cdH1cbn1cblxuTm90aWZpY2F0aW9uUG9sbGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcblx0Zm9yKHZhciBzdHJlYW0gaW4gdGhpcy5ub3RpZmljYXRpb25zKSB7XG5cdFx0bGluayA9IHRoaXMudXNlclByZWZlcmVuY2VMaXN0LmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbaHJlZj1cIi9zZWFyY2g/cT0nICsgc3RyZWFtICsgJ1wiXScpO1xuXHRcdGlmKGxpbmspIHtcblx0XHRcdHJlbmRlckJhZGdlKGxpbmssIHRoaXMubm90aWZpY2F0aW9uc1tzdHJlYW1dLmxlbmd0aCk7XG5cdFx0fVxuXHR9XG59O1xuXG5Ob3RpZmljYXRpb25Qb2xsZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24odXVpZCkge1xuXHRpZih1dWlkKSB7XG5cdFx0dGhpcy5ub3RpZmljYXRpb25zW3V1aWRdID0gW107XG5cdFx0cmVxd2VzdCh7XG5cdFx0XHR1cmw6IE5PVElGSUNBVElPTlNfVVJMICsgdXVpZCxcblx0XHRcdHR5cGU6ICdqc29uJyxcblx0XHRcdG1ldGhvZDogJ2RlbGV0ZScsXG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdYLUZULVVJRCc6IHRoaXMudXNlclByZWZlcmVuY2VMaXN0LnVzZXJJZFxuXHRcdFx0fSxcblx0XHRcdGNyb3NzT3JpZ2luOiB0cnVlXG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIHV1aWQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0dGhpcy5ub3RpZmljYXRpb25zID0ge307XG5cdH1cblx0dGhpcy5yZW5kZXIoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTm90aWZpY2F0aW9uUG9sbGVyOyIsInZhciBOb3RpZmljYXRpb25Qb2xsZXIgPSByZXF1aXJlKCcuL05vdGlmaWNhdGlvblBvbGxlcicpO1xudmFyIE1lID0gcmVxdWlyZSgnLi9NZScpO1xuXG52YXIgJCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICByZXR1cm4gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSk7XG59O1xudmFyIGVtaXQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG4gIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICBldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gIGlmIChkYXRhKSB7XG4gICAgZXZlbnQuZGV0YWlsID0gZGF0YTtcbiAgfVxuICB0b3AuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG52YXIgZ2V0VXNlcklkID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2YWx1ZSA9IFwiOyBcIiArIGRvY3VtZW50LmNvb2tpZTtcbiAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCI7IEZUX1U9XCIpO1xuICB2YXIgZnRVID0gcGFydHMucG9wKCkuc3BsaXQoXCI7XCIpLnNoaWZ0KCk7XG4gIGlmKGZ0VSkge1xuICAgIHJldHVybiBmdFUubWF0Y2goL19FSUQ9KFxcZCspX1BJRC8pWzFdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybjtcbiAgfVxufTtcblxudmFyIFVzZXJQcmVmZXJlbmNlTGlzdCA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgb3B0cykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMudXNlcklkID0gZ2V0VXNlcklkKCk7XG4gIHRoaXMua2V5ID0gY29udGFpbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS11c2VyLXByZWZlcmVuY2UtbGlzdCcpO1xuICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgdGhpcy5ub3RpZnkgPSBvcHRzLm5vdGlmeTtcblxufTtcblxuVXNlclByZWZlcmVuY2VMaXN0LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgaWYoIXRoaXMudXNlcklkKSB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5rZXkgKyAnOmFkZCcsIGZ1bmN0aW9uKGV2KSB7XG4gICAgc2VsZi5hZGQoZXYuZGV0YWlsKTtcbiAgfSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5rZXkgKyAnOnJlbW92ZScsIGZ1bmN0aW9uKGV2KSB7XG4gICAgc2VsZi5yZW1vdmUoZXYuZGV0YWlsKTtcbiAgfSk7XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmtleSArICc6Y2xlYXInLCB0aGlzLmNsZWFyLmJpbmQodGhpcykpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMua2V5ICsgJzp1cGRhdGUnLCB0aGlzLnJlbmRlci5iaW5kKHRoaXMpKTtcblxuICAkKCdbZGF0YS1saXN0LXNvdXJjZT1cIicgKyB0aGlzLmtleSArICdcIl0gLmNsZWFyX19idXR0b24nKS5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLmNsZWFyLmJpbmQoc2VsZikpO1xuICB9KTtcblxuICB0aGlzLmxpc3QgPSBuZXcgTWUodGhpcy5rZXksIHRoaXMudXNlcklkKTtcblxuICBpZih0aGlzLm5vdGlmeSA9PT0gdHJ1ZSkge1xuICAgIHRoaXMubm90aWZpZXIgPSBuZXcgTm90aWZpY2F0aW9uUG9sbGVyKHRoaXMpO1xuICB9XG59XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtZSA9IHRoaXM7XG4gIHZhciBocmVmID0gJyc7XG5cbiAgdmFyIGxpbmtzID0gdGhpcy5saXN0ID8gdGhpcy5saXN0LmdldE9yQ3JlYXRlKCkucmV2ZXJzZSgpIDogW107XG5cbiAgdmFyIGxpbmtzSFRNTCA9IGxpbmtzLm1hcChmdW5jdGlvbiAoc2VjdGlvbikge1xuICAgIGhyZWYgPSBzZWN0aW9uLnJlc291cmNlVHlwZSA9PT0gJ3N0cmVhbScgPyAnL3NlYXJjaD9xPScgKyBzZWN0aW9uLnV1aWR2MyA6ICcvJyArIHNlY3Rpb24udXVpZHYzO1xuICAgIHJldHVybiAnPGxpIGNsYXNzPVwiaXRlbS10eXBlLS0nICsgc2VjdGlvbi5yZXNvdXJjZVR5cGUgKyAnXCI+PGEgaHJlZj1cIicgKyBocmVmICsgJ1wiPicgKyBzZWN0aW9uLmRpc3BsYXlUZXh0ICsgJzwvYT48L2xpPic7XG4gIH0pLmpvaW4oJycpO1xuICBcbiAgaWYodGhpcy5jb250YWluZXIpIHtcbiAgICB0aGlzLmNvbnRhaW5lci5pbm5lckhUTUwgPSAgbGlua3NIVE1MO1xuICB9XG4gIGlmKHRoaXMubm90aWZpZXIpIHtcbiAgICB0aGlzLm5vdGlmaWVyLnJlbmRlcigpO1xuICB9XG59O1xuXG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24ob2JqKSB7XG4gIHRoaXMubGlzdC5hZGQob2JqKTtcbn07XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24ob2JqKSB7XG4gIHRoaXMubGlzdC5yZW1vdmUob2JqKTtcbn07XG5cblVzZXJQcmVmZXJlbmNlTGlzdC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5saXN0LmNsZWFyKCk7XG59O1xuXG5Vc2VyUHJlZmVyZW5jZUxpc3QuaW5pdCA9IGZ1bmN0aW9uKHJvb3RFbCwgb3B0cykge1xuICB2YXIgY29tcG9uZW50cyA9IHt9LCBcbiAgICAgIGZFbHMsIFxuICAgICAgYywgbCwgXG4gICAgICBjb21wb25lbnQ7XG5cbiAgcm9vdEVsID0gcm9vdEVsIHx8IGRvY3VtZW50LmJvZHk7XG4gIC8vc2V0IGNvbmZpZyB3aXRoIG92ZXJyaWRlcyBwYXNzZWQgdGhyb3VnaFxuXG4gIGlmIChyb290RWwucXVlcnlTZWxlY3RvckFsbCkge1xuICAgIGZFbHMgPSByb290RWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdXNlci1wcmVmZXJlbmNlLWxpc3RdJyk7XG4gICAgZm9yIChjID0gMCwgbCA9IGZFbHMubGVuZ3RoOyBjIDwgbDsgYysrKSB7XG4gICAgICBpZiAoIWZFbHNbY10uaGFzQXR0cmlidXRlKCdkYXRhLW8tYXV0aG9yLWFsZXJ0cy0tanMnKSkge1xuICAgICAgICBjb21wb25lbnQgPSBuZXcgVXNlclByZWZlcmVuY2VMaXN0KGZFbHNbY10sIG9wdHMgfHwge30pO1xuICAgICAgICBjb21wb25lbnQuaW5pdChvcHRzKTtcbiAgICAgICAgY29tcG9uZW50c1tmRWxzW2NdLmdldEF0dHJpYnV0ZSgnZGF0YS11c2VyLXByZWZlcmVuY2UtbGlzdCcpXSA9IGNvbXBvbmVudDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50cztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBVc2VyUHJlZmVyZW5jZUxpc3Q7XG4iLCJ2YXIgVXNlclByZWZlcmVuY2VMaXN0ID0gcmVxdWlyZSgnLi9saWIvVXNlclByZWZlcmVuY2VMaXN0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXNlclByZWZlcmVuY2VMaXN0OyIsIi8qIVxuICAqIFJlcXdlc3QhIEEgZ2VuZXJhbCBwdXJwb3NlIFhIUiBjb25uZWN0aW9uIG1hbmFnZXJcbiAgKiBsaWNlbnNlIE1JVCAoYykgRHVzdGluIERpYXogMjAxNFxuICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kZWQvcmVxd2VzdFxuICAqL1xuIWZ1bmN0aW9uKGUsdCxuKXt0eXBlb2YgbW9kdWxlIT1cInVuZGVmaW5lZFwiJiZtb2R1bGUuZXhwb3J0cz9tb2R1bGUuZXhwb3J0cz1uKCk6dHlwZW9mIGRlZmluZT09XCJmdW5jdGlvblwiJiZkZWZpbmUuYW1kP2RlZmluZShuKTp0W2VdPW4oKX0oXCJyZXF3ZXN0XCIsdGhpcyxmdW5jdGlvbigpe2Z1bmN0aW9uIHN1Y2NlZWQoZSl7cmV0dXJuIGh0dHBzUmUudGVzdCh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wpP3R3b0h1bmRvLnRlc3QoZS5zdGF0dXMpOiEhZS5yZXNwb25zZX1mdW5jdGlvbiBoYW5kbGVSZWFkeVN0YXRlKGUsdCxuKXtyZXR1cm4gZnVuY3Rpb24oKXtpZihlLl9hYm9ydGVkKXJldHVybiBuKGUucmVxdWVzdCk7ZS5yZXF1ZXN0JiZlLnJlcXVlc3RbcmVhZHlTdGF0ZV09PTQmJihlLnJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlPW5vb3Asc3VjY2VlZChlLnJlcXVlc3QpP3QoZS5yZXF1ZXN0KTpuKGUucmVxdWVzdCkpfX1mdW5jdGlvbiBzZXRIZWFkZXJzKGUsdCl7dmFyIG49dC5oZWFkZXJzfHx7fSxyO24uQWNjZXB0PW4uQWNjZXB0fHxkZWZhdWx0SGVhZGVycy5hY2NlcHRbdC50eXBlXXx8ZGVmYXVsdEhlYWRlcnMuYWNjZXB0W1wiKlwiXTt2YXIgaT10eXBlb2YgRm9ybURhdGE9PVwiZnVuY3Rpb25cIiYmdC5kYXRhIGluc3RhbmNlb2YgRm9ybURhdGE7IXQuY3Jvc3NPcmlnaW4mJiFuW3JlcXVlc3RlZFdpdGhdJiYobltyZXF1ZXN0ZWRXaXRoXT1kZWZhdWx0SGVhZGVycy5yZXF1ZXN0ZWRXaXRoKSwhbltjb250ZW50VHlwZV0mJiFpJiYobltjb250ZW50VHlwZV09dC5jb250ZW50VHlwZXx8ZGVmYXVsdEhlYWRlcnMuY29udGVudFR5cGUpO2ZvcihyIGluIG4pbi5oYXNPd25Qcm9wZXJ0eShyKSYmXCJzZXRSZXF1ZXN0SGVhZGVyXCJpbiBlJiZlLnNldFJlcXVlc3RIZWFkZXIocixuW3JdKX1mdW5jdGlvbiBzZXRDcmVkZW50aWFscyhlLHQpe3R5cGVvZiB0LndpdGhDcmVkZW50aWFscyE9XCJ1bmRlZmluZWRcIiYmdHlwZW9mIGUud2l0aENyZWRlbnRpYWxzIT1cInVuZGVmaW5lZFwiJiYoZS53aXRoQ3JlZGVudGlhbHM9ISF0LndpdGhDcmVkZW50aWFscyl9ZnVuY3Rpb24gZ2VuZXJhbENhbGxiYWNrKGUpe2xhc3RWYWx1ZT1lfWZ1bmN0aW9uIHVybGFwcGVuZChlLHQpe3JldHVybiBlKygvXFw/Ly50ZXN0KGUpP1wiJlwiOlwiP1wiKSt0fWZ1bmN0aW9uIGhhbmRsZUpzb25wKGUsdCxuLHIpe3ZhciBpPXVuaXFpZCsrLHM9ZS5qc29ucENhbGxiYWNrfHxcImNhbGxiYWNrXCIsbz1lLmpzb25wQ2FsbGJhY2tOYW1lfHxyZXF3ZXN0LmdldGNhbGxiYWNrUHJlZml4KGkpLHU9bmV3IFJlZ0V4cChcIigoXnxcXFxcP3wmKVwiK3MrXCIpPShbXiZdKylcIiksYT1yLm1hdGNoKHUpLGY9ZG9jLmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIiksbD0wLGM9bmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiTVNJRSAxMC4wXCIpIT09LTE7cmV0dXJuIGE/YVszXT09PVwiP1wiP3I9ci5yZXBsYWNlKHUsXCIkMT1cIitvKTpvPWFbM106cj11cmxhcHBlbmQocixzK1wiPVwiK28pLHdpbltvXT1nZW5lcmFsQ2FsbGJhY2ssZi50eXBlPVwidGV4dC9qYXZhc2NyaXB0XCIsZi5zcmM9cixmLmFzeW5jPSEwLHR5cGVvZiBmLm9ucmVhZHlzdGF0ZWNoYW5nZSE9XCJ1bmRlZmluZWRcIiYmIWMmJihmLmh0bWxGb3I9Zi5pZD1cIl9yZXF3ZXN0X1wiK2kpLGYub25sb2FkPWYub25yZWFkeXN0YXRlY2hhbmdlPWZ1bmN0aW9uKCl7aWYoZltyZWFkeVN0YXRlXSYmZltyZWFkeVN0YXRlXSE9PVwiY29tcGxldGVcIiYmZltyZWFkeVN0YXRlXSE9PVwibG9hZGVkXCJ8fGwpcmV0dXJuITE7Zi5vbmxvYWQ9Zi5vbnJlYWR5c3RhdGVjaGFuZ2U9bnVsbCxmLm9uY2xpY2smJmYub25jbGljaygpLHQobGFzdFZhbHVlKSxsYXN0VmFsdWU9dW5kZWZpbmVkLGhlYWQucmVtb3ZlQ2hpbGQoZiksbD0xfSxoZWFkLmFwcGVuZENoaWxkKGYpLHthYm9ydDpmdW5jdGlvbigpe2Yub25sb2FkPWYub25yZWFkeXN0YXRlY2hhbmdlPW51bGwsbih7fSxcIlJlcXVlc3QgaXMgYWJvcnRlZDogdGltZW91dFwiLHt9KSxsYXN0VmFsdWU9dW5kZWZpbmVkLGhlYWQucmVtb3ZlQ2hpbGQoZiksbD0xfX19ZnVuY3Rpb24gZ2V0UmVxdWVzdChlLHQpe3ZhciBuPXRoaXMubyxyPShuLm1ldGhvZHx8XCJHRVRcIikudG9VcHBlckNhc2UoKSxpPXR5cGVvZiBuPT1cInN0cmluZ1wiP246bi51cmwscz1uLnByb2Nlc3NEYXRhIT09ITEmJm4uZGF0YSYmdHlwZW9mIG4uZGF0YSE9XCJzdHJpbmdcIj9yZXF3ZXN0LnRvUXVlcnlTdHJpbmcobi5kYXRhKTpuLmRhdGF8fG51bGwsbyx1PSExO3JldHVybihuW1widHlwZVwiXT09XCJqc29ucFwifHxyPT1cIkdFVFwiKSYmcyYmKGk9dXJsYXBwZW5kKGkscykscz1udWxsKSxuW1widHlwZVwiXT09XCJqc29ucFwiP2hhbmRsZUpzb25wKG4sZSx0LGkpOihvPW4ueGhyJiZuLnhocihuKXx8eGhyKG4pLG8ub3BlbihyLGksbi5hc3luYz09PSExPyExOiEwKSxzZXRIZWFkZXJzKG8sbiksc2V0Q3JlZGVudGlhbHMobyxuKSx3aW5beERvbWFpblJlcXVlc3RdJiZvIGluc3RhbmNlb2Ygd2luW3hEb21haW5SZXF1ZXN0XT8oby5vbmxvYWQ9ZSxvLm9uZXJyb3I9dCxvLm9ucHJvZ3Jlc3M9ZnVuY3Rpb24oKXt9LHU9ITApOm8ub25yZWFkeXN0YXRlY2hhbmdlPWhhbmRsZVJlYWR5U3RhdGUodGhpcyxlLHQpLG4uYmVmb3JlJiZuLmJlZm9yZShvKSx1P3NldFRpbWVvdXQoZnVuY3Rpb24oKXtvLnNlbmQocyl9LDIwMCk6by5zZW5kKHMpLG8pfWZ1bmN0aW9uIFJlcXdlc3QoZSx0KXt0aGlzLm89ZSx0aGlzLmZuPXQsaW5pdC5hcHBseSh0aGlzLGFyZ3VtZW50cyl9ZnVuY3Rpb24gc2V0VHlwZShlKXtpZihlLm1hdGNoKFwianNvblwiKSlyZXR1cm5cImpzb25cIjtpZihlLm1hdGNoKFwiamF2YXNjcmlwdFwiKSlyZXR1cm5cImpzXCI7aWYoZS5tYXRjaChcInRleHRcIikpcmV0dXJuXCJodG1sXCI7aWYoZS5tYXRjaChcInhtbFwiKSlyZXR1cm5cInhtbFwifWZ1bmN0aW9uIGluaXQobyxmbil7ZnVuY3Rpb24gY29tcGxldGUoZSl7by50aW1lb3V0JiZjbGVhclRpbWVvdXQoc2VsZi50aW1lb3V0KSxzZWxmLnRpbWVvdXQ9bnVsbDt3aGlsZShzZWxmLl9jb21wbGV0ZUhhbmRsZXJzLmxlbmd0aD4wKXNlbGYuX2NvbXBsZXRlSGFuZGxlcnMuc2hpZnQoKShlKX1mdW5jdGlvbiBzdWNjZXNzKHJlc3Ape3ZhciB0eXBlPW8udHlwZXx8c2V0VHlwZShyZXNwLmdldFJlc3BvbnNlSGVhZGVyKFwiQ29udGVudC1UeXBlXCIpKTtyZXNwPXR5cGUhPT1cImpzb25wXCI/c2VsZi5yZXF1ZXN0OnJlc3A7dmFyIGZpbHRlcmVkUmVzcG9uc2U9Z2xvYmFsU2V0dXBPcHRpb25zLmRhdGFGaWx0ZXIocmVzcC5yZXNwb25zZVRleHQsdHlwZSkscj1maWx0ZXJlZFJlc3BvbnNlO3RyeXtyZXNwLnJlc3BvbnNlVGV4dD1yfWNhdGNoKGUpe31pZihyKXN3aXRjaCh0eXBlKXtjYXNlXCJqc29uXCI6dHJ5e3Jlc3A9d2luLkpTT04/d2luLkpTT04ucGFyc2Uocik6ZXZhbChcIihcIityK1wiKVwiKX1jYXRjaChlcnIpe3JldHVybiBlcnJvcihyZXNwLFwiQ291bGQgbm90IHBhcnNlIEpTT04gaW4gcmVzcG9uc2VcIixlcnIpfWJyZWFrO2Nhc2VcImpzXCI6cmVzcD1ldmFsKHIpO2JyZWFrO2Nhc2VcImh0bWxcIjpyZXNwPXI7YnJlYWs7Y2FzZVwieG1sXCI6cmVzcD1yZXNwLnJlc3BvbnNlWE1MJiZyZXNwLnJlc3BvbnNlWE1MLnBhcnNlRXJyb3ImJnJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvci5lcnJvckNvZGUmJnJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvci5yZWFzb24/bnVsbDpyZXNwLnJlc3BvbnNlWE1MfXNlbGYuX3Jlc3BvbnNlQXJncy5yZXNwPXJlc3Asc2VsZi5fZnVsZmlsbGVkPSEwLGZuKHJlc3ApLHNlbGYuX3N1Y2Nlc3NIYW5kbGVyKHJlc3ApO3doaWxlKHNlbGYuX2Z1bGZpbGxtZW50SGFuZGxlcnMubGVuZ3RoPjApcmVzcD1zZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLnNoaWZ0KCkocmVzcCk7Y29tcGxldGUocmVzcCl9ZnVuY3Rpb24gZXJyb3IoZSx0LG4pe2U9c2VsZi5yZXF1ZXN0LHNlbGYuX3Jlc3BvbnNlQXJncy5yZXNwPWUsc2VsZi5fcmVzcG9uc2VBcmdzLm1zZz10LHNlbGYuX3Jlc3BvbnNlQXJncy50PW4sc2VsZi5fZXJyZWQ9ITA7d2hpbGUoc2VsZi5fZXJyb3JIYW5kbGVycy5sZW5ndGg+MClzZWxmLl9lcnJvckhhbmRsZXJzLnNoaWZ0KCkoZSx0LG4pO2NvbXBsZXRlKGUpfXRoaXMudXJsPXR5cGVvZiBvPT1cInN0cmluZ1wiP286by51cmwsdGhpcy50aW1lb3V0PW51bGwsdGhpcy5fZnVsZmlsbGVkPSExLHRoaXMuX3N1Y2Nlc3NIYW5kbGVyPWZ1bmN0aW9uKCl7fSx0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJzPVtdLHRoaXMuX2Vycm9ySGFuZGxlcnM9W10sdGhpcy5fY29tcGxldGVIYW5kbGVycz1bXSx0aGlzLl9lcnJlZD0hMSx0aGlzLl9yZXNwb25zZUFyZ3M9e307dmFyIHNlbGY9dGhpcztmbj1mbnx8ZnVuY3Rpb24oKXt9LG8udGltZW91dCYmKHRoaXMudGltZW91dD1zZXRUaW1lb3V0KGZ1bmN0aW9uKCl7c2VsZi5hYm9ydCgpfSxvLnRpbWVvdXQpKSxvLnN1Y2Nlc3MmJih0aGlzLl9zdWNjZXNzSGFuZGxlcj1mdW5jdGlvbigpe28uc3VjY2Vzcy5hcHBseShvLGFyZ3VtZW50cyl9KSxvLmVycm9yJiZ0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZnVuY3Rpb24oKXtvLmVycm9yLmFwcGx5KG8sYXJndW1lbnRzKX0pLG8uY29tcGxldGUmJnRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChmdW5jdGlvbigpe28uY29tcGxldGUuYXBwbHkobyxhcmd1bWVudHMpfSksdGhpcy5yZXF1ZXN0PWdldFJlcXVlc3QuY2FsbCh0aGlzLHN1Y2Nlc3MsZXJyb3IpfWZ1bmN0aW9uIHJlcXdlc3QoZSx0KXtyZXR1cm4gbmV3IFJlcXdlc3QoZSx0KX1mdW5jdGlvbiBub3JtYWxpemUoZSl7cmV0dXJuIGU/ZS5yZXBsYWNlKC9cXHI/XFxuL2csXCJcXHJcXG5cIik6XCJcIn1mdW5jdGlvbiBzZXJpYWwoZSx0KXt2YXIgbj1lLm5hbWUscj1lLnRhZ05hbWUudG9Mb3dlckNhc2UoKSxpPWZ1bmN0aW9uKGUpe2UmJiFlLmRpc2FibGVkJiZ0KG4sbm9ybWFsaXplKGUuYXR0cmlidXRlcy52YWx1ZSYmZS5hdHRyaWJ1dGVzLnZhbHVlLnNwZWNpZmllZD9lLnZhbHVlOmUudGV4dCkpfSxzLG8sdSxhO2lmKGUuZGlzYWJsZWR8fCFuKXJldHVybjtzd2l0Y2gocil7Y2FzZVwiaW5wdXRcIjovcmVzZXR8YnV0dG9ufGltYWdlfGZpbGUvaS50ZXN0KGUudHlwZSl8fChzPS9jaGVja2JveC9pLnRlc3QoZS50eXBlKSxvPS9yYWRpby9pLnRlc3QoZS50eXBlKSx1PWUudmFsdWUsKCFzJiYhb3x8ZS5jaGVja2VkKSYmdChuLG5vcm1hbGl6ZShzJiZ1PT09XCJcIj9cIm9uXCI6dSkpKTticmVhaztjYXNlXCJ0ZXh0YXJlYVwiOnQobixub3JtYWxpemUoZS52YWx1ZSkpO2JyZWFrO2Nhc2VcInNlbGVjdFwiOmlmKGUudHlwZS50b0xvd2VyQ2FzZSgpPT09XCJzZWxlY3Qtb25lXCIpaShlLnNlbGVjdGVkSW5kZXg+PTA/ZS5vcHRpb25zW2Uuc2VsZWN0ZWRJbmRleF06bnVsbCk7ZWxzZSBmb3IoYT0wO2UubGVuZ3RoJiZhPGUubGVuZ3RoO2ErKyllLm9wdGlvbnNbYV0uc2VsZWN0ZWQmJmkoZS5vcHRpb25zW2FdKX19ZnVuY3Rpb24gZWFjaEZvcm1FbGVtZW50KCl7dmFyIGU9dGhpcyx0LG4scj1mdW5jdGlvbih0LG4pe3ZhciByLGkscztmb3Iocj0wO3I8bi5sZW5ndGg7cisrKXtzPXRbYnlUYWddKG5bcl0pO2ZvcihpPTA7aTxzLmxlbmd0aDtpKyspc2VyaWFsKHNbaV0sZSl9fTtmb3Iobj0wO248YXJndW1lbnRzLmxlbmd0aDtuKyspdD1hcmd1bWVudHNbbl0sL2lucHV0fHNlbGVjdHx0ZXh0YXJlYS9pLnRlc3QodC50YWdOYW1lKSYmc2VyaWFsKHQsZSkscih0LFtcImlucHV0XCIsXCJzZWxlY3RcIixcInRleHRhcmVhXCJdKX1mdW5jdGlvbiBzZXJpYWxpemVRdWVyeVN0cmluZygpe3JldHVybiByZXF3ZXN0LnRvUXVlcnlTdHJpbmcocmVxd2VzdC5zZXJpYWxpemVBcnJheS5hcHBseShudWxsLGFyZ3VtZW50cykpfWZ1bmN0aW9uIHNlcmlhbGl6ZUhhc2goKXt2YXIgZT17fTtyZXR1cm4gZWFjaEZvcm1FbGVtZW50LmFwcGx5KGZ1bmN0aW9uKHQsbil7dCBpbiBlPyhlW3RdJiYhaXNBcnJheShlW3RdKSYmKGVbdF09W2VbdF1dKSxlW3RdLnB1c2gobikpOmVbdF09bn0sYXJndW1lbnRzKSxlfWZ1bmN0aW9uIGJ1aWxkUGFyYW1zKGUsdCxuLHIpe3ZhciBpLHMsbyx1PS9cXFtcXF0kLztpZihpc0FycmF5KHQpKWZvcihzPTA7dCYmczx0Lmxlbmd0aDtzKyspbz10W3NdLG58fHUudGVzdChlKT9yKGUsbyk6YnVpbGRQYXJhbXMoZStcIltcIisodHlwZW9mIG89PVwib2JqZWN0XCI/czpcIlwiKStcIl1cIixvLG4scik7ZWxzZSBpZih0JiZ0LnRvU3RyaW5nKCk9PT1cIltvYmplY3QgT2JqZWN0XVwiKWZvcihpIGluIHQpYnVpbGRQYXJhbXMoZStcIltcIitpK1wiXVwiLHRbaV0sbixyKTtlbHNlIHIoZSx0KX12YXIgd2luPXdpbmRvdyxkb2M9ZG9jdW1lbnQsaHR0cHNSZT0vXmh0dHAvLHR3b0h1bmRvPS9eKDIwXFxkfDEyMjMpJC8sYnlUYWc9XCJnZXRFbGVtZW50c0J5VGFnTmFtZVwiLHJlYWR5U3RhdGU9XCJyZWFkeVN0YXRlXCIsY29udGVudFR5cGU9XCJDb250ZW50LVR5cGVcIixyZXF1ZXN0ZWRXaXRoPVwiWC1SZXF1ZXN0ZWQtV2l0aFwiLGhlYWQ9ZG9jW2J5VGFnXShcImhlYWRcIilbMF0sdW5pcWlkPTAsY2FsbGJhY2tQcmVmaXg9XCJyZXF3ZXN0X1wiKyArKG5ldyBEYXRlKSxsYXN0VmFsdWUseG1sSHR0cFJlcXVlc3Q9XCJYTUxIdHRwUmVxdWVzdFwiLHhEb21haW5SZXF1ZXN0PVwiWERvbWFpblJlcXVlc3RcIixub29wPWZ1bmN0aW9uKCl7fSxpc0FycmF5PXR5cGVvZiBBcnJheS5pc0FycmF5PT1cImZ1bmN0aW9uXCI/QXJyYXkuaXNBcnJheTpmdW5jdGlvbihlKXtyZXR1cm4gZSBpbnN0YW5jZW9mIEFycmF5fSxkZWZhdWx0SGVhZGVycz17Y29udGVudFR5cGU6XCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIixyZXF1ZXN0ZWRXaXRoOnhtbEh0dHBSZXF1ZXN0LGFjY2VwdDp7XCIqXCI6XCJ0ZXh0L2phdmFzY3JpcHQsIHRleHQvaHRtbCwgYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbCwgKi8qXCIseG1sOlwiYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbFwiLGh0bWw6XCJ0ZXh0L2h0bWxcIix0ZXh0OlwidGV4dC9wbGFpblwiLGpzb246XCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L2phdmFzY3JpcHRcIixqczpcImFwcGxpY2F0aW9uL2phdmFzY3JpcHQsIHRleHQvamF2YXNjcmlwdFwifX0seGhyPWZ1bmN0aW9uKGUpe2lmKGUuY3Jvc3NPcmlnaW49PT0hMCl7dmFyIHQ9d2luW3htbEh0dHBSZXF1ZXN0XT9uZXcgWE1MSHR0cFJlcXVlc3Q6bnVsbDtpZih0JiZcIndpdGhDcmVkZW50aWFsc1wiaW4gdClyZXR1cm4gdDtpZih3aW5beERvbWFpblJlcXVlc3RdKXJldHVybiBuZXcgWERvbWFpblJlcXVlc3Q7dGhyb3cgbmV3IEVycm9yKFwiQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGNyb3NzLW9yaWdpbiByZXF1ZXN0c1wiKX1yZXR1cm4gd2luW3htbEh0dHBSZXF1ZXN0XT9uZXcgWE1MSHR0cFJlcXVlc3Q6bmV3IEFjdGl2ZVhPYmplY3QoXCJNaWNyb3NvZnQuWE1MSFRUUFwiKX0sZ2xvYmFsU2V0dXBPcHRpb25zPXtkYXRhRmlsdGVyOmZ1bmN0aW9uKGUpe3JldHVybiBlfX07cmV0dXJuIFJlcXdlc3QucHJvdG90eXBlPXthYm9ydDpmdW5jdGlvbigpe3RoaXMuX2Fib3J0ZWQ9ITAsdGhpcy5yZXF1ZXN0LmFib3J0KCl9LHJldHJ5OmZ1bmN0aW9uKCl7aW5pdC5jYWxsKHRoaXMsdGhpcy5vLHRoaXMuZm4pfSx0aGVuOmZ1bmN0aW9uKGUsdCl7cmV0dXJuIGU9ZXx8ZnVuY3Rpb24oKXt9LHQ9dHx8ZnVuY3Rpb24oKXt9LHRoaXMuX2Z1bGZpbGxlZD90aGlzLl9yZXNwb25zZUFyZ3MucmVzcD1lKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwKTp0aGlzLl9lcnJlZD90KHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwLHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csdGhpcy5fcmVzcG9uc2VBcmdzLnQpOih0aGlzLl9mdWxmaWxsbWVudEhhbmRsZXJzLnB1c2goZSksdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKHQpKSx0aGlzfSxhbHdheXM6ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuX2Z1bGZpbGxlZHx8dGhpcy5fZXJyZWQ/ZSh0aGlzLl9yZXNwb25zZUFyZ3MucmVzcCk6dGhpcy5fY29tcGxldGVIYW5kbGVycy5wdXNoKGUpLHRoaXN9LGZhaWw6ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuX2VycmVkP2UodGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AsdGhpcy5fcmVzcG9uc2VBcmdzLm1zZyx0aGlzLl9yZXNwb25zZUFyZ3MudCk6dGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGUpLHRoaXN9LFwiY2F0Y2hcIjpmdW5jdGlvbihlKXtyZXR1cm4gdGhpcy5mYWlsKGUpfX0scmVxd2VzdC5zZXJpYWxpemVBcnJheT1mdW5jdGlvbigpe3ZhciBlPVtdO3JldHVybiBlYWNoRm9ybUVsZW1lbnQuYXBwbHkoZnVuY3Rpb24odCxuKXtlLnB1c2goe25hbWU6dCx2YWx1ZTpufSl9LGFyZ3VtZW50cyksZX0scmVxd2VzdC5zZXJpYWxpemU9ZnVuY3Rpb24oKXtpZihhcmd1bWVudHMubGVuZ3RoPT09MClyZXR1cm5cIlwiO3ZhciBlLHQsbj1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMCk7cmV0dXJuIGU9bi5wb3AoKSxlJiZlLm5vZGVUeXBlJiZuLnB1c2goZSkmJihlPW51bGwpLGUmJihlPWUudHlwZSksZT09XCJtYXBcIj90PXNlcmlhbGl6ZUhhc2g6ZT09XCJhcnJheVwiP3Q9cmVxd2VzdC5zZXJpYWxpemVBcnJheTp0PXNlcmlhbGl6ZVF1ZXJ5U3RyaW5nLHQuYXBwbHkobnVsbCxuKX0scmVxd2VzdC50b1F1ZXJ5U3RyaW5nPWZ1bmN0aW9uKGUsdCl7dmFyIG4scixpPXR8fCExLHM9W10sbz1lbmNvZGVVUklDb21wb25lbnQsdT1mdW5jdGlvbihlLHQpe3Q9XCJmdW5jdGlvblwiPT10eXBlb2YgdD90KCk6dD09bnVsbD9cIlwiOnQsc1tzLmxlbmd0aF09byhlKStcIj1cIitvKHQpfTtpZihpc0FycmF5KGUpKWZvcihyPTA7ZSYmcjxlLmxlbmd0aDtyKyspdShlW3JdLm5hbWUsZVtyXS52YWx1ZSk7ZWxzZSBmb3IobiBpbiBlKWUuaGFzT3duUHJvcGVydHkobikmJmJ1aWxkUGFyYW1zKG4sZVtuXSxpLHUpO3JldHVybiBzLmpvaW4oXCImXCIpLnJlcGxhY2UoLyUyMC9nLFwiK1wiKX0scmVxd2VzdC5nZXRjYWxsYmFja1ByZWZpeD1mdW5jdGlvbigpe3JldHVybiBjYWxsYmFja1ByZWZpeH0scmVxd2VzdC5jb21wYXQ9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZSYmKGUudHlwZSYmKGUubWV0aG9kPWUudHlwZSkmJmRlbGV0ZSBlLnR5cGUsZS5kYXRhVHlwZSYmKGUudHlwZT1lLmRhdGFUeXBlKSxlLmpzb25wQ2FsbGJhY2smJihlLmpzb25wQ2FsbGJhY2tOYW1lPWUuanNvbnBDYWxsYmFjaykmJmRlbGV0ZSBlLmpzb25wQ2FsbGJhY2ssZS5qc29ucCYmKGUuanNvbnBDYWxsYmFjaz1lLmpzb25wKSksbmV3IFJlcXdlc3QoZSx0KX0scmVxd2VzdC5hamF4U2V0dXA9ZnVuY3Rpb24oZSl7ZT1lfHx7fTtmb3IodmFyIHQgaW4gZSlnbG9iYWxTZXR1cE9wdGlvbnNbdF09ZVt0XX0scmVxd2VzdH0pIiwiLyohXG4gICogUmVxd2VzdCEgQSBnZW5lcmFsIHB1cnBvc2UgWEhSIGNvbm5lY3Rpb24gbWFuYWdlclxuICAqIGxpY2Vuc2UgTUlUIChjKSBEdXN0aW4gRGlheiAyMDE0XG4gICogaHR0cHM6Ly9naXRodWIuY29tL2RlZC9yZXF3ZXN0XG4gICovXG5cbiFmdW5jdGlvbiAobmFtZSwgY29udGV4dCwgZGVmaW5pdGlvbikge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKClcbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIGRlZmluZShkZWZpbml0aW9uKVxuICBlbHNlIGNvbnRleHRbbmFtZV0gPSBkZWZpbml0aW9uKClcbn0oJ3JlcXdlc3QnLCB0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIHdpbiA9IHdpbmRvd1xuICAgICwgZG9jID0gZG9jdW1lbnRcbiAgICAsIGh0dHBzUmUgPSAvXmh0dHAvXG4gICAgLCBwcm90b2NvbFJlID0gLyheXFx3Kyk6XFwvXFwvL1xuICAgICwgdHdvSHVuZG8gPSAvXigyMFxcZHwxMjIzKSQvIC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDA0Njk3Mi9tc2llLXJldHVybnMtc3RhdHVzLWNvZGUtb2YtMTIyMy1mb3ItYWpheC1yZXF1ZXN0XG4gICAgLCBieVRhZyA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZSdcbiAgICAsIHJlYWR5U3RhdGUgPSAncmVhZHlTdGF0ZSdcbiAgICAsIGNvbnRlbnRUeXBlID0gJ0NvbnRlbnQtVHlwZSdcbiAgICAsIHJlcXVlc3RlZFdpdGggPSAnWC1SZXF1ZXN0ZWQtV2l0aCdcbiAgICAsIGhlYWQgPSBkb2NbYnlUYWddKCdoZWFkJylbMF1cbiAgICAsIHVuaXFpZCA9IDBcbiAgICAsIGNhbGxiYWNrUHJlZml4ID0gJ3JlcXdlc3RfJyArICgrbmV3IERhdGUoKSlcbiAgICAsIGxhc3RWYWx1ZSAvLyBkYXRhIHN0b3JlZCBieSB0aGUgbW9zdCByZWNlbnQgSlNPTlAgY2FsbGJhY2tcbiAgICAsIHhtbEh0dHBSZXF1ZXN0ID0gJ1hNTEh0dHBSZXF1ZXN0J1xuICAgICwgeERvbWFpblJlcXVlc3QgPSAnWERvbWFpblJlcXVlc3QnXG4gICAgLCBub29wID0gZnVuY3Rpb24gKCkge31cblxuICAgICwgaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09ICdmdW5jdGlvbidcbiAgICAgICAgPyBBcnJheS5pc0FycmF5XG4gICAgICAgIDogZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgIHJldHVybiBhIGluc3RhbmNlb2YgQXJyYXlcbiAgICAgICAgICB9XG5cbiAgICAsIGRlZmF1bHRIZWFkZXJzID0ge1xuICAgICAgICAgICdjb250ZW50VHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG4gICAgICAgICwgJ3JlcXVlc3RlZFdpdGgnOiB4bWxIdHRwUmVxdWVzdFxuICAgICAgICAsICdhY2NlcHQnOiB7XG4gICAgICAgICAgICAgICcqJzogICd0ZXh0L2phdmFzY3JpcHQsIHRleHQvaHRtbCwgYXBwbGljYXRpb24veG1sLCB0ZXh0L3htbCwgKi8qJ1xuICAgICAgICAgICAgLCAneG1sJzogICdhcHBsaWNhdGlvbi94bWwsIHRleHQveG1sJ1xuICAgICAgICAgICAgLCAnaHRtbCc6ICd0ZXh0L2h0bWwnXG4gICAgICAgICAgICAsICd0ZXh0JzogJ3RleHQvcGxhaW4nXG4gICAgICAgICAgICAsICdqc29uJzogJ2FwcGxpY2F0aW9uL2pzb24sIHRleHQvamF2YXNjcmlwdCdcbiAgICAgICAgICAgICwgJ2pzJzogICAnYXBwbGljYXRpb24vamF2YXNjcmlwdCwgdGV4dC9qYXZhc2NyaXB0J1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICwgeGhyID0gZnVuY3Rpb24obykge1xuICAgICAgICAvLyBpcyBpdCB4LWRvbWFpblxuICAgICAgICBpZiAob1snY3Jvc3NPcmlnaW4nXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHZhciB4aHIgPSB3aW5beG1sSHR0cFJlcXVlc3RdID8gbmV3IFhNTEh0dHBSZXF1ZXN0KCkgOiBudWxsXG4gICAgICAgICAgaWYgKHhociAmJiAnd2l0aENyZWRlbnRpYWxzJyBpbiB4aHIpIHtcbiAgICAgICAgICAgIHJldHVybiB4aHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHdpblt4RG9tYWluUmVxdWVzdF0pIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWERvbWFpblJlcXVlc3QoKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Jyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBjcm9zcy1vcmlnaW4gcmVxdWVzdHMnKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh3aW5beG1sSHR0cFJlcXVlc3RdKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBYTUxIdHRwUmVxdWVzdCgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAsIGdsb2JhbFNldHVwT3B0aW9ucyA9IHtcbiAgICAgICAgZGF0YUZpbHRlcjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgZnVuY3Rpb24gc3VjY2VlZChyKSB7XG4gICAgdmFyIHByb3RvY29sID0gcHJvdG9jb2xSZS5leGVjKHIudXJsKTtcbiAgICBwcm90b2NvbCA9IChwcm90b2NvbCAmJiBwcm90b2NvbFsxXSkgfHwgd2luZG93LmxvY2F0aW9uLnByb3RvY29sO1xuICAgIHJldHVybiBodHRwc1JlLnRlc3QocHJvdG9jb2wpID8gdHdvSHVuZG8udGVzdChyLnJlcXVlc3Quc3RhdHVzKSA6ICEhci5yZXF1ZXN0LnJlc3BvbnNlO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlUmVhZHlTdGF0ZShyLCBzdWNjZXNzLCBlcnJvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyB1c2UgX2Fib3J0ZWQgdG8gbWl0aWdhdGUgYWdhaW5zdCBJRSBlcnIgYzAwYzAyM2ZcbiAgICAgIC8vIChjYW4ndCByZWFkIHByb3BzIG9uIGFib3J0ZWQgcmVxdWVzdCBvYmplY3RzKVxuICAgICAgaWYgKHIuX2Fib3J0ZWQpIHJldHVybiBlcnJvcihyLnJlcXVlc3QpXG4gICAgICBpZiAoci5yZXF1ZXN0ICYmIHIucmVxdWVzdFtyZWFkeVN0YXRlXSA9PSA0KSB7XG4gICAgICAgIHIucmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBub29wXG4gICAgICAgIGlmIChzdWNjZWVkKHIpKSBzdWNjZXNzKHIucmVxdWVzdClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGVycm9yKHIucmVxdWVzdClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXRIZWFkZXJzKGh0dHAsIG8pIHtcbiAgICB2YXIgaGVhZGVycyA9IG9bJ2hlYWRlcnMnXSB8fCB7fVxuICAgICAgLCBoXG5cbiAgICBoZWFkZXJzWydBY2NlcHQnXSA9IGhlYWRlcnNbJ0FjY2VwdCddXG4gICAgICB8fCBkZWZhdWx0SGVhZGVyc1snYWNjZXB0J11bb1sndHlwZSddXVxuICAgICAgfHwgZGVmYXVsdEhlYWRlcnNbJ2FjY2VwdCddWycqJ11cblxuICAgIHZhciBpc0FGb3JtRGF0YSA9IHR5cGVvZiBGb3JtRGF0YSA9PT0gJ2Z1bmN0aW9uJyAmJiAob1snZGF0YSddIGluc3RhbmNlb2YgRm9ybURhdGEpO1xuICAgIC8vIGJyZWFrcyBjcm9zcy1vcmlnaW4gcmVxdWVzdHMgd2l0aCBsZWdhY3kgYnJvd3NlcnNcbiAgICBpZiAoIW9bJ2Nyb3NzT3JpZ2luJ10gJiYgIWhlYWRlcnNbcmVxdWVzdGVkV2l0aF0pIGhlYWRlcnNbcmVxdWVzdGVkV2l0aF0gPSBkZWZhdWx0SGVhZGVyc1sncmVxdWVzdGVkV2l0aCddXG4gICAgaWYgKCFoZWFkZXJzW2NvbnRlbnRUeXBlXSAmJiAhaXNBRm9ybURhdGEpIGhlYWRlcnNbY29udGVudFR5cGVdID0gb1snY29udGVudFR5cGUnXSB8fCBkZWZhdWx0SGVhZGVyc1snY29udGVudFR5cGUnXVxuICAgIGZvciAoaCBpbiBoZWFkZXJzKVxuICAgICAgaGVhZGVycy5oYXNPd25Qcm9wZXJ0eShoKSAmJiAnc2V0UmVxdWVzdEhlYWRlcicgaW4gaHR0cCAmJiBodHRwLnNldFJlcXVlc3RIZWFkZXIoaCwgaGVhZGVyc1toXSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldENyZWRlbnRpYWxzKGh0dHAsIG8pIHtcbiAgICBpZiAodHlwZW9mIG9bJ3dpdGhDcmVkZW50aWFscyddICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgaHR0cC53aXRoQ3JlZGVudGlhbHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBodHRwLndpdGhDcmVkZW50aWFscyA9ICEhb1snd2l0aENyZWRlbnRpYWxzJ11cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmFsQ2FsbGJhY2soZGF0YSkge1xuICAgIGxhc3RWYWx1ZSA9IGRhdGFcbiAgfVxuXG4gIGZ1bmN0aW9uIHVybGFwcGVuZCAodXJsLCBzKSB7XG4gICAgcmV0dXJuIHVybCArICgvXFw/Ly50ZXN0KHVybCkgPyAnJicgOiAnPycpICsgc1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlSnNvbnAobywgZm4sIGVyciwgdXJsKSB7XG4gICAgdmFyIHJlcUlkID0gdW5pcWlkKytcbiAgICAgICwgY2JrZXkgPSBvWydqc29ucENhbGxiYWNrJ10gfHwgJ2NhbGxiYWNrJyAvLyB0aGUgJ2NhbGxiYWNrJyBrZXlcbiAgICAgICwgY2J2YWwgPSBvWydqc29ucENhbGxiYWNrTmFtZSddIHx8IHJlcXdlc3QuZ2V0Y2FsbGJhY2tQcmVmaXgocmVxSWQpXG4gICAgICAsIGNicmVnID0gbmV3IFJlZ0V4cCgnKChefFxcXFw/fCYpJyArIGNia2V5ICsgJyk9KFteJl0rKScpXG4gICAgICAsIG1hdGNoID0gdXJsLm1hdGNoKGNicmVnKVxuICAgICAgLCBzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICAgICwgbG9hZGVkID0gMFxuICAgICAgLCBpc0lFMTAgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ01TSUUgMTAuMCcpICE9PSAtMVxuXG4gICAgaWYgKG1hdGNoKSB7XG4gICAgICBpZiAobWF0Y2hbM10gPT09ICc/Jykge1xuICAgICAgICB1cmwgPSB1cmwucmVwbGFjZShjYnJlZywgJyQxPScgKyBjYnZhbCkgLy8gd2lsZGNhcmQgY2FsbGJhY2sgZnVuYyBuYW1lXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYnZhbCA9IG1hdGNoWzNdIC8vIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmMgbmFtZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB1cmwgPSB1cmxhcHBlbmQodXJsLCBjYmtleSArICc9JyArIGNidmFsKSAvLyBubyBjYWxsYmFjayBkZXRhaWxzLCBhZGQgJ2VtXG4gICAgfVxuXG4gICAgd2luW2NidmFsXSA9IGdlbmVyYWxDYWxsYmFja1xuXG4gICAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0J1xuICAgIHNjcmlwdC5zcmMgPSB1cmxcbiAgICBzY3JpcHQuYXN5bmMgPSB0cnVlXG4gICAgaWYgKHR5cGVvZiBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlICE9PSAndW5kZWZpbmVkJyAmJiAhaXNJRTEwKSB7XG4gICAgICAvLyBuZWVkIHRoaXMgZm9yIElFIGR1ZSB0byBvdXQtb2Ytb3JkZXIgb25yZWFkeXN0YXRlY2hhbmdlKCksIGJpbmRpbmcgc2NyaXB0XG4gICAgICAvLyBleGVjdXRpb24gdG8gYW4gZXZlbnQgbGlzdGVuZXIgZ2l2ZXMgdXMgY29udHJvbCBvdmVyIHdoZW4gdGhlIHNjcmlwdFxuICAgICAgLy8gaXMgZXhlY3V0ZWQuIFNlZSBodHRwOi8vamF1Ym91cmcubmV0LzIwMTAvMDcvbG9hZGluZy1zY3JpcHQtYXMtb25jbGljay1oYW5kbGVyLW9mLmh0bWxcbiAgICAgIHNjcmlwdC5odG1sRm9yID0gc2NyaXB0LmlkID0gJ19yZXF3ZXN0XycgKyByZXFJZFxuICAgIH1cblxuICAgIHNjcmlwdC5vbmxvYWQgPSBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKChzY3JpcHRbcmVhZHlTdGF0ZV0gJiYgc2NyaXB0W3JlYWR5U3RhdGVdICE9PSAnY29tcGxldGUnICYmIHNjcmlwdFtyZWFkeVN0YXRlXSAhPT0gJ2xvYWRlZCcpIHx8IGxvYWRlZCkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIHNjcmlwdC5vbmxvYWQgPSBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbFxuICAgICAgc2NyaXB0Lm9uY2xpY2sgJiYgc2NyaXB0Lm9uY2xpY2soKVxuICAgICAgLy8gQ2FsbCB0aGUgdXNlciBjYWxsYmFjayB3aXRoIHRoZSBsYXN0IHZhbHVlIHN0b3JlZCBhbmQgY2xlYW4gdXAgdmFsdWVzIGFuZCBzY3JpcHRzLlxuICAgICAgZm4obGFzdFZhbHVlKVxuICAgICAgbGFzdFZhbHVlID0gdW5kZWZpbmVkXG4gICAgICBoZWFkLnJlbW92ZUNoaWxkKHNjcmlwdClcbiAgICAgIGxvYWRlZCA9IDFcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIHNjcmlwdCB0byB0aGUgRE9NIGhlYWRcbiAgICBoZWFkLmFwcGVuZENoaWxkKHNjcmlwdClcblxuICAgIC8vIEVuYWJsZSBKU09OUCB0aW1lb3V0XG4gICAgcmV0dXJuIHtcbiAgICAgIGFib3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNjcmlwdC5vbmxvYWQgPSBzY3JpcHQub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbFxuICAgICAgICBlcnIoe30sICdSZXF1ZXN0IGlzIGFib3J0ZWQ6IHRpbWVvdXQnLCB7fSlcbiAgICAgICAgbGFzdFZhbHVlID0gdW5kZWZpbmVkXG4gICAgICAgIGhlYWQucmVtb3ZlQ2hpbGQoc2NyaXB0KVxuICAgICAgICBsb2FkZWQgPSAxXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVxdWVzdChmbiwgZXJyKSB7XG4gICAgdmFyIG8gPSB0aGlzLm9cbiAgICAgICwgbWV0aG9kID0gKG9bJ21ldGhvZCddIHx8ICdHRVQnKS50b1VwcGVyQ2FzZSgpXG4gICAgICAsIHVybCA9IHR5cGVvZiBvID09PSAnc3RyaW5nJyA/IG8gOiBvWyd1cmwnXVxuICAgICAgLy8gY29udmVydCBub24tc3RyaW5nIG9iamVjdHMgdG8gcXVlcnktc3RyaW5nIGZvcm0gdW5sZXNzIG9bJ3Byb2Nlc3NEYXRhJ10gaXMgZmFsc2VcbiAgICAgICwgZGF0YSA9IChvWydwcm9jZXNzRGF0YSddICE9PSBmYWxzZSAmJiBvWydkYXRhJ10gJiYgdHlwZW9mIG9bJ2RhdGEnXSAhPT0gJ3N0cmluZycpXG4gICAgICAgID8gcmVxd2VzdC50b1F1ZXJ5U3RyaW5nKG9bJ2RhdGEnXSlcbiAgICAgICAgOiAob1snZGF0YSddIHx8IG51bGwpXG4gICAgICAsIGh0dHBcbiAgICAgICwgc2VuZFdhaXQgPSBmYWxzZVxuXG4gICAgLy8gaWYgd2UncmUgd29ya2luZyBvbiBhIEdFVCByZXF1ZXN0IGFuZCB3ZSBoYXZlIGRhdGEgdGhlbiB3ZSBzaG91bGQgYXBwZW5kXG4gICAgLy8gcXVlcnkgc3RyaW5nIHRvIGVuZCBvZiBVUkwgYW5kIG5vdCBwb3N0IGRhdGFcbiAgICBpZiAoKG9bJ3R5cGUnXSA9PSAnanNvbnAnIHx8IG1ldGhvZCA9PSAnR0VUJykgJiYgZGF0YSkge1xuICAgICAgdXJsID0gdXJsYXBwZW5kKHVybCwgZGF0YSlcbiAgICAgIGRhdGEgPSBudWxsXG4gICAgfVxuXG4gICAgaWYgKG9bJ3R5cGUnXSA9PSAnanNvbnAnKSByZXR1cm4gaGFuZGxlSnNvbnAobywgZm4sIGVyciwgdXJsKVxuXG4gICAgLy8gZ2V0IHRoZSB4aHIgZnJvbSB0aGUgZmFjdG9yeSBpZiBwYXNzZWRcbiAgICAvLyBpZiB0aGUgZmFjdG9yeSByZXR1cm5zIG51bGwsIGZhbGwtYmFjayB0byBvdXJzXG4gICAgaHR0cCA9IChvLnhociAmJiBvLnhocihvKSkgfHwgeGhyKG8pXG5cbiAgICBodHRwLm9wZW4obWV0aG9kLCB1cmwsIG9bJ2FzeW5jJ10gPT09IGZhbHNlID8gZmFsc2UgOiB0cnVlKVxuICAgIHNldEhlYWRlcnMoaHR0cCwgbylcbiAgICBzZXRDcmVkZW50aWFscyhodHRwLCBvKVxuICAgIGlmICh3aW5beERvbWFpblJlcXVlc3RdICYmIGh0dHAgaW5zdGFuY2VvZiB3aW5beERvbWFpblJlcXVlc3RdKSB7XG4gICAgICAgIGh0dHAub25sb2FkID0gZm5cbiAgICAgICAgaHR0cC5vbmVycm9yID0gZXJyXG4gICAgICAgIC8vIE5PVEU6IHNlZVxuICAgICAgICAvLyBodHRwOi8vc29jaWFsLm1zZG4ubWljcm9zb2Z0LmNvbS9Gb3J1bXMvZW4tVVMvaWV3ZWJkZXZlbG9wbWVudC90aHJlYWQvMzBlZjNhZGQtNzY3Yy00NDM2LWI4YTktZjFjYTE5YjQ4MTJlXG4gICAgICAgIGh0dHAub25wcm9ncmVzcyA9IGZ1bmN0aW9uKCkge31cbiAgICAgICAgc2VuZFdhaXQgPSB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlUmVhZHlTdGF0ZSh0aGlzLCBmbiwgZXJyKVxuICAgIH1cbiAgICBvWydiZWZvcmUnXSAmJiBvWydiZWZvcmUnXShodHRwKVxuICAgIGlmIChzZW5kV2FpdCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGh0dHAuc2VuZChkYXRhKVxuICAgICAgfSwgMjAwKVxuICAgIH0gZWxzZSB7XG4gICAgICBodHRwLnNlbmQoZGF0YSlcbiAgICB9XG4gICAgcmV0dXJuIGh0dHBcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXdlc3QobywgZm4pIHtcbiAgICB0aGlzLm8gPSBvXG4gICAgdGhpcy5mbiA9IGZuXG5cbiAgICBpbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFR5cGUoaGVhZGVyKSB7XG4gICAgLy8ganNvbiwgamF2YXNjcmlwdCwgdGV4dC9wbGFpbiwgdGV4dC9odG1sLCB4bWxcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCdqc29uJykpIHJldHVybiAnanNvbidcbiAgICBpZiAoaGVhZGVyLm1hdGNoKCdqYXZhc2NyaXB0JykpIHJldHVybiAnanMnXG4gICAgaWYgKGhlYWRlci5tYXRjaCgndGV4dCcpKSByZXR1cm4gJ2h0bWwnXG4gICAgaWYgKGhlYWRlci5tYXRjaCgneG1sJykpIHJldHVybiAneG1sJ1xuICB9XG5cbiAgZnVuY3Rpb24gaW5pdChvLCBmbikge1xuXG4gICAgdGhpcy51cmwgPSB0eXBlb2YgbyA9PSAnc3RyaW5nJyA/IG8gOiBvWyd1cmwnXVxuICAgIHRoaXMudGltZW91dCA9IG51bGxcblxuICAgIC8vIHdoZXRoZXIgcmVxdWVzdCBoYXMgYmVlbiBmdWxmaWxsZWQgZm9yIHB1cnBvc2VcbiAgICAvLyBvZiB0cmFja2luZyB0aGUgUHJvbWlzZXNcbiAgICB0aGlzLl9mdWxmaWxsZWQgPSBmYWxzZVxuICAgIC8vIHN1Y2Nlc3MgaGFuZGxlcnNcbiAgICB0aGlzLl9zdWNjZXNzSGFuZGxlciA9IGZ1bmN0aW9uKCl7fVxuICAgIHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcnMgPSBbXVxuICAgIC8vIGVycm9yIGhhbmRsZXJzXG4gICAgdGhpcy5fZXJyb3JIYW5kbGVycyA9IFtdXG4gICAgLy8gY29tcGxldGUgKGJvdGggc3VjY2VzcyBhbmQgZmFpbCkgaGFuZGxlcnNcbiAgICB0aGlzLl9jb21wbGV0ZUhhbmRsZXJzID0gW11cbiAgICB0aGlzLl9lcnJlZCA9IGZhbHNlXG4gICAgdGhpcy5fcmVzcG9uc2VBcmdzID0ge31cblxuICAgIHZhciBzZWxmID0gdGhpc1xuXG4gICAgZm4gPSBmbiB8fCBmdW5jdGlvbiAoKSB7fVxuXG4gICAgaWYgKG9bJ3RpbWVvdXQnXSkge1xuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuYWJvcnQoKVxuICAgICAgfSwgb1sndGltZW91dCddKVxuICAgIH1cblxuICAgIGlmIChvWydzdWNjZXNzJ10pIHtcbiAgICAgIHRoaXMuX3N1Y2Nlc3NIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBvWydzdWNjZXNzJ10uYXBwbHkobywgYXJndW1lbnRzKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvWydlcnJvciddKSB7XG4gICAgICB0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICBvWydlcnJvciddLmFwcGx5KG8sIGFyZ3VtZW50cylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgaWYgKG9bJ2NvbXBsZXRlJ10pIHtcbiAgICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG9bJ2NvbXBsZXRlJ10uYXBwbHkobywgYXJndW1lbnRzKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wbGV0ZSAocmVzcCkge1xuICAgICAgb1sndGltZW91dCddICYmIGNsZWFyVGltZW91dChzZWxmLnRpbWVvdXQpXG4gICAgICBzZWxmLnRpbWVvdXQgPSBudWxsXG4gICAgICB3aGlsZSAoc2VsZi5fY29tcGxldGVIYW5kbGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNlbGYuX2NvbXBsZXRlSGFuZGxlcnMuc2hpZnQoKShyZXNwKVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3MgKHJlc3ApIHtcbiAgICAgIHZhciB0eXBlID0gb1sndHlwZSddIHx8IHJlc3AgJiYgc2V0VHlwZShyZXNwLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKSkgLy8gcmVzcCBjYW4gYmUgdW5kZWZpbmVkIGluIElFXG4gICAgICByZXNwID0gKHR5cGUgIT09ICdqc29ucCcpID8gc2VsZi5yZXF1ZXN0IDogcmVzcFxuICAgICAgLy8gdXNlIGdsb2JhbCBkYXRhIGZpbHRlciBvbiByZXNwb25zZSB0ZXh0XG4gICAgICB2YXIgZmlsdGVyZWRSZXNwb25zZSA9IGdsb2JhbFNldHVwT3B0aW9ucy5kYXRhRmlsdGVyKHJlc3AucmVzcG9uc2VUZXh0LCB0eXBlKVxuICAgICAgICAsIHIgPSBmaWx0ZXJlZFJlc3BvbnNlXG4gICAgICB0cnkge1xuICAgICAgICByZXNwLnJlc3BvbnNlVGV4dCA9IHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gY2FuJ3QgYXNzaWduIHRoaXMgaW4gSUU8PTgsIGp1c3QgaWdub3JlXG4gICAgICB9XG4gICAgICBpZiAocikge1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3AgPSB3aW4uSlNPTiA/IHdpbi5KU09OLnBhcnNlKHIpIDogZXZhbCgnKCcgKyByICsgJyknKVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yKHJlc3AsICdDb3VsZCBub3QgcGFyc2UgSlNPTiBpbiByZXNwb25zZScsIGVycilcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnanMnOlxuICAgICAgICAgIHJlc3AgPSBldmFsKHIpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnaHRtbCc6XG4gICAgICAgICAgcmVzcCA9IHJcbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlICd4bWwnOlxuICAgICAgICAgIHJlc3AgPSByZXNwLnJlc3BvbnNlWE1MXG4gICAgICAgICAgICAgICYmIHJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvciAvLyBJRSB0cm9sb2xvXG4gICAgICAgICAgICAgICYmIHJlc3AucmVzcG9uc2VYTUwucGFyc2VFcnJvci5lcnJvckNvZGVcbiAgICAgICAgICAgICAgJiYgcmVzcC5yZXNwb25zZVhNTC5wYXJzZUVycm9yLnJlYXNvblxuICAgICAgICAgICAgPyBudWxsXG4gICAgICAgICAgICA6IHJlc3AucmVzcG9uc2VYTUxcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYuX3Jlc3BvbnNlQXJncy5yZXNwID0gcmVzcFxuICAgICAgc2VsZi5fZnVsZmlsbGVkID0gdHJ1ZVxuICAgICAgZm4ocmVzcClcbiAgICAgIHNlbGYuX3N1Y2Nlc3NIYW5kbGVyKHJlc3ApXG4gICAgICB3aGlsZSAoc2VsZi5fZnVsZmlsbG1lbnRIYW5kbGVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHJlc3AgPSBzZWxmLl9mdWxmaWxsbWVudEhhbmRsZXJzLnNoaWZ0KCkocmVzcClcbiAgICAgIH1cblxuICAgICAgY29tcGxldGUocmVzcClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihyZXNwLCBtc2csIHQpIHtcbiAgICAgIHJlc3AgPSBzZWxmLnJlcXVlc3RcbiAgICAgIHNlbGYuX3Jlc3BvbnNlQXJncy5yZXNwID0gcmVzcFxuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLm1zZyA9IG1zZ1xuICAgICAgc2VsZi5fcmVzcG9uc2VBcmdzLnQgPSB0XG4gICAgICBzZWxmLl9lcnJlZCA9IHRydWVcbiAgICAgIHdoaWxlIChzZWxmLl9lcnJvckhhbmRsZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgc2VsZi5fZXJyb3JIYW5kbGVycy5zaGlmdCgpKHJlc3AsIG1zZywgdClcbiAgICAgIH1cbiAgICAgIGNvbXBsZXRlKHJlc3ApXG4gICAgfVxuXG4gICAgdGhpcy5yZXF1ZXN0ID0gZ2V0UmVxdWVzdC5jYWxsKHRoaXMsIHN1Y2Nlc3MsIGVycm9yKVxuICB9XG5cbiAgUmVxd2VzdC5wcm90b3R5cGUgPSB7XG4gICAgYWJvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRoaXMuX2Fib3J0ZWQgPSB0cnVlXG4gICAgICB0aGlzLnJlcXVlc3QuYWJvcnQoKVxuICAgIH1cblxuICAsIHJldHJ5OiBmdW5jdGlvbiAoKSB7XG4gICAgICBpbml0LmNhbGwodGhpcywgdGhpcy5vLCB0aGlzLmZuKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNtYWxsIGRldmlhdGlvbiBmcm9tIHRoZSBQcm9taXNlcyBBIENvbW1vbkpzIHNwZWNpZmljYXRpb25cbiAgICAgKiBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Qcm9taXNlcy9BXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBgdGhlbmAgd2lsbCBleGVjdXRlIHVwb24gc3VjY2Vzc2Z1bCByZXF1ZXN0c1xuICAgICAqL1xuICAsIHRoZW46IGZ1bmN0aW9uIChzdWNjZXNzLCBmYWlsKSB7XG4gICAgICBzdWNjZXNzID0gc3VjY2VzcyB8fCBmdW5jdGlvbiAoKSB7fVxuICAgICAgZmFpbCA9IGZhaWwgfHwgZnVuY3Rpb24gKCkge31cbiAgICAgIGlmICh0aGlzLl9mdWxmaWxsZWQpIHtcbiAgICAgICAgdGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AgPSBzdWNjZXNzKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9lcnJlZCkge1xuICAgICAgICBmYWlsKHRoaXMuX3Jlc3BvbnNlQXJncy5yZXNwLCB0aGlzLl9yZXNwb25zZUFyZ3MubXNnLCB0aGlzLl9yZXNwb25zZUFyZ3MudClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2Z1bGZpbGxtZW50SGFuZGxlcnMucHVzaChzdWNjZXNzKVxuICAgICAgICB0aGlzLl9lcnJvckhhbmRsZXJzLnB1c2goZmFpbClcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYGFsd2F5c2Agd2lsbCBleGVjdXRlIHdoZXRoZXIgdGhlIHJlcXVlc3Qgc3VjY2VlZHMgb3IgZmFpbHNcbiAgICAgKi9cbiAgLCBhbHdheXM6IGZ1bmN0aW9uIChmbikge1xuICAgICAgaWYgKHRoaXMuX2Z1bGZpbGxlZCB8fCB0aGlzLl9lcnJlZCkge1xuICAgICAgICBmbih0aGlzLl9yZXNwb25zZUFyZ3MucmVzcClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2NvbXBsZXRlSGFuZGxlcnMucHVzaChmbilcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYGZhaWxgIHdpbGwgZXhlY3V0ZSB3aGVuIHRoZSByZXF1ZXN0IGZhaWxzXG4gICAgICovXG4gICwgZmFpbDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICBpZiAodGhpcy5fZXJyZWQpIHtcbiAgICAgICAgZm4odGhpcy5fcmVzcG9uc2VBcmdzLnJlc3AsIHRoaXMuX3Jlc3BvbnNlQXJncy5tc2csIHRoaXMuX3Jlc3BvbnNlQXJncy50KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZXJyb3JIYW5kbGVycy5wdXNoKGZuKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG4gICwgJ2NhdGNoJzogZnVuY3Rpb24gKGZuKSB7XG4gICAgICByZXR1cm4gdGhpcy5mYWlsKGZuKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlcXdlc3QobywgZm4pIHtcbiAgICByZXR1cm4gbmV3IFJlcXdlc3QobywgZm4pXG4gIH1cblxuICAvLyBub3JtYWxpemUgbmV3bGluZSB2YXJpYW50cyBhY2NvcmRpbmcgdG8gc3BlYyAtPiBDUkxGXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZShzKSB7XG4gICAgcmV0dXJuIHMgPyBzLnJlcGxhY2UoL1xccj9cXG4vZywgJ1xcclxcbicpIDogJydcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcmlhbChlbCwgY2IpIHtcbiAgICB2YXIgbiA9IGVsLm5hbWVcbiAgICAgICwgdCA9IGVsLnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgLCBvcHRDYiA9IGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgLy8gSUUgZ2l2ZXMgdmFsdWU9XCJcIiBldmVuIHdoZXJlIHRoZXJlIGlzIG5vIHZhbHVlIGF0dHJpYnV0ZVxuICAgICAgICAgIC8vICdzcGVjaWZpZWQnIHJlZjogaHR0cDovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTMtQ29yZS9jb3JlLmh0bWwjSUQtODYyNTI5MjczXG4gICAgICAgICAgaWYgKG8gJiYgIW9bJ2Rpc2FibGVkJ10pXG4gICAgICAgICAgICBjYihuLCBub3JtYWxpemUob1snYXR0cmlidXRlcyddWyd2YWx1ZSddICYmIG9bJ2F0dHJpYnV0ZXMnXVsndmFsdWUnXVsnc3BlY2lmaWVkJ10gPyBvWyd2YWx1ZSddIDogb1sndGV4dCddKSlcbiAgICAgICAgfVxuICAgICAgLCBjaCwgcmEsIHZhbCwgaVxuXG4gICAgLy8gZG9uJ3Qgc2VyaWFsaXplIGVsZW1lbnRzIHRoYXQgYXJlIGRpc2FibGVkIG9yIHdpdGhvdXQgYSBuYW1lXG4gICAgaWYgKGVsLmRpc2FibGVkIHx8ICFuKSByZXR1cm5cblxuICAgIHN3aXRjaCAodCkge1xuICAgIGNhc2UgJ2lucHV0JzpcbiAgICAgIGlmICghL3Jlc2V0fGJ1dHRvbnxpbWFnZXxmaWxlL2kudGVzdChlbC50eXBlKSkge1xuICAgICAgICBjaCA9IC9jaGVja2JveC9pLnRlc3QoZWwudHlwZSlcbiAgICAgICAgcmEgPSAvcmFkaW8vaS50ZXN0KGVsLnR5cGUpXG4gICAgICAgIHZhbCA9IGVsLnZhbHVlXG4gICAgICAgIC8vIFdlYktpdCBnaXZlcyB1cyBcIlwiIGluc3RlYWQgb2YgXCJvblwiIGlmIGEgY2hlY2tib3ggaGFzIG5vIHZhbHVlLCBzbyBjb3JyZWN0IGl0IGhlcmVcbiAgICAgICAgOyghKGNoIHx8IHJhKSB8fCBlbC5jaGVja2VkKSAmJiBjYihuLCBub3JtYWxpemUoY2ggJiYgdmFsID09PSAnJyA/ICdvbicgOiB2YWwpKVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd0ZXh0YXJlYSc6XG4gICAgICBjYihuLCBub3JtYWxpemUoZWwudmFsdWUpKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgaWYgKGVsLnR5cGUudG9Mb3dlckNhc2UoKSA9PT0gJ3NlbGVjdC1vbmUnKSB7XG4gICAgICAgIG9wdENiKGVsLnNlbGVjdGVkSW5kZXggPj0gMCA/IGVsLm9wdGlvbnNbZWwuc2VsZWN0ZWRJbmRleF0gOiBudWxsKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gMDsgZWwubGVuZ3RoICYmIGkgPCBlbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGVsLm9wdGlvbnNbaV0uc2VsZWN0ZWQgJiYgb3B0Q2IoZWwub3B0aW9uc1tpXSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICAvLyBjb2xsZWN0IHVwIGFsbCBmb3JtIGVsZW1lbnRzIGZvdW5kIGZyb20gdGhlIHBhc3NlZCBhcmd1bWVudCBlbGVtZW50cyBhbGxcbiAgLy8gdGhlIHdheSBkb3duIHRvIGNoaWxkIGVsZW1lbnRzOyBwYXNzIGEgJzxmb3JtPicgb3IgZm9ybSBmaWVsZHMuXG4gIC8vIGNhbGxlZCB3aXRoICd0aGlzJz1jYWxsYmFjayB0byB1c2UgZm9yIHNlcmlhbCgpIG9uIGVhY2ggZWxlbWVudFxuICBmdW5jdGlvbiBlYWNoRm9ybUVsZW1lbnQoKSB7XG4gICAgdmFyIGNiID0gdGhpc1xuICAgICAgLCBlLCBpXG4gICAgICAsIHNlcmlhbGl6ZVN1YnRhZ3MgPSBmdW5jdGlvbiAoZSwgdGFncykge1xuICAgICAgICAgIHZhciBpLCBqLCBmYVxuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBmYSA9IGVbYnlUYWddKHRhZ3NbaV0pXG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZmEubGVuZ3RoOyBqKyspIHNlcmlhbChmYVtqXSwgY2IpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBlID0gYXJndW1lbnRzW2ldXG4gICAgICBpZiAoL2lucHV0fHNlbGVjdHx0ZXh0YXJlYS9pLnRlc3QoZS50YWdOYW1lKSkgc2VyaWFsKGUsIGNiKVxuICAgICAgc2VyaWFsaXplU3VidGFncyhlLCBbICdpbnB1dCcsICdzZWxlY3QnLCAndGV4dGFyZWEnIF0pXG4gICAgfVxuICB9XG5cbiAgLy8gc3RhbmRhcmQgcXVlcnkgc3RyaW5nIHN0eWxlIHNlcmlhbGl6YXRpb25cbiAgZnVuY3Rpb24gc2VyaWFsaXplUXVlcnlTdHJpbmcoKSB7XG4gICAgcmV0dXJuIHJlcXdlc3QudG9RdWVyeVN0cmluZyhyZXF3ZXN0LnNlcmlhbGl6ZUFycmF5LmFwcGx5KG51bGwsIGFyZ3VtZW50cykpXG4gIH1cblxuICAvLyB7ICduYW1lJzogJ3ZhbHVlJywgLi4uIH0gc3R5bGUgc2VyaWFsaXphdGlvblxuICBmdW5jdGlvbiBzZXJpYWxpemVIYXNoKCkge1xuICAgIHZhciBoYXNoID0ge31cbiAgICBlYWNoRm9ybUVsZW1lbnQuYXBwbHkoZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICBpZiAobmFtZSBpbiBoYXNoKSB7XG4gICAgICAgIGhhc2hbbmFtZV0gJiYgIWlzQXJyYXkoaGFzaFtuYW1lXSkgJiYgKGhhc2hbbmFtZV0gPSBbaGFzaFtuYW1lXV0pXG4gICAgICAgIGhhc2hbbmFtZV0ucHVzaCh2YWx1ZSlcbiAgICAgIH0gZWxzZSBoYXNoW25hbWVdID0gdmFsdWVcbiAgICB9LCBhcmd1bWVudHMpXG4gICAgcmV0dXJuIGhhc2hcbiAgfVxuXG4gIC8vIFsgeyBuYW1lOiAnbmFtZScsIHZhbHVlOiAndmFsdWUnIH0sIC4uLiBdIHN0eWxlIHNlcmlhbGl6YXRpb25cbiAgcmVxd2VzdC5zZXJpYWxpemVBcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXJyID0gW11cbiAgICBlYWNoRm9ybUVsZW1lbnQuYXBwbHkoZnVuY3Rpb24gKG5hbWUsIHZhbHVlKSB7XG4gICAgICBhcnIucHVzaCh7bmFtZTogbmFtZSwgdmFsdWU6IHZhbHVlfSlcbiAgICB9LCBhcmd1bWVudHMpXG4gICAgcmV0dXJuIGFyclxuICB9XG5cbiAgcmVxd2VzdC5zZXJpYWxpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiAnJ1xuICAgIHZhciBvcHQsIGZuXG4gICAgICAsIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApXG5cbiAgICBvcHQgPSBhcmdzLnBvcCgpXG4gICAgb3B0ICYmIG9wdC5ub2RlVHlwZSAmJiBhcmdzLnB1c2gob3B0KSAmJiAob3B0ID0gbnVsbClcbiAgICBvcHQgJiYgKG9wdCA9IG9wdC50eXBlKVxuXG4gICAgaWYgKG9wdCA9PSAnbWFwJykgZm4gPSBzZXJpYWxpemVIYXNoXG4gICAgZWxzZSBpZiAob3B0ID09ICdhcnJheScpIGZuID0gcmVxd2VzdC5zZXJpYWxpemVBcnJheVxuICAgIGVsc2UgZm4gPSBzZXJpYWxpemVRdWVyeVN0cmluZ1xuXG4gICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpXG4gIH1cblxuICByZXF3ZXN0LnRvUXVlcnlTdHJpbmcgPSBmdW5jdGlvbiAobywgdHJhZCkge1xuICAgIHZhciBwcmVmaXgsIGlcbiAgICAgICwgdHJhZGl0aW9uYWwgPSB0cmFkIHx8IGZhbHNlXG4gICAgICAsIHMgPSBbXVxuICAgICAgLCBlbmMgPSBlbmNvZGVVUklDb21wb25lbnRcbiAgICAgICwgYWRkID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAvLyBJZiB2YWx1ZSBpcyBhIGZ1bmN0aW9uLCBpbnZva2UgaXQgYW5kIHJldHVybiBpdHMgdmFsdWVcbiAgICAgICAgICB2YWx1ZSA9ICgnZnVuY3Rpb24nID09PSB0eXBlb2YgdmFsdWUpID8gdmFsdWUoKSA6ICh2YWx1ZSA9PSBudWxsID8gJycgOiB2YWx1ZSlcbiAgICAgICAgICBzW3MubGVuZ3RoXSA9IGVuYyhrZXkpICsgJz0nICsgZW5jKHZhbHVlKVxuICAgICAgICB9XG4gICAgLy8gSWYgYW4gYXJyYXkgd2FzIHBhc3NlZCBpbiwgYXNzdW1lIHRoYXQgaXQgaXMgYW4gYXJyYXkgb2YgZm9ybSBlbGVtZW50cy5cbiAgICBpZiAoaXNBcnJheShvKSkge1xuICAgICAgZm9yIChpID0gMDsgbyAmJiBpIDwgby5sZW5ndGg7IGkrKykgYWRkKG9baV1bJ25hbWUnXSwgb1tpXVsndmFsdWUnXSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdHJhZGl0aW9uYWwsIGVuY29kZSB0aGUgXCJvbGRcIiB3YXkgKHRoZSB3YXkgMS4zLjIgb3Igb2xkZXJcbiAgICAgIC8vIGRpZCBpdCksIG90aGVyd2lzZSBlbmNvZGUgcGFyYW1zIHJlY3Vyc2l2ZWx5LlxuICAgICAgZm9yIChwcmVmaXggaW4gbykge1xuICAgICAgICBpZiAoby5oYXNPd25Qcm9wZXJ0eShwcmVmaXgpKSBidWlsZFBhcmFtcyhwcmVmaXgsIG9bcHJlZml4XSwgdHJhZGl0aW9uYWwsIGFkZClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzcGFjZXMgc2hvdWxkIGJlICsgYWNjb3JkaW5nIHRvIHNwZWNcbiAgICByZXR1cm4gcy5qb2luKCcmJykucmVwbGFjZSgvJTIwL2csICcrJylcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkUGFyYW1zKHByZWZpeCwgb2JqLCB0cmFkaXRpb25hbCwgYWRkKSB7XG4gICAgdmFyIG5hbWUsIGksIHZcbiAgICAgICwgcmJyYWNrZXQgPSAvXFxbXFxdJC9cblxuICAgIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBhcnJheSBpdGVtLlxuICAgICAgZm9yIChpID0gMDsgb2JqICYmIGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdiA9IG9ialtpXVxuICAgICAgICBpZiAodHJhZGl0aW9uYWwgfHwgcmJyYWNrZXQudGVzdChwcmVmaXgpKSB7XG4gICAgICAgICAgLy8gVHJlYXQgZWFjaCBhcnJheSBpdGVtIGFzIGEgc2NhbGFyLlxuICAgICAgICAgIGFkZChwcmVmaXgsIHYpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVpbGRQYXJhbXMocHJlZml4ICsgJ1snICsgKHR5cGVvZiB2ID09PSAnb2JqZWN0JyA/IGkgOiAnJykgKyAnXScsIHYsIHRyYWRpdGlvbmFsLCBhZGQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9iaiAmJiBvYmoudG9TdHJpbmcoKSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBvYmplY3QgaXRlbS5cbiAgICAgIGZvciAobmFtZSBpbiBvYmopIHtcbiAgICAgICAgYnVpbGRQYXJhbXMocHJlZml4ICsgJ1snICsgbmFtZSArICddJywgb2JqW25hbWVdLCB0cmFkaXRpb25hbCwgYWRkKVxuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBzY2FsYXIgaXRlbS5cbiAgICAgIGFkZChwcmVmaXgsIG9iailcbiAgICB9XG4gIH1cblxuICByZXF3ZXN0LmdldGNhbGxiYWNrUHJlZml4ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBjYWxsYmFja1ByZWZpeFxuICB9XG5cbiAgLy8galF1ZXJ5IGFuZCBaZXB0byBjb21wYXRpYmlsaXR5LCBkaWZmZXJlbmNlcyBjYW4gYmUgcmVtYXBwZWQgaGVyZSBzbyB5b3UgY2FuIGNhbGxcbiAgLy8gLmFqYXguY29tcGF0KG9wdGlvbnMsIGNhbGxiYWNrKVxuICByZXF3ZXN0LmNvbXBhdCA9IGZ1bmN0aW9uIChvLCBmbikge1xuICAgIGlmIChvKSB7XG4gICAgICBvWyd0eXBlJ10gJiYgKG9bJ21ldGhvZCddID0gb1sndHlwZSddKSAmJiBkZWxldGUgb1sndHlwZSddXG4gICAgICBvWydkYXRhVHlwZSddICYmIChvWyd0eXBlJ10gPSBvWydkYXRhVHlwZSddKVxuICAgICAgb1snanNvbnBDYWxsYmFjayddICYmIChvWydqc29ucENhbGxiYWNrTmFtZSddID0gb1snanNvbnBDYWxsYmFjayddKSAmJiBkZWxldGUgb1snanNvbnBDYWxsYmFjayddXG4gICAgICBvWydqc29ucCddICYmIChvWydqc29ucENhbGxiYWNrJ10gPSBvWydqc29ucCddKVxuICAgIH1cbiAgICByZXR1cm4gbmV3IFJlcXdlc3QobywgZm4pXG4gIH1cblxuICByZXF3ZXN0LmFqYXhTZXR1cCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICBmb3IgKHZhciBrIGluIG9wdGlvbnMpIHtcbiAgICAgIGdsb2JhbFNldHVwT3B0aW9uc1trXSA9IG9wdGlvbnNba11cbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVxd2VzdFxufSk7XG4iLCJ2YXIgaGVhZGVyID0gcmVxdWlyZShcIi4vLi4vYm93ZXJfY29tcG9uZW50cy9uZXh0LWhlYWRlci9tYWluLmpzXCIpO1xuIl19
