'use strict';

var errorsHandler = require('express-errors-handler');

module.exports = function(err) {
	if (err.message.indexOf('network timeout at') > -1) {
		errorsHandler.captureMessage('Fetch network error occurred with message "' + err.message + '"')
		// temporarily set a big status until this change rolls out everywhere:-
		// https://github.com/matthew-andrews/fetchres/pull/3
		return { ok: false, status: 9999 };
	} else {
		throw err;
	}
};
