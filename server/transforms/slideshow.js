"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	var $el = $(el);
	var uuid = $el.attr('href').replace(/.*([a-zA-Z0-9-]{36}).*/, '$1');
	var slideshow = '<ft-slideshow data-uuid="' + uuid + '"></ft-slideshow>';

	if ($el.parent('p').length) {
		$el.parent().before(slideshow);
		return '';
	} else {
		return slideshow;
	}
};
