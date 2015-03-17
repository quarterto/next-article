"use strict";

var resize = require('../utils/resize');
var $ = require('cheerio');

module.exports = function(index, originEl) {
	var el = $(originEl);
	var url = el.attr('url');
	url = url.replace('http://api.ft.com/content/', '/');
	var type = el.attr('type');

	switch (type) {
		case 'http://www.ft.com/ontology/content/ImageSet':
			var isMain = originEl.parentNode.tagName === 'body' && $(originEl.parentNode).children().first().html() === el.html();
			var width = isMain ? 470 : 300;
			var resizedUrl1x = resize({ width: width, url: 'http://ft-next-grumman-v002.herokuapp.com/embedded-components/image' + url });
			var resizedUrl2x = resize({ width: width * 2, url: 'http://ft-next-grumman-v002.herokuapp.com/embedded-components/image' + url });
			var $figure = $('<figure></figure>')
				.addClass('ng-pull-out ng-inline-element');

			if (isMain) {
				$figure.addClass('article__main-image')
			} else {
				$figure.addClass('article__inline-image')
			}
			return $figure.append('<img class="article__image" src="' + resizedUrl1x + '" srcset="' + resizedUrl1x + ' 1x, ' + resizedUrl2x + ' 2x"/>');
		case 'http://www.ft.com/ontology/content/Article':
			return '<a href="' + url + '">' + el.html() + '</a>';
		default:
			return '';
	}
};
