"use strict";

var resize = require('../utils/resize');
var $ = require('cheerio');

module.exports = function(index, originEl) {
	var el = $(originEl);
	var text = el.html();
	var url = el.attr('url');
	var type = el.attr('type');
	url = url.replace('http://api.ft.com/content/', '/');

	switch (type) {
		case 'http://www.ft.com/ontology/content/ImageSet':
			var resizedUrl1x;
			var resizedUrl2x;
			if (originEl.parentNode.tagName === 'body' && $(originEl.parentNode).children().first().html() === el.html()) {
				resizedUrl1x = resize({ width: 470, url: 'http://ft-next-grumman-v002.herokuapp.com/embedded-components/image' + url });
				resizedUrl2x = resize({ width: 940, url: 'http://ft-next-grumman-v002.herokuapp.com/embedded-components/image' + url });
				return '<img class="article__main-image ng-pull-out ng-inline-element" src="' + resizedUrl1x + '" srcset="' + resizedUrl1x + ' 1x, ' + resizedUrl2x + ' 2x"/>';
			}
			resizedUrl1x = resize({ width: 300, url: 'http://ft-next-grumman-v002.herokuapp.com/embedded-components/image' + url });
			resizedUrl2x = resize({ width: 600, url: 'http://ft-next-grumman-v002.herokuapp.com/embedded-components/image' + url });
			return '<img class="article__inline-image ng-inline-element ng-pull-out" src="' + resizedUrl1x + '" srcset="' + resizedUrl1x + ' 1x, ' + resizedUrl2x + ' 2x" />';
		case 'http://www.ft.com/ontology/content/Article':
			return '<a href="' + url + '" data-trackable="link">' + text + '</a>';
		default:
			return '';
	}
};
