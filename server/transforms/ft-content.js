/*jshint laxbreak:true*/
"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	var text = el.html();
	var url = el.attr('url');
	var type = el.attr('type');
	url = url.replace('http://api.ft.com/content/', '/');

	switch (type) {
		case 'http://www.ft.com/ontology/content/ImageSet':
			return '<img src="/embedded-components/image' + url + '"/ >';
		case 'http://www.ft.com/ontology/content/Article':
			return '<a href="' + url + '">' + text + '</a>';
		default:
			return '';
	}
};
