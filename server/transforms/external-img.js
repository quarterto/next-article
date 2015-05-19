'use strict';

var $ = require('cheerio');
var resize = require('../utils/resize');

module.exports = function(index, el) {
	var $el = $(el).clone();
	$el.removeAttr('height');
	$el.attr('src', resize($el.attr('src'), { width: 710 }));
	return $('<figure></figure>')
		.addClass('article__image-wrapper article__inline-image ng-inline-element ng-pull-out')
		.append($el.addClass('article__image'));
};
