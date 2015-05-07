"use strict";

var config = require('./src/javascripts/config.js'),
	suds = require('./src/javascripts/suds.js'),
	ccs = require('./src/javascripts/ccs.js'),
	cache = require('./src/javascripts/cache.js'),
	stream = require('./src/javascripts/stream.js'),
	defaultConfig = require('./config.json'),
	oCommentUtilities = require('o-comment-utilities');


config.set(defaultConfig);

/**
 * Export of the SUDS and CCS APIs.
 * @type {Object}
 */
exports.api = {
	getLivefyreInitConfig: suds.livefyre.getInitConfig,
	getAuth: suds.user.getAuth,
	updateUser: suds.user.updateUser,

	getComments: ccs.getComments,
	postComment: ccs.postComment,
	deleteComment: ccs.deleteComment,

	stream: {
		create: stream.create,
		destroy: stream.destroy
	}
};

/**
 * Allows access to the cached values.
 * @type {Object}
 */
exports.cache = {
	clear: cache.clear,
	clearAuth: cache.clearAuth,
	clearLivefyreInit: cache.clearLivefyreInit
};

/**
 * Enables logging.
 * @type {function}
 */
exports.enableLogging = function () {
	oCommentUtilities.logger.enable.apply(this, arguments);
};

/**
 * Disables logging.
 * @type {function}
 */
exports.disableLogging = function () {
	oCommentUtilities.logger.disable.apply(this, arguments);
};

/**
 * Sets logging level.
 * @type {number|string}
 */
exports.setLoggingLevel = function () {
	oCommentUtilities.logger.setLevel.apply(this, arguments);
};

/**
 * This method sets additional or overrides current configuration options.
 *
 * @param  {string|object} keyOrObject Key or actually an object with key-value pairs.
 * @param  {anything} value Optional. Should be specified only if keyOrObject is actually a key (string).
 */
exports.setConfig = function () {
	config.set.apply(this, arguments);
};


document.addEventListener('o.DOMContentLoaded', function () {
	try {
		var configInDomEl = document.querySelector('script[type="application/json"][data-o-comment-api-config]');
		if (configInDomEl) {
			var configInDom = JSON.parse(configInDomEl.innerHTML);

			exports.setConfig(configInDom);
		}
	} catch (e) {
		oCommentUtilities.logger.log('Invalid config in the DOM.', e);
	}
});
