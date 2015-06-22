'use strict';

var cheerio = require('cheerio');

module.exports = function ($) {
	$('body').replaceWith(function(index, el) {
		return cheerio(el).children();
	});

	return $;
};
