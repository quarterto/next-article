'use strict';

var $ = require('cheerio');
var resize = require('../utils/resize');

module.exports = function(opts) {
	return function(index, el) {
		var $el = $(el).clone();
		var isMain = false;
		if (opts && opts.fullWidthMainImages && el.parentNode) {
			if (el.parentNode.tagName === 'a' && el.parentNode.parentNode.tagName === 'body'
				&& $(el.parentNode.parentNode).children().first().html() === $(el.parentNode).html()) {
				isMain = true;
			} else if (el.parentNode.tagName === 'body' && $(el.parentNode).children().first().html() === $el.html()) {
				isMain = true;
			}
		}
		$el.removeAttr('height');
		$el.removeAttr('width');
		$el.attr('src', resize($el.attr('src'), { width: 710 }));

		console.log("is Main", isMain);
		var classes = 'article__image-wrapper ng-figure-reset ';
		if (isMain) {
			classes += 'article__main-image';
		} else {
			classes += 'article__inline-image ng-inline-element ng-pull-out';
		}

		return $('<figure></figure>')
			.addClass(classes)
			.append($el.addClass('article__image'));
	};
};
