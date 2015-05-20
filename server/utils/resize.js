// TODO: Combine with the equivalent in ft-next-express
'use strict';

var merge = require('merge');
var querystring = require('querystring');

module.exports = function(url, options) {
	var defaultOptions = {
		source: 'next',
		fit: 'scale-down'
	};
	var query = querystring.stringify(merge(defaultOptions, options));

	return 'https://next-geebee.ft.com/image/v1/images/raw/' + encodeURIComponent(url) + '?' + query;
};
