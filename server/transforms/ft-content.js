"use strict";

var $ = require('cheerio');

module.exports = function(index, el) {
	var $el = $(el);
	var id = $el.attr('url').replace('http://api.ft.com/content/', '');
	var type = $el.attr('type');

	switch (type) {
		case 'http://www.ft.com/ontology/content/Article':
			return '<a href="/' + id + '">' + $el.html() + '</a>';
		default:
			return '';
	}
};
