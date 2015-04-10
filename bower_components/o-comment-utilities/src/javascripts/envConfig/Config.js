"use strict";

var merge = require('../merge/merge.js');

/**
 * Config class which can be instantiated. It will create an isolated set of configuration options.
 * It can be extended and read.
 */
function Config () {
	/**
	 * Local object of the configuration.
	 * @type {Object}
	 */
	var config = {};

	/**
	 * Read the current configuration or a configuration entry
	 * @param  {string}   param    Optional. Entry key of the configuration object. If specified, only the value of the entry is returned.
	 * @return {string|object}     Either the value of the key specified or the whole object.
	 */
	this.get = function (param) {
		if (param) {
			if (typeof config[param] !== 'undefined') {
				return config[param];
			} else {
				return undefined;
			}
		} else {
			return config;
		}
	};

	/**
	 * Extends the current configuration.
	 * @param {string|object}  keyOrObject   If a key is specified, then the next parameter (value)
	 *                                       will be merged into the current config object. If an object is specified,
	 *                                       then the object will be merged into the current config object.
	 * @param {[type]}         value         If a key is specified, the value should also be specified and will be merged
	 *                                       into the corresponding value of the current object's key's value.
	 */
	this.set = function (keyOrObject, value) {
		if (typeof keyOrObject === 'string') {
			if (typeof value !== 'undefined') {
				var obj = {};
				obj[keyOrObject] = value;

				config = merge(config, obj);
			}
		} else if (typeof keyOrObject === 'object') {
			config = merge(config, keyOrObject);
		}
	};

	this.destroy = function () {
		config = null;
	};
}
module.exports = Config;
