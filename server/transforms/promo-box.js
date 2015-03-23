'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	var $el = $(el);
	var $promoBox = $('<div></div')
		.addClass('article__promobox ng-pull-out ng-inline-element');
	var $title = $('<h3></h3>')
		.addClass('article__promobox__title')
		.text($el.find('promo-title').text());
	var image = $el.find('promo-image')
		.html();
	var content = $el.find('promo-intro').html();

	return $promoBox
		.append($title)
		.append(image)
		.append(content);
};
