"use strict";

var Overlay = require('o-overlay'),
	OverlayFormContent = require('../overlay_content_builder/OverlayFormContent.js');

var shown = false;
/**
 * Shows a dialog which reminds the user to save its email preferences if he/she didn't do so.
 * @param  {Object} callbacks Object with callback functions. Possible fields:
 *                                - submit: Required. Function that is called when the form is submitted
 *                                - close:  Optional. Function that is called when the dialog is closed.
 */
exports.show = function (callbacks) {
	if (shown === false) {
		if (typeof callbacks !== 'object' || !callbacks) {
			throw new Error("Callbacks not provided.");
		}

		if (typeof callbacks.submit !== 'function') {
			throw new Error("Submit callback not provided.");
		}


		shown = true;
		var inProgress = false;

		var ignoreCloseEvent = false;

		var form = new OverlayFormContent({
			method: 'GET',
			action: "",
			name: 'changepseudonym',
			items: [
				'<strong>Your comment has been submitted.</strong>',
				{
					type: 'followExplanation'
				},
				{
					type: 'emailSettingsStandalone'
				},
				{
					type: 'commentingSettingsExplanation'
				}
			],
			buttons: [
				{
					type: 'dismiss',
					label: 'Don\'t show me this message again:'
				},
				{
					type: 'submitButton',
					label: 'Save'
				}
			]
		});

		var overlayInstance = new Overlay("oCommentUi_emailAlertDialog", {
			html: form.getContainerDomElement(),
			heading: {
				title: "Commenting Settings"
			},
			modal: true
		});

		var onSubmitHandler = function (evt) {
			if (!inProgress) {
				inProgress = true;

				var formData = form.serialize();

				if (formData.emailautofollow !== 'on') {
					formData.emailautofollow = 'off';
				}

				delete formData.dismiss;

				form.disableButtons();

				callbacks.submit(formData, function (err) {
					if (err) {
						form.showError(err);

						inProgress = false;
						form.enableButtons();

						return;
					}

					ignoreCloseEvent = true;
					overlayInstance.close();
				});
			}

			if (evt.preventDefault) {
				evt.preventDefault();
			} else {
				evt.returnValue = false;
			}

			return false;
		};
		form.getDomElement().addEventListener('submit', onSubmitHandler);

		var onCloseInternalHandler = function () {
			shown = false;

			if (form) {
				form.getFormDomElement().removeEventListener('submit', onSubmitHandler);
				form.getContainerDomElement().removeEventListener('oCommentUi.form.cancel', onCancelHandler);
				form.destroy();
				form = null;
			}

			if (overlayInstance) {
				overlayInstance.wrapper.removeEventListener('oOverlay.destroy', onCloseInternalHandler);
				overlayInstance = null;
			}

			if (!ignoreCloseEvent) {
				if (typeof callbacks.close === 'function') {
					callbacks.close();
				}
			}
		};

		overlayInstance.open();

		var onCancelHandler = function () {
			overlayInstance.close();
		};
		form.getDomElement().addEventListener('oCommentUi.form.cancel', onCancelHandler);
		overlayInstance.wrapper.addEventListener('oOverlay.destroy', onCloseInternalHandler);
	}
};
