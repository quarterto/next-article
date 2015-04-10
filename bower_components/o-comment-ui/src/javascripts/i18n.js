"use strict";

/**
 * Custom messages that are used in the FrontEnd.
 * @type {Object}
 */
exports.texts = {
	unavailable: 'It seems we\'re having a problem loading comments for you. Apologies. Hopefully it\'s temporary, but if you continue to experience this difficulty, please contact <a href="mailto:help@ft.com">help@ft.com</a>.',
	changePseudonymError: 'System is temporarily unavailable, please try again later.',
	changePseudonymBlankError: 'Pseudonym is blank.',
	genericError: 'System is temporarily unavailable, please try again later.',
	commentingSettingsLabel: 'Commenting settings'
};

/**
 * Error messages coming from the web services could be not user friendly.
 * So some of the messages are mapped to a more user friendly message.
 * @type {Object}
 */
exports.serviceMessageOverrides = {
	'User session is not valid.': 'You are not currently signed in to FT.com, please '+
			'<a href="https://registration.ft.com/registration/barrier/login?location='+ encodeURIComponent(document.location.href) +'">sign in</a> to create a pseudonym',
	'User profile (.*) does not have permission to access the desired action.': 'You don\'t have permission to perform this action.',
	'Commenting is closed for conversation=([0-9]+)': 'This conversation is closed to new comments.'
};
