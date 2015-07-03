'use strict';

var cheerio = require('cheerio');

module.exports = function ($) {
	$('promo-box').replaceWith(function(index, el) {
		var $el = cheerio(el);
		var $promoBox = $('<aside></aside')
			.attr({'data-trackable':'promobox', role:'complementary'})
			.addClass('article__promo-box ng-pull-out ng-inline-element');
		var $promoBoxTitle = $el.find('promo-title');
		var $promoBoxHeadline = $el.find('promo-headline');
		var $promoBoxImage = $el.find('promo-image');
		var $promoBoxIntro = $el.find('promo-intro');

		if ($promoBoxTitle.length) {
			// get inner html (without wrapped p)
			var $promoBoxTitleChild = $promoBoxTitle.children('p');
			$promoBox.append(
				$('<h3></h3>')
					.addClass('article__promo-box__title')
					.html($promoBoxTitleChild.length ? $promoBoxTitleChild.html() : $promoBoxTitle.html())
			);
		}
		if ($promoBoxHeadline.length) {
			// get inner html (without wrapped p)
			var $promoBoxHeadlineChild = $promoBoxHeadline.children('p');
			$promoBox.append(
				$('<h4></h4>')
					.addClass('article__promo-box__headline')
					.html($promoBoxHeadlineChild.length ? $promoBoxHeadlineChild.html() : $promoBoxHeadline.html())
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
	});

	return $;
};
