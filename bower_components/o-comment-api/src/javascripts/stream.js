"use strict";

var events = require('./events.js');

var request = require('./request.js');
var envConfig = require('./config.js');
var logger = require('o-comment-utilities').logger;

function Stream (collectionId, config) {
	var callbacks = [];
	var lastEventId;

	var commentIds = [];

	var initialized = false;
	var destroyed = false;

	if (config.callbacks && config.callbacks instanceof Array) {
		callbacks = config.callbacks;
	}
	if (config.callback && typeof config.callback === 'function') {
		callbacks.push(config.callback);
	}

	if (typeof config.lastEventId !== 'undefined') {
		lastEventId = config.lastEventId;
	}


	var callAllCallbacks = function () {
		var i;
		var args = arguments;

		var callCallback = function (currentCallback) {
			setTimeout(function () {
				currentCallback.apply(this, args);
			});
		};

		for (i = 0; i < callbacks.length; i++) {
			callCallback(callbacks[i]);
		}
	};

	var handleNewComment = function (data, authorData) {
		if (commentIds.indexOf(data.content.id) === -1) {
			commentIds.push(data.content.id);
		}

		callAllCallbacks({
			comment: {
				parentId: data.content.parentId || null,
				author: authorData ? {
					displayName: authorData.displayName,
					tags: authorData.tags,
					type: authorData.type
				} : null,
				content: data.content.bodyHtml || null,
				timestamp: data.content.createdAt || null,
				commentId: data.content.id || null,
				visibility: data.vis
			}
		});
	};

	var handleUpdateComment = function (data) {
		callAllCallbacks({
			comment: {
				updated: true,
				commentId: data.content.id,
				content: data.content.bodyHtml
			}
		});
	};

	var handleDeleteComment = function (data) {
		callAllCallbacks({
			comment: {
				deleted: true,
				commentId: data.content.id
			}
		});
	};

	var handleCommentsEnabled = function (data) {
		callAllCallbacks({
			collection: {
				commentsEnabled: data.value
			}
		});
	};

	var handleResponseData = function (data) {
		if (data.states) {
			var eventCollection = data.states;

			for (var key in eventCollection) {
				if (eventCollection.hasOwnProperty(key)) {
					var item = eventCollection[key];

					// type: comment
					if (item.type === 0) {
						if (item.vis >= 1) {
							if (item.content.updatedBy || commentIds.indexOf(item.content.id) !== -1) {
								handleUpdateComment(item);
							} else {
								handleNewComment(item, ((data.authors && item.content.authorId) ? data.authors[item.content.authorId] : null));
							}
						} else if (item.vis === 0) {
							handleDeleteComment(item);
						}
					}
				}
			}
		}

		if (data.settings && data.settings.length) {
			var i = 0;
			var setting;

			for (i = 0; i < data.settings.length; i++) {
				setting = data.settings[i];

				if (setting.name === 'commentsEnabled') {
					handleCommentsEnabled(setting);
				}
			}
		}
	};





	function connect () {
		if (destroyed) {
			return;
		}

		var lastTime = new Date();
		var timeToWait = 0;
		var aborted = false;

		var lfStreamUrl = "http://"+ envConfig.get().livefyre.networkName +".stream1.fyre.co/v3.0/collection/"+ collectionId +"/"+ lastEventId +"/";

		var backupRestart = setTimeout(function () {
			aborted = true;

			logger.debug('oCommentApi', 'stream', 'backup restart');
			restartConnection({
				force: true
			});
		}, 30000);

		var restartConnection = function (options) {
			options = options || {};

			logger.debug('oCommentApi', 'stream', 'restart');
			clearTimeout(backupRestart);

			if (!aborted || options.force === true) {
				aborted = true;

				timeToWait = 10000 - (new Date() - lastTime);

				setTimeout(function () {
					if (options.report === true) {
						events.emit('streamingEvent', {
							eventType: 'info',
							message: 'connection restored'
						});
					}

					connect();
				}, (timeToWait < 0 ? 0 : timeToWait));
			}
			return;
		};

		try {
			request.get(lfStreamUrl, {
				success: function (response) {
					try {
						if (response.timeout === true) {
							logger.debug('oCommentApi', 'stream', 'success, timeout');
							restartConnection();
							return;
						}

						if (response.data) {
							handleResponseData(response.data);
						}

						if (!aborted) {
							clearTimeout(backupRestart);

							lastEventId = response.data && response.data.maxEventId ? response.data.maxEventId : lastEventId;
							setTimeout(function () {
								logger.debug('oCommentApi', 'stream', 'success, new call');
								connect();
							}, 0);
						}
					} catch (e) {
						events.emit('streamingEvent', {
							eventType: 'error',
							message: 'connection dropped',
							error: e
						});
						logger.debug('oCommentApi', 'stream', 'exception', e);

						restartConnection({
							report: true
						});
					}
				},
				error: function (err) {
					events.emit('streamingEvent', {
						eventType: 'error',
						message: 'connection dropped',
						error: err
					});
					logger.debug('oCommentApi', 'stream', 'error', err);

					restartConnection({
						report: true
					});
				},
				timeout: function () {
					logger.debug('oCommentApi', 'stream', 'timeout');
					restartConnection();
				}
			});
		} catch (e) {
			events.emit('streamingEvent', {
				eventType: 'error',
				message: 'connection dropped',
				error: e
			});
			logger.debug('oCommentApi', 'stream', 'exception', e);

			restartConnection({
				report: true
			});
		}
	}


	this.addCallback = function (callback) {
		if (callback && typeof callback === 'function') {
			callbacks.push(callback);
		}
	};

	this.removeCallback = function (callback) {
		if (callback && typeof callback === 'function' && callbacks.indexOf(callback) !== -1) {
			callbacks.splice(callbacks.indexOf(callback), 1);
		}

		if (callbacks.length === 0) {
			this.destroy();
		}
	};

	this.setLastEventId = function (eventId) {
		lastEventId = eventId;
	};

	this.init = function () {
		if (!initialized && !destroyed && (typeof lastEventId !== 'undefined') && (typeof collectionId !== 'undefined') && callbacks.length) {
			initialized = true;
			connect();

			return true;
		} else {
			return false;
		}
	};

	this.destroy = function () {
		callbacks = null;
		lastEventId = null;

		if (streamsForCollectionId.indexOf(collectionId) !== -1) {
			streamsForCollectionId.splice(streamsForCollectionId.indexOf(collectionId), 1);
		}

		destroyed = true;
	};
}


