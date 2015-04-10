"use strict";

var oCommentUtilities = require('o-comment-utilities');
var envConfig = require('./config.js');
var cache = require('./cache.js');
var stream = require('./stream.js');


/**
 * Uses CCS.getComments endpoint, but it also embeds an optional caching layer for the authentication info.
 *
 * ### Configuration
 * #### Mandatory fields:
 * - articleId: ID of the article, any string
 * - url: canonical URL of the page
 * - title: Title of the page
 *
 * #### Optional fields:
 * - stream: enable streaming of new comments
 * - page: the page number to be fetched. By default it is 0.
 * - section: Override the default mapping based on URL or CAPI with an explicit mapping. Section parameter should be a valid FT metadata term (Primary section)
 * - tags: Tags which will be added to the collection in Livefyre
 */
function getComments (conf, callback) {
	if (typeof callback !== 'function') {
		throw new Error("Callback not provided");
	}

	if (!conf || typeof conf !== 'object') {
		callback(new Error("Configuration is not provided."));
		return;
	}


	if (!conf.hasOwnProperty('articleId')) {
		callback(new Error("Article ID not provided."));
		return;
	}

	if (!conf.hasOwnProperty('title')) {
		callback(new Error("Article title not provided."));
		return;
	}

	if (!conf.hasOwnProperty('url')) {
		callback(new Error("Article url not provided."));
		return;
	}

	var cacheEnabled = false;
	if (envConfig.get('cache') === true && envConfig.get('sessionId')) {
		cacheEnabled = true;
	}

	var dataToBeSent = {
		title: conf.title,
		url: conf.url,
		articleId: conf.articleId
	};
	if (typeof conf.page === 'number') {
		dataToBeSent.pageNumber = conf.page;
	}
	if (typeof conf.section !== 'undefined') {
		dataToBeSent.section = conf.section;
	}
	if (typeof conf.tags !== 'undefined'){
		dataToBeSent.tags = conf.tags;
	}

	oCommentUtilities.jsonp(
		{
			url: envConfig.get().ccs.baseUrl + envConfig.get().ccs.endpoints.getComments,
			data: dataToBeSent
		},
		function (err, data) {
			if (err) {
				callback(err, null);
				return;
			}

			if (data && data.collection) {
				if (data.collection.unclassifiedArticle !== true && cacheEnabled) {
					if (data.userDetails && data.userDetails.token) {
						cache.cacheAuth(data.userDetails);
					}
				}

				callback(null, {
					collection: data.collection
				});

				if (conf.stream === true && typeof conf.page === 'undefined') {
					stream.create(data.collection.collectionId, {
						callback: function (eventData) {
							callback(null, {
								stream: eventData
							});
						},
						lastEventId: data.collection.lastEvent
					});
				}
			} else {
				callback(new Error("No data received from CCS."), null);
			}
		}
	);
}

/**
 * Posts a comment into a given collection using the user's auth token.
 *
 * ### Configuration
 * #### Mandatory fields
 * - collectionId: ID of the collection to post the comment.
 * - commentBody: actual content of the comment.
 *
 * @param  {Object}   conf     Configuration object
 * @param  {Function} callback function (err, data)
 */
function postComment (conf, callback) {
	if (typeof callback !== 'function') {
		throw new Error("Callback not provided");
	}

	if (!conf || typeof conf !== 'object') {
		callback(new Error("Configuration is not provided."));
		return;
	}

	if (!conf.commentBody) {
		callback(new Error("Content not provided."));
		return;
	}

	if (!conf.collectionId) {
		callback(new Error("Collection ID not provided."));
		return;
	}


	var dataToBeSent = {
		collectionId: conf.collectionId,
		commentBody: conf.commentBody
	};


	oCommentUtilities.jsonp({
		url: envConfig.get().ccs.baseUrl + envConfig.get().ccs.endpoints.postComment,
		data: dataToBeSent
	}, function (err, data) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, data);
	});
}

function deleteComment (conf, callback) {
	if (typeof callback !== 'function') {
		throw new Error("Callback not provided");
	}

	if (!conf || typeof conf !== 'object') {
		callback(new Error("Configuration is not provided."));
		return;
	}

	if (!conf.collectionId) {
		callback(new Error("Collection ID not provided."));
		return;
	}

	if (!conf.commentId) {
		callback(new Error("Comment ID not provided."));
		return;
	}


	var dataToBeSent = {
		collectionId: conf.collectionId,
		commentId: conf.commentId
	};


	oCommentUtilities.jsonp({
		url: envConfig.get().ccs.baseUrl + envConfig.get().ccs.endpoints.deleteComment,
		data: dataToBeSent
	}, function (err, data) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, data);
	});
}

/**
 * Export all endpoints.
 * @type {Object}
 */
module.exports = {
	getComments: getComments,
	postComment: postComment,
	deleteComment: deleteComment
};
