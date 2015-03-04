'use strict';

var $ = require('cheerio');

module.exports = function(index, oldId) {
	return $(this).text().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
};
