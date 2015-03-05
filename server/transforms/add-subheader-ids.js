'use strict';

var $ = require('cheerio');

module.exports = function(index, oldId) {
	return $(this).text().trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
};
