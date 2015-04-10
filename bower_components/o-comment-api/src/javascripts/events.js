"use strict";

exports.emit = function (eventName, eventDetails) {
	eventDetails = eventDetails || {
		eventType: 'info'
	};

	try {
		document.body.dispatchEvent(new CustomEvent('oCommentApi.' + eventName, {
			detail: eventDetails,
			bubbles: true
		}));
	} catch (e) {
		// do nothing
	}
};
