"use strict";

/**
 * Is storage supported?
 * @type {Boolean}
 */
var storageOk = false;
if (typeof Storage !== "undefined") {
	try {
		localStorage.setItem('test', 2);
		localStorage.removeItem('test', 2);

		storageOk = true;
	} catch (e) {}
}

var StorageWrapper = null;

if (storageOk) {
	/**
	 *
	 * This is a generic wrapper around storage (either localStorage or sessionStorage) which helps
	 * storing multiple types of values (not just strings).
	 *
	 * @param {string} type Type of the storage to be used. Possible values:
	 * - local or localStorage
	 * - session or sessionStorage
	 */
	StorageWrapper = function (type) {
		var storageObj;

		if (type === 'local' || type === 'localStorage') {
			storageObj = localStorage;
		} else if (type === 'session' || type === 'sessionStorage') {
			storageObj = sessionStorage;
		} else {
			throw "Not valid storage type selected";
		}

		/**
		 * Sets an item.
		 * @param {string} key The key of the entry.
		 * @param {string|boolean|date|number|array|object} value Value which will be stored. The value is serialized when storing the object.
		 */
		this.setItem = function (key, value) {
			var realValue, type;
			switch (typeof value) {
				case "string":
				case "boolean":
					realValue = value;
					break;
				case "number":
					if (parseFloat(value) === parseInt(value, 10)) {
						type = "int";
					} else {
						type = "float";
					}

					realValue = value.toString();
					break;
				case "array":
				case "object":
					if (value instanceof Date) {
						type = "date";
						realValue = value.getTime();
					} else {
						try {
							realValue = JSON.stringify(value);
							type = "json";
						} catch (e) {
							realValue = value.toString();
							type = "object";
						}
					}

					break;
				default:
					type = "unknown";
					realValue = value;
			}
			realValue = ((typeof type !== "undefined") ? type : (typeof value)) + "|" + realValue;

			storageObj.setItem(key, realValue);
		};

		/**
		 * Reads the item stored with the key. The stored value is unserialized.
		 * @param  {string} key The key of the entry
		 * @return {string|boolean|date|number|array|object} Unserialized value
		 */
		this.getItem = function (key) {
			var value = storageObj.getItem(key);
			if (value) {
				var type = value.substr(0, value.indexOf("|"));

				value = value.substr(value.indexOf("|") + 1);

				switch (type) {
					case "string":
						return value;
					case "boolean":
						if (value === "true") {
							return true;
						} else if (value === "false") {
							return false;
						}

						return undefined;
					case "date":
						return new Date(value);
					case "int":
						return parseInt(value, 10);
					case "float":
						return parseFloat(value);
					case "json":
						return JSON.parse(value);
					case "object":
						return value;
					default:
						return value;
				}
			}

			return undefined;
		};

		/**
		 * Checks if there's an entry for the key.
		 * @param  {string}  key The key of the entry.
		 * @return {Boolean}
		 */
		this.hasItem = function (key) {
			return !!storageObj.getItem(key);
		};

		/**
		 * Removes the entry that is stored with the key.
		 * @param  {string}  key The key of the entry.
		 */
		this.removeItem = function (key) {
			storageObj.removeItem(key);
		};

		/**
		 * Clears all entries.
		 */
		this.clear = function () {
			storageObj.clear();
		};

		/**
		 * Returns the native storage object.
		 * @return {sessionStorage|localStorage}
		 */
		this.native = storageObj;


		this.destroy = function () {

		};
	};

/**
 * API for browsers which don't support Storage.
 * It exposes the same API but it does nothing.
 */
} else {
	StorageWrapper = function () {
		this.setItem = function () {
			return false;
		};
		this.getItem = function () {
			return undefined;
		};
		this.hasItem = function () {
			return false;
		};
		this.removeItem = function () {
			return false;
		};
		this.clear = function () {
			return false;
		};
		this.native = undefined;

		this.destroy = function () {

		};
	};
}
module.exports = StorageWrapper;
