"use strict";

var cache = require('./cache.js'),
	utils = require('./utils.js'),
	envConfig = require('./config.js'),
	oCommentUtilities = require('o-comment-utilities');


/**
 * Livefyre related SUDS endpoints.
 * @type {Object}
 */
var livefyre = {};

/**
 * Uses SUDS.livefyre.init endpoint, but it also embeds an optional caching layer.
 *
 * ### Configuration
 * #### Mandatory fields:
 * - elId: ID of the HTML element in which the widget should be loaded
 * - articleId: ID of the article, any string
 * - url: canonical URL of the page
 * - title: Title of the page
 *
 * #### Optional fields:
 * - stream_type: livecomments, livechat, liveblog
 * - force: has effect in combination with cache enabled. If force set to true, the data won't be readed from the cache even if a valid entry exists, but it will force the call to the webservice to happen.
 * - section: Override the default mapping based on URL or CAPI with an explicit mapping. Section parameter should be a valid FT metadata term (Primary section)
 * - tags: Tags which will be added to the collection in Livefyre
 */
livefyre.getInitConfig = function (conf, callback) {
	if (typeof callback !== 'function') {
		throw "Callbacks not provided";
	}

	if (!conf) {
		throw "No configuration parameters provided";
	}

	if (!conf.hasOwnProperty('articleId')) {
		callback(new Error("Article ID not provided"));
	}

	if (!conf.hasOwnProperty('url')) {
		callback(new Error("Article URL not provided"));
	}

	if (!conf.hasOwnProperty('elId')) {
		callback(new Error("Element ID not provided"));
	}

	if (!conf.hasOwnProperty('title')) {
		callback(new Error("Article title not provided"));
	}


	var cacheEnabled = false;
	if (envConfig.get('cache') === true) {
		cacheEnabled = true;
	}


	// actually make the request to SUDS
	var makeCall = function () {
			var dataToBeSent = {
				title: conf.title,
				url: conf.url,
				articleId: conf.articleId,
				el: conf.elId
			};
			if (typeof conf.stream_type !== 'undefined') {
				dataToBeSent.stream_type = conf.stream_type;
			}
			if (typeof conf.section !== 'undefined') {
				dataToBeSent.section = conf.section;
			}
			if (typeof conf.tags !== 'undefined'){
				dataToBeSent.tags = conf.tags;
			}

			// makes the actual call to the SUDS service
			oCommentUtilities.jsonp(
				{
					url: envConfig.get().suds.baseUrl + envConfig.get().suds.endpoints.livefyre.init,
					data: dataToBeSent
				},
				function(err, data) {
					if (err) {
						callback(err, null);
						return;
					}

					if (data && data.init) {
						if (data.init.unclassifiedArticle !== true && cacheEnabled) {
							cache.cacheInit(conf.articleId, data.init);
							if (data.auth && data.auth.token) {
								cache.cacheAuth(data.auth);
							}
						}

						callback(null, data.init);
					} else {
						callback(new Error("No data received from SUDS."), null);
					}
				}
			);
		};


	if (!cacheEnabled) {
		makeCall();
	} else {
		var initCache = cache.getInit(conf.articleId);

		if (conf.force === true || !initCache) {
			makeCall();
		} else {
			initCache.el = conf.elId;
			callback(null, initCache);
		}
	}
};


/**
 * User related SUDS endpoints.
 * @type {Object}
 */
var user = {};


/**
 * Uses SUDS.user.getauth endpoint, but it also embeds an optional caching layer.
 *
 * ### Configuration
 * #### Optional fields:
 * - force: has effect in combination with cache enabled. If force set to true, the data won't be readed from the cache even if a valid entry exists, but it will force the call to the webservice to happen.
 *
 * @param  {Object|Function}   confOrCallback Configuration object following the fields from the description, or if it isn't relevant, callback function.
 * @param  {Function}          callback       Callback function if configuration is provided as well.
 */
user.getAuth = function (confOrCallback, callback) {
	if (typeof confOrCallback === 'function') {
		callback = confOrCallback;
	}

	if (typeof callback !== 'function') {
		throw new Error('Callback not provided.');
	}

	var cacheEnabled = false;
	if (envConfig.get('cache') === true && envConfig.get('sessionId')) {
		cacheEnabled = true;
	}

	var makeCall = function () {
		oCommentUtilities.jsonp(
			{
				url: envConfig.get().suds.baseUrl + envConfig.get().suds.endpoints.user.getAuth
			},
			function (err, data) {
				if (err) {
					callback(err, null);
					return;
				}

				if (cacheEnabled && data && data.token) {
					cache.cacheAuth(data);
				}

				callback(null, data);
			}
		);
	};


	if (!cacheEnabled) {
		makeCall();
	} else {
		var authCache = cache.getAuth(envConfig.get('sessionId'));

		if (!authCache || confOrCallback.force === true) {
			makeCall();
		} else {
			callback(null, authCache);
		}
	}
};



/**
 * Saves the user's settings by making a call to SUDS.user.updateuser endpoint.
 * @param {Object} userSettings Fields: pseudonym, emailcomments, emailreplies, emaillikes, emailautofollow
 * @param {Function} callback function (err, data)
 */
user.updateUser = function (userSettings, callback) {
	if (typeof callback !== 'function') {
		throw new Error("Callback not provided.");
	}

	if (!userSettings || typeof userSettings !== 'object') {
		callback(new Error("Settings not provided."));
		return;
	}

	if (userSettings.hasOwnProperty('pseudonym')) {
		userSettings.pseudonym = utils.trim(userSettings.pseudonym);
	}

	if (!userSettings.hasOwnProperty('pseudonym') || (userSettings.hasOwnProperty('pseudonym') && userSettings.pseudonym)) {
		oCommentUtilities.jsonp({
				url: envConfig.get().suds.baseUrl + envConfig.get().suds.endpoints.user.updateUser,
				data: userSettings
			},
			function(err, data) {
				if (err) {
					callback(err, null);
					return;
				}

				if (!data) {
					callback(new Error("No data received."), null);
				} else {
					if (data.status === "ok") {
						callback(null, data);
					} else {
						if (data.error) {
							callback({
								sudsError: true,
								error: data.error
							}, null);
						} else {
							callback(new Error("An error occured."), null);
						}
					}
				}
			});
	} else {
		callback({
			sudsError: true,
			error: "Pseudonym is blank."
		}, null);
	}
};



/**
 * Export all endpoints.
 * @type {Object}
 */
module.exports = {
	livefyre: livefyre,
	user: user
};
