"use strict";

var resize = require('../utils/resize');
var $ = require('cheerio');

module.exports = function(index, el) {
	var $el = $(el);
	var id = $el.attr('url').replace('http://api.ft.com/content/', '');
	var type = $el.attr('type');

	switch (type) {
		case 'http://www.ft.com/ontology/content/ImageSet':
			var isMain = el.parentNode.tagName === 'body' && $(el.parentNode).children().first().html() === $el.html();
			var width = isMain ? 470 : 300;
			var resizedUrl1x = resize({ width: width, url: 'http://ft-next-grumman-v002.herokuapp.com/embedded-components/image/' + id });
			var resizedUrl2x = resize({ width: width * 2, url: 'http://ft-next-grumman-v002.herokuapp.com/embedded-components/image/' + id });
			var $figure = $('<figure></figure>')
				.addClass('article__image-wrapper ng-pull-out ng-inline-element')
				.attr('data-capi-id', id);

			if (isMain) {
				$figure.addClass('article__main-image')
			} else {
				$figure.addClass('article__inline-image')
			}
			return $figure.append('<img class="article__image" src="' + resizedUrl1x + '" srcset="' + resizedUrl1x + ' 1x, ' + resizedUrl2x + ' 2x"/>');
		case 'http://www.ft.com/ontology/content/Article':
			return '<a href="/' + id + '">' + $el.html() + '</a>';
		default:
			return '';
	}
};
