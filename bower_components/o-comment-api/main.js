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

	createStream: stream.create
};

/**
 * Allows access to the cached values.
 * @type {Object}
 */
exports.cache = {
	clear: cache.clear,
	clearAuth: cache.clearAuth,
	clearInit: cache.clearInit
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
 * Init method sets additional or overrides current configuration options.
 */
exports.init = function () {
	config.set.apply(this, arguments);
};
