'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	var $el = $(el);
	var $promoBox = $('<div></div')
		.addClass('article__promo-box ng-pull-out ng-inline-element');
	var $title = $('<h3></h3>')
		.addClass('article__promo-box__title')
		.text($el.find('promo-title').text());
	var image = $el.find('promo-image')
		.html();
	var content = $el.find('promo-intro').html();

	$promoBox.append($title);

	if ($el.find('promo-headline').length) {
		var $headline = $('<h4></h4>')
			.addClass('article__promo-box__headline')
			.html($el.find('promo-headline p').html().trim());

		$promoBox.append($headline);
	}

	return $promoBox
		.append(image)
		.append(content);
};
