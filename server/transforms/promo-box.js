'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	var $el = $(el);
	var $promoBox = $('<div></div')
		.addClass('article__promo-box ng-pull-out ng-inline-element');
	var $promoBoxTitle = $el.find('promo-title');
	var $promoBoxHeadline = $el.find('promo-headline');
	var $promoBoxImage = $el.find('promo-image');
	var $promoBoxIntro = $el.find('promo-intro');

	if ($promoBoxTitle.length) {
		$promoBox.append(
			$('<h3></h3>')
				.addClass('article__promo-box__title')
				.text($promoBoxTitle.text())
		);
	}
	if ($promoBoxHeadline.length) {
		$promoBox.append(
			$('<h4></h4>')
				.addClass('article__promo-box__headline')
				.html($promoBoxHeadline.html())
		);
	}
	if ($promoBoxImage.length) {
		$promoBox.append(
			$promoBoxImage.html()
		);
	}
	if ($promoBoxIntro.length) {
		$promoBox.append(
			$('<div></div')
				.addClass('article__promo-box__content')
				.html($promoBoxIntro.html())
		);
	}

	return $promoBox;
};
