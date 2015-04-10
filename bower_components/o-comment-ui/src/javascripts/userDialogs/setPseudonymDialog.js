"use strict";

var Overlay = require('o-overlay'),
	OverlayFormContent = require('../overlay_content_builder/OverlayFormContent.js'),
	oCommentUtilities = require('o-comment-utilities');

var shown = false;

/**
 * Shows a dialog for setting the initial pseudonym (shown when the user doesn't have a pseudonym set).
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
			name: 'setpseudonym',
			items: [
				{
					type: 'initialPseudonym'
				}
			],
			buttons: [
				{
					type: 'submitButton',
					label: 'Save'
				},
				{
					type: 'cancelButton'
				}
			]
		});

		var overlayInstance = new Overlay("oCommentUi_setPseudonymDialog", {
			html: form.getContainerDomElement(),
			heading: {
				title: "Commenting Settings"
			},
			modal: true
		});

		var onSubmitHandler = function (evt) {
			if (!inProgress) {
				inProgress = true;
				form.disableButtons();

				var formData = form.serialize();

				callbacks.submit(formData, function (err) {
					if (err) {
						form.showError(err);

						form.enableButtons();
						inProgress = false;

						return;
					}

					shown = false;

					ignoreCloseEvent = true;
					overlayInstance.close();
					overlayInstance.destroy();
				});
			}

			if (evt.preventDefault) {
				evt.preventDefault();
			} else {
				evt.returnValue = false;
			}

			return false;
		};
		form.getFormDomElement().addEventListener('submit', onSubmitHandler);


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
				overlayInstance.destroy();
				overlayInstance = null;
			}

			if (!ignoreCloseEvent) {
				if (typeof callbacks.close === 'function') {
					callbacks.close();
				}

				if (!inProgress) {
					oCommentUtilities.logger.log('pseudonym refused');
				}
			}
		};

		overlayInstance.open();

		var onCancelHandler = function () {
			overlayInstance.close();
		};
		form.getContainerDomElement().addEventListener('oCommentUi.form.cancel', onCancelHandler);

		overlayInstance.wrapper.addEventListener('oOverlay.destroy', onCloseInternalHandler);
	}
};
