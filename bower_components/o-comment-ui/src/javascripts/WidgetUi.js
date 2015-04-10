"use strict";

var i18n = require('./i18n.js'),
	templates = require('./templates.js');

/**
 * This class is responsible to handle the UI part of a commenting widget. An instance of this is created within an instance of the `Widget`.
 * While this implementation has predefined methods, it can be extended with particular UI methods.
 * @param {DOMObject} widgetContainer DOM Object or selector of the container of the widget.
 */
function WidgetUi (widgetContainer) {
	var self = this;

	this.widgetContainer = undefined;

	try {
		if (typeof widgetContainer === "string") {
			var widgetElSelect = document.querySelectorAll(widgetContainer);
			if (widgetElSelect.length) {
				this.widgetContainer = widgetContainer[0];
			} else {
				throw "Selector not valid or does not exists.";
			}
		} else if ((window.HTMLElement && widgetContainer instanceof window.HTMLElement) || (window.Element && widgetContainer instanceof window.Element)) {
			this.widgetContainer = widgetContainer;
		}
	} catch (e) {
		this.widgetContainer = document.body;
	}

	/**
	 * Scrolls the page to the widget.
	 * @param  {Function} callback Called when the scroll animation is finished.
	 */
	this.scrollToWidget = function (callback) {
		var callbackCalled = false;
		var done = function () {
			if (!callbackCalled) {
				callbackCalled = true;

				if (typeof callback === 'function') {
					callback();
				}
			}
		};

		window.scrollTo(0, self.widgetContainer.offsetTop);
		done();
	};

	/**
	 * Inserts message when comments is not available, either because of the web services or Livefyre.
	 */
	this.addNotAvailableMessage = function () {
		self.widgetContainer.innerHTML = templates.unavailableTemplate.render({
			message: i18n.texts.unavailable
		});
	};

	/**
	 * Clears the container's content.
	 */
	this.clearContainer = function () {
		self.widgetContainer.innerHTML = "";
	};

	this.addTermsAndGuidelineMessage = undefined;
	this.makeReadOnly = undefined;
	this.hideSignInLink = undefined;
	this.addAuthNotAvailableMessage = undefined;
	this.addSettingsLink = undefined;

	this.destroy = function () {
		if (self.widgetContainer) {
			self.widgetContainer.parentNode.removeChild(self.widgetContainer);
			self.widgetContainer = null;
		}
	};
}
WidgetUi.__extend = function(child) {
	if (typeof Object.create === 'function') {
		child.prototype = Object.create(WidgetUi.prototype);
		child.prototype = Object.create(WidgetUi.prototype);
	} else {
		var Tmp = function () {};
		Tmp.prototype = WidgetUi.prototype;
		child.prototype = new Tmp();
		child.prototype.constructor = child;
	}
};

/**
 * Export of WidgetUI.
 * @type {Function}
 */
module.exports = WidgetUi;
