"use strict";

/**
 * Data object transformation into query string.
 * @param  {object} data Object to be transformed into a query string.
 * @return {string}      Query string.
 */
function param (data) {
	var dataArr = [],
		add = function( key, value ) {
			value = (typeof value === 'function') ? value() : ( value === null ? "" : value );

			dataArr[dataArr.length] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		},
		key;

	if (typeof data !== 'object') {
		throw "The argument is not an object.";
	}

	for (key in data) {
		if (data.hasOwnProperty(key)) {
			add(key, data[key]);
		}
	}

	// Return the resulting serialization
	return dataArr.join( "&" ).replace(/%20/g, "+");
}
module.exports = param;
