"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	var $el = $(el);

	// If the contents of the slideshow a link is not empty, abort and don't promote to slideshow
	if ($el.html() !== '') {
		return $el;
	}

	var uuid = $el.attr('href').replace(/.*([a-zA-Z0-9-]{36}).*/, '$1');
	var slideshow = '<ft-slideshow data-uuid="' + uuid + '"></ft-slideshow>';

	// NOTE - can be removed once the slideshow is moved out of p's upstream
	if ($el.parent('p').length) {
		$el.parent().before(slideshow);
		return '';
	} else {
		return slideshow;
	}
};
