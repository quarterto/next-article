"use strict";

var envConfig = require('./config.js'),
	oCommentUtilities = require('o-comment-utilities');

/**
 * Verifies if there's a valid auth token (not expired) attached to the session ID provided.
 * @return {string|undefined}
 */
exports.getAuth = function() {
	if (!envConfig.get('sessionId')) {
		return undefined;
	}

	var authCache = oCommentUtilities.storageWrapper.sessionStorage.getItem(envConfig.get().cacheConfig.authBaseName + envConfig.get('sessionId'));
	if (authCache) {
		if (new Date() < oCommentUtilities.dateHelper.toDateObject(authCache.expires)) {
			return authCache;
		} else {
			oCommentUtilities.storageWrapper.sessionStorage.removeItem(envConfig.get().cacheConfig.authBaseName + envConfig.get('sessionId'));
		}
	}

	return undefined;
};

/**
 * Removes the auth token from the local cache.
 */
exports.removeAuth = function () {
	if (!envConfig.get('sessionId')) {
		return;
	}


	oCommentUtilities.storageWrapper.sessionStorage.removeItem(envConfig.get().cacheConfig.authBaseName + envConfig.get('sessionId'));
};

/**
 * Saves the auth token into the local cache.
 * @param  {object} authObject Object which contains the following:
 * - JWT token
 * - displayName
 * - settings (e.g. email preferences)
 * - expires (timestamp like Date.getTime())
 * @return {boolean} True if successfully saved or false if not.
 */
exports.cacheAuth = function (authObject) {
	if (!envConfig.get('sessionId')) {
		return false;
	}

	if (authObject.token) {
		try {
			var oldObj = {};
			if (oCommentUtilities.storageWrapper.sessionStorage.hasItem(envConfig.get().cacheConfig.authBaseName + envConfig.get('sessionId'))) {
				oldObj = oCommentUtilities.storageWrapper.sessionStorage.getItem(envConfig.get().cacheConfig.authBaseName + envConfig.get('sessionId'));
			}

			var mergedObj = oCommentUtilities.merge({}, oldObj, authObject);
			oCommentUtilities.storageWrapper.sessionStorage.setItem(envConfig.get().cacheConfig.authBaseName + envConfig.get('sessionId'), mergedObj);

			return true;
		} catch (e) {
			oCommentUtilities.logger.debug("Failed to save to the storage.", "authObject:", authObject, "sessionId:", envConfig.get('sessionId'), "Error:", e);
		}
	}

	return false;
};

/**
 * Returns the SUDS init object saved into the local cache.
 * @param  {string|number} articleId The ID of the article
 * @return {object|undefined}
 */
exports.getInit = function (articleId) {
	return oCommentUtilities.storageWrapper.sessionStorage.getItem(envConfig.get().cacheConfig.initBaseName + articleId);
};

/**
 * Saves the SUDS init object into the local cache.
 * @param  {string|number} articleId The ID of the article
 * @param  {object} initObj SUDS init
 */
exports.cacheInit = function (articleId, initObj) {
	try {
		oCommentUtilities.storageWrapper.sessionStorage.setItem(envConfig.get().cacheConfig.initBaseName + articleId, initObj);

		return true;
	} catch (e) {
		oCommentUtilities.logger.debug("Failed to save to the storage.", "articleId:", articleId, "initObj:", initObj, "Error:", e);
	}

	return false;
};

/**
 * Removes the SUDS init object from the local cache.
 * @param  {string|number} articleId The ID of the article
 */
exports.removeInit = function (articleId) {
	oCommentUtilities.storageWrapper.sessionStorage.removeItem(envConfig.get().cacheConfig.initBaseName + articleId);
};



exports.clearAuth = function () {
	if (oCommentUtilities.storageWrapper.sessionStorage.native) {
		for (var key in oCommentUtilities.storageWrapper.sessionStorage.native) {
			if (oCommentUtilities.storageWrapper.sessionStorage.hasItem(key)) {
				var matchAuth = key.match(new RegExp(envConfig.get().cacheConfig.authBaseName + '(.*)'));
				if (matchAuth && matchAuth.length) {
					oCommentUtilities.storageWrapper.sessionStorage.removeItem(key);
				}
			}
		}
	}
};

exports.clearLivefyreInit = function () {
	if (oCommentUtilities.storageWrapper.sessionStorage.native) {
		for (var key in oCommentUtilities.storageWrapper.sessionStorage.native) {
			if (oCommentUtilities.storageWrapper.sessionStorage.hasItem(key)) {
				var matchInit = key.match(new RegExp(envConfig.get().cacheConfig.initBaseName + '(.*)'));
				if (matchInit && matchInit.length) {
					oCommentUtilities.storageWrapper.sessionStorage.removeItem(key);
				}
			}
		}
	}
};

/**
 * Clears all entries created by the cache.
 */
exports.clear = function () {
	exports.clearAuth();
	exports.clearInit();
};