var streamsForCollectionId = {};

function create (collectionId, configOrCallback) {
	var callback;
	var lastEventId = 0;

	if (!collectionId) {
		return;
	}

	if (typeof configOrCallback === 'function') {
		callback = configOrCallback;
	} else {
		if (typeof configOrCallback !== 'object') {
			return false;
		}

		if (typeof configOrCallback.callback !== 'function') {
			return false;
		} else {
			callback = configOrCallback.callback;
		}

		if (configOrCallback.lastEventId) {
			lastEventId = configOrCallback.lastEventId;
		}
	}

	if (streamsForCollectionId[collectionId]) {
		streamsForCollectionId[collectionId].addCallback(callback);

		return true;
	} else {
		streamsForCollectionId[collectionId] = new Stream(collectionId, {
			lastEventId: lastEventId,
			callback: callback
		});
		streamsForCollectionId[collectionId].init();

		return true;
	}
}

function destroy (collectionId, configOrCallback) {
	var callback;

	if (!collectionId) {
		return;
	}

	if (typeof configOrCallback === 'function') {
		callback = configOrCallback;
	} else {
		if (typeof configOrCallback.callback === 'function') {
			callback = configOrCallback.callback;
		}
	}

	if (streamsForCollectionId[collectionId]) {
		if (callback) {
			streamsForCollectionId[collectionId].removeCallback(callback);
		} else {
			streamsForCollectionId[collectionId].destroy();
		}
	}
}

module.exports = {
	create: create,
	destroy: destroy
};
