"use strict";

var param = require('./param.js'),
	scriptLoader = require('../scriptLoader/scriptLoader.js');

var callbackIndex = 0,
	callbackBase = 'jsonp_' + Math.random().toString(36).substring(7);

/**
 * The actual function which does the jsonp.
 * @param  {object}   options  Several configuration options (e.g. url, data)
 * @param  {Function} callback function (err, data)
 */
function jsonp (options, callback) {
	var callbackName, callbackIssued, callbackCalled,
		success, error;

	/**
	 * Parameter validation.
	 */
	if (typeof callback !== 'function') {
		throw "Callback not specified";
	}

	if (typeof options !== 'object') {
		callback(new Error("Configuration not specified or has the wrong type."));
		return;
	}

	if (!options.url) {
		callback(new Error("URL is not specified"));
		return;
	}


	callbackIssued = false;
	callbackCalled = false;

	success = function (jsonData) {
		try {
			delete window[callbackName];
		} catch (e1) {
			window[callbackName] = undefined;
		}

		if (!callbackIssued) {
			callbackIssued = true;

			callback(null, jsonData);
		}
	};

	error = function (e) {
		try {
			delete window[callbackName];
		} catch (e2) {
			window[callbackName] = undefined;
		}

		if (!callbackIssued) {
			callbackIssued = true;

			callback(e || new Error("Timeout"));
		}
	};

	callbackName = callbackBase + callbackIndex++;

	if (options.data) {
		options.url += '?' + param(options.data);

		options.url += '&callback=' + callbackName;
	} else {
		options.url += '?callback=' + callbackName;
	}

	options.url += '&_=' + new Date().getTime();

	window[callbackName] = function (jsonData) {
		callbackCalled = true;

		success(jsonData);
	};

	scriptLoader(options, function (err) {
		if (err) {
			error(err);
			return;
		}

		setTimeout(function () {
			if (!callbackCalled) {
				error();
			}
		}, 50);
	});
}

module.exports = jsonp;
