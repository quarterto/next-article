'use strict';

var cheerio = require('cheerio');

module.exports = function($) {
	$('img[src]').replaceWith(function(index, el) {
		var $el = cheerio(el).clone();
		var matcher = /^https:\/\/next-geebee.ft.com\/image\/v1\/images\/raw\/(.+)\?/;
		var externalURI = $el.attr('src').match(matcher);
		externalURI && $el.attr('src', $el.attr('src').replace(externalURI[1], encodeURIComponent(decodeURIComponent(externalURI[1]))));
		return $el;
	});
	return $;
};
