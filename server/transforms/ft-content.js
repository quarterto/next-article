"use strict";

var $ = require('cheerio');
module.exports = function(index, originEl) {
	var el = $(originEl);
	var text = el.html();
	var url = el.attr('url');
	var type = el.attr('type');
	url = url.replace('http://api.ft.com/content/', '/');

	switch (type) {
		case 'http://www.ft.com/ontology/content/ImageSet':
			if (originEl.parentNode.tagName === 'body' && $(originEl.parentNode).children().first().html() === el.html()) {
				return '<img class="article__main-image" src="/embedded-components/image' + url + '"/ >';
			}
			return '<img class="article__inline-image ng-inline-element ng-pull-out" src="/embedded-components/image' + url + '"/ >';
		case 'http://www.ft.com/ontology/content/Article':
			return '<a href="' + url + '">' + text + '</a>';
		default:
			return '';
	}
};
