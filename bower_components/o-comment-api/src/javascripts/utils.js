"use strict";

/**
 * Wrapper and polyfill for String.prototype.trim
 * @param  {string} string The string to be trimmed.
 * @return {string} The trimmed string.
 */
exports.trim = function (string) {
	if (!String.prototype.trim) {
		return string.replace(/^\s+|\s+$/g, '');
	} else {
		return string.trim();
	}
};
