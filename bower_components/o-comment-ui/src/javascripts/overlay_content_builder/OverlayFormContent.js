"use strict";

var hogan = require('hogan');

var templates = require('../templates.js');

var utils = require('../utils.js');
var formFragments = require('./formFragments.js');

var errorMessageContainerTemplate = hogan.compile(requireText('../../templates/form/errorMessageContainer.ms'));
var buttonContainerTemplate = hogan.compile(requireText('../../templates/form/buttonContainer.ms'));
var buttonTemplate = hogan.compile(requireText('../../templates/form/button.ms'));
var buttonCancelTemplate = hogan.compile(requireText('../../templates/form/buttonCancel.ms'));
var dismissTemplate = hogan.compile(requireText('../../templates/form/dismiss.ms'));
var clearTemplate = templates.clearLine;

/**
 * Form is a helper for creating a form. It handles constructing the form element, generating buttons, forwarding submit and cancel events.
 * @param {Object} config Configuration object which specifies the elements of the form (form fragments, buttons).
 */
function OverlayFormContent (config) {
	if (!config || typeof config !== 'object') {
		throw "Configuration missing or invalid.";
	}

	var myself = this;
	var formObject;
	var container;

	function init () {
		var item;
		var button;
		var i;


		container = document.createElement('div');
		container.className = "o-comment-ui--overlay-content";

		formObject = document.createElement('form');
		formObject.setAttribute('name', config.name || "");
		formObject.setAttribute('method', config.method || "");
		formObject.setAttribute('action', config.action || "");

		container.appendChild(formObject);

		formObject.appendChild(utils.toDOM(errorMessageContainerTemplate.render()));


		if (config.items && config.items.length) {
			for (i = 0; i < config.items.length; i++) {
				item = config.items[i];

				if (typeof item === 'object' && typeof formFragments[item.type] === 'function') {
					formObject.appendChild(utils.toDOM(formFragments[item.type].call(myself, item)));
				} else if (typeof item === 'string') {
					formObject.appendChild(utils.toDOM(item));
				}
			}
		}

		if (config.buttons && config.buttons.length) {
			formObject.appendChild(utils.toDOM(buttonContainerTemplate.render()));
			var buttonContainer = formObject.querySelector('.o-comment-ui--overlay-button-container');

			for (i = 0; i < config.buttons.length; i++) {
				button = config.buttons[i];

				switch(button.type) {
					case 'button':
						if (typeof button.label !== "undefined") {
							buttonContainer.appendChild(utils.toDOM(buttonTemplate.render({
								type: 'button',
								label: button.label
							})));
						}
						break;
					case 'submitButton':
						buttonContainer.appendChild(utils.toDOM(buttonTemplate.render({
							type: 'submit',
							label: button.label ? button.label : 'Submit'
						})));
						break;
					case 'cancelButton':
						buttonContainer.appendChild(utils.toDOM(buttonCancelTemplate.render({
							label: button.label ? button.label : 'cancel'
						})));
						break;
					case 'dismiss':
						buttonContainer.appendChild(utils.toDOM(dismissTemplate.render({
							label: button.label
						})));
				}
			}

			formObject.appendChild(utils.toDOM(clearTemplate.render()));

			var cancelButtons = formObject.querySelectorAll('.o-comment-ui--cancel-button');
			var triggerCancel = function () {
				container.dispatchEvent(new CustomEvent('oCommentUi.form.cancel', {
					bubbles: true
				}));
			};

			for (var j = 0; j < cancelButtons.length; j++) {
				cancelButtons[j].addEventListener('click', triggerCancel);
			}
		}
	}
	init.call(this);


	this.getContainerDomElement = function () {
		return container;
	};
	this.getDomElement = this.getContainerDomElement;

	this.getFormDomElement = function () {
		return formObject;
	};


	/**
	 * Helper to serialize form values into JavaScript Object (key-value pairs).
	 * @param  {DOMObject} form DOM Object of the form element.
	 * @return {Object}     Serialized key-value pairs of the form.
	 */
	var serializeForm = function (form) {
		var field,
			assocArray = {},
			i,
			j;

		if (typeof form === 'object' && form.nodeName === "FORM"){
			for (i = form.elements.length-1; i >= 0; i--){
				field = form.elements[i];
				if (field.name && field.type !== 'file' && field.type !== 'reset' && !field.hasAttribute('disabled')) {
					if (field.type === 'select-multiple'){
						for (j = form.elements[i].options.length-1; j >= 0; j--) {
							if (field.options[j].selected) {
								assocArray[field.name] = field.options[j].value;
							}
						}
					} else {
						if ((field.type !== 'submit' && field.type !== 'button')) {
							if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
								assocArray[field.name] = field.value;
							}
						}
					}
				}
			}
		}

		return assocArray;
	};

	/**
	 * Serializes the form that is built by this instance.
	 * @return {Object} Serialized key-value pairs of the form.
	 */
	this.serialize = function () {
		return serializeForm(formObject);
	};

	/**
	 * Shows an error message on top of the form.
	 * @param  {String} errMessages The error message to show.
	 */
	this.showError = function (errMessages) {
		var errMessageContainer = formObject.querySelector('.o-comment-ui--overlay-error-message');

		if (errMessageContainer) {
			errMessageContainer.innerHTML = errMessages;
		}
	};

	/**
	 * Clears all the errors.
	 */
	this.clearError = function () {
		var errMessageContainer = formObject.querySelector('.o-comment-ui--overlay-error-message');

		if (errMessageContainer) {
			errMessageContainer.innerHTML = "";
		}
	};


	/**
	 * Disable all buttons of a button collection.
	 * @param  {Array} buttons Array of buttons (DOM objects).
	 */
	var disableAllButtons = function (buttons) {
		for (var i = 0; i < buttons.length; i++) {
			buttons[i].setAttribute('disabled', 'disabled');
		}
	};

	/**
	 * Disables the buttons (useful when an action is already in progress).
	 */
	this.disableButtons = function() {
		var buttons = formObject.querySelectorAll('button');
		var buttonInputs = formObject.querySelectorAll('input[type=button]');
		var submitInputs = formObject.querySelectorAll('input[type=submit]');

		disableAllButtons(buttons);
		disableAllButtons(buttonInputs);
		disableAllButtons(submitInputs);
	};


	/**
	 * Enable all buttons of a button collection.
	 * @param  {Array} buttons Array of buttons (DOM objects).
	 */
	var enableAllButtons = function (buttons) {
		for (var i = 0; i < buttons.length; i++) {
			buttons[i].removeAttribute('disabled');
		}
	};

	/**
	 * Enables the buttons (useful when the buttons were disabled while an action was in progress
	 * and the user is given back the control).
	 */
	this.enableButtons = function() {
		var buttons = formObject.querySelectorAll('button');
		var buttonInputs = formObject.querySelectorAll('input[type=button]');
		var submitInputs = formObject.querySelectorAll('input[type=submit]');

		enableAllButtons(buttons);
		enableAllButtons(buttonInputs);
		enableAllButtons(submitInputs);
	};

	this.destroy = function () {
		formObject = null;
		myself = null;
	};
}

/**
 * Export the Form class.
 * @type {Form}
 */
module.exports = OverlayFormContent;
