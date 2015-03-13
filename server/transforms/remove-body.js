'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	return $(el).children();
};
