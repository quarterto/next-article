"use strict";

var oCommentUtilities = require('o-comment-utilities'),
	WidgetUi = require('./WidgetUi.js');

/**
 * Widget is responsible to coordinate getting initialization data, loading resources and initializing the Ui.
 * While this class implements some of the basic functionality (handling errors, loading timeout),
 * it should be extended by providing an implementation for getting the initialization data and loading the resources.
 *
 * #### Configuration
 * ###### Mandatory fields:
 *
 * - articleId: ID of the article, any string
 * - url: canonical URL of the page
 * - title: Title of the page
 *
 * ###### Optional fields:
 *
 *  - timeout: Period of time after a timeout is triggered. Default is 15000 ms (15 sec). Its value should be given in milliseconds (ms).
 *
 * @param {Object} config Configuration object, as described in the class description.
 */
function Widget (rootEl, config) {
	var widgetEl, self;

	self = this;

	if (!rootEl) {
		rootEl = document.body;
	} else if (!(rootEl instanceof HTMLElement)) {
		rootEl = document.querySelector(rootEl);
	}

	rootEl.setAttribute('data-'+ self.classNamespace +'-js', '');

	widgetEl = rootEl;

	if (!widgetEl.id) {
		widgetEl.id = self.eventNamespace + '-' + oCommentUtilities.generateId();
	}
	config.elId = widgetEl.id;


	/**
	 * Validation of the initial configuration object.
	 */
	if (!config) {
		return;
	}

	if (!config.articleId) {
		if (!config.articleid) {
			return;
		} else {
			config.articleId = config.articleid;
		}
	}

	if (!config.url) {
		return;
	}

	if (!config.title) {
		return;
	}



	config.timeout = config.timeout || 15;


	this.config = config;


	this.ui = new WidgetUi(widgetEl);

	/**
	 * Returns the widget container DOM element
	 * @return {native DOM object}
	 */
	this.getWidgetEl = function () {
		return widgetEl;
	};

	/**
	 * Attach new event handlers.
	 * @type {function}
	 * @param {string} eventName Required. Name of the event to which to attach the handler.
	 * @param {function} handler Required. Handler Function which will be called when the event is triggered.
	 */
	this.on = function (eventName, eventHandler) {
		widgetEl.addEventListener(self.eventNamespace + '.' + eventName, eventHandler);
	};

	/**
	 * Removes the event handler(s).
	 * @type {function}
	 * @param {string} eventName Required. Specifies the event from which all handlers should be removed.
	 *  If omitted, all event handlers are removed from all events.
	 * @param {function} handler Required. The event name should be specified as well if this is specified.
	 *  Specifies the handler which should be removed from the event specified.
	 */
	this.off = function (eventName, eventHandler) {
		widgetEl.removeEventListener(self.eventNamespace + '.' + eventName, eventHandler);
	};

	/**
	 * Triggers an event.
	 * @type {function}
	 * @param {string} eventName Required. Name of the event which will be triggered.
	 * @param {object} data Optional. Data to be passed to the handler.
	 */
	this.trigger = function (eventName, data) {
		var payload = {
			data: data,
			instance: self,
			id: config.elId
		};

		widgetEl.dispatchEvent(new CustomEvent(self.eventNamespace + '.' + eventName, {
			detail: payload,
			bubbles: true
		}));
	};

	/**
	 * ! 'this' could not have the value of the instance.
	 * To be sure you use the correct instance value, you should
	 * save it in the constructor in a variable (var self = this)
	 * and use that variable.
	 */
	this.loadInitData = function (callback) {
		callback(new Error("Not implemented"));
	};


	this.onTimeout = function () {
		self.ui.clearContainer();
		self.ui.addNotAvailableMessage();
	};

	this.onError = function () {
		self.ui.clearContainer();
		self.ui.addNotAvailableMessage();
	};

	this.destroy = function () {
		self.config = null;

		self.ui.destroy();
		self.ui = null;

		widgetEl = null;

		self = null;
	};
}

Widget.prototype.initCalled = false;

Widget.prototype.init = function () {
	var self = this;

	if (!this.config) {
		return;
	}

	if (!this.initCalled) {
		this.initCalled = true;

		var timeout;
		if (this.config.timeout > 0) {
			timeout = setTimeout(function () {
				self.trigger('widget.timeout');

				self.onTimeout();
			}, this.config.timeout * 1000);
		}

		self.loadInitData(function (err, data) {
			if (err) {
				self.trigger('error.init', err.error);
				self.trigger('error.widget', err.error);

				self.onError(err);

				clearTimeout(timeout);
				return;
			}

			if (data) {
				self.trigger('data.init', data);

				self.render(data, function (err) {
					if (err) {
						self.trigger('error.widget', err);

						self.onError(err);

						clearTimeout(timeout);

						return;
					}

					clearTimeout(timeout);
				});
			}
		});
	}
};
Widget.prototype.eventNamespace = 'oCommentUi';
Widget.prototype.classNamespace = 'o-comment-ui';

Widget.__extend = function(child, eventNamespace, classNamespace) {
	if (typeof Object.create === 'function') {
		child.prototype = Object.create(Widget.prototype);
	} else {
		var Tmp = function () {};
		Tmp.prototype = Widget.prototype;
		child.prototype = new Tmp();
		child.prototype.constructor = child;
	}

	if (eventNamespace) {
		child.prototype.eventNamespace = eventNamespace;
	}

	if (classNamespace) {
		child.prototype.classNamespace = classNamespace;
	}
};

/**
 * Export of Widget.
 * @type {Function}
 */
module.exports = Widget;
