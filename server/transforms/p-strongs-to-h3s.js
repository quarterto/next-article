'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	var $el = $(el);

	if ($el.html().match(/\s*<strong>([^<]+?)<\/strong>\s*/)) {
		return '<h3 class="ft-subhead">' + $el.text() + '</h3>';
	} else {
		return '<p>' + $el.html() + '</p>';
	}
};
