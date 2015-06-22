"use strict";

var cheerio = require('cheerio');
var capiMapiRegex = require('../utils/capi-mapi-regex').content;

module.exports = function ($, flags) {
	$('ft-content').not('[type$="ImageSet"]').replaceWith(function(index, el) {
		var $el = cheerio(el);
		var id = $el.attr('url').replace(capiMapiRegex, '');
		var type = $el.attr('type');

		switch (type) {
			case 'http://www.ft.com/ontology/content/Article':
				return '<a href="/' + id + '">' + $el.html() + '</a>';
			default:
				return '';
		}
	});

	return $;
};
