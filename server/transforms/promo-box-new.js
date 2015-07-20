'use strict';

var cheerio = require('cheerio');

module.exports = function ($) {
	$('promo-box').replaceWith(function(index, el) {
		var $el = cheerio(el);
		var $promoBox = $('<aside></aside>')
			.attr({'data-trackable':'promobox', role:'complementary'})
			.addClass('promo-box ng-pull-out ng-inline-element');
		var $promoBoxTitle = $el.find('promo-title');
		var $promoBoxHeadline = $el.find('promo-headline');
		var $promoBoxImage = $el.find('promo-image');
		var $promoBoxIntro = $el.find('promo-intro');
		var longBoxWordBoundayNoImage = 35;
		var longBoxWordBoundaryImage = 80;
		var expanderParaBreakPoint = 2;
		var promoBoxLong = (function() {
			if (!$promoBoxIntro.length) {
				return;
			}
			if ($promoBoxIntro.html().split(' ').length > longBoxWordBoundaryImage && $promoBoxImage.length) {
				return true;
			}
			return $promoBoxIntro.html().split(' ').length > longBoxWordBoundayNoImage;
		})();
		var promoContentExpansion = promoBoxLong && ($promoBoxIntro.children().length > expanderParaBreakPoint);
		var $promoBoxIntroInitial = $('<div></div>')
			.addClass('promo-box__content__initial')
			.html($promoBoxIntro.children('p').filter(function(index, el) {
				if ((index < expanderParaBreakPoint) || !promoContentExpansion) { return el; }
		}));
		var $promoBoxIntroExtension = $('<div></div>')
			.addClass('promo-box__content__extension')
			.html($promoBoxIntro.children('p').filter(function(index, el) {
				if ((index >= expanderParaBreakPoint) && promoContentExpansion) { return el; }
		}));

		if (promoContentExpansion) {
			$promoBox
				.addClass('o-expander')
				.attr({
					'data-o-component': 'o-expander',
					'data-o-expander-shrink-to': '0',
					'data-o-expander-count-selector': '.promo-box__content__extension'
				});
		}

		if (promoBoxLong) {
			$promoBox.addClass('promo-box--long');
		}

		if ($promoBoxTitle.length) {
			// get inner html (without wrapped p)
			var $promoBoxTitleChild = $promoBoxTitle.children('p');
			$promoBox.append(
				$('<div></div>')
					.addClass('promo-box__title__wrapper')
					.append(
						$('<h3></h3>')
							.addClass('promo-box__title')
							.html($promoBoxTitleChild.length ? $promoBoxTitleChild.html() : $promoBoxTitle.html())
					)
			);
		} else {
			$promoBox.append(
				$('<div></div>')
					.addClass('promo-box__title__wrapper')
					.append(
						$('<h3>Related Content</h3>').addClass('promo-box__title')
					)
			);
		}

		if ($promoBoxHeadline.length) {
			// get inner html (without wrapped p)
			var $promoBoxHeadlineChild = $promoBoxHeadline.children('p');
			$promoBox.append(
				$('<h4></h4>')
					.addClass('promo-box__headline')
					.html($promoBoxHeadlineChild.length ? $promoBoxHeadlineChild.html() : $promoBoxHeadline.html())
			);
		}

		if ($promoBoxImage.length) {
			$promoBox.append(
				$promoBoxImage.html()
			);
			var imageClass = "promo-box__image";
			if (promoBoxLong) {
				imageClass += " promo-box--long__image";
			}
			$promoBox.find('img').addClass(imageClass);
		}

		if ($promoBoxIntro.length) {
			if (promoContentExpansion) {
				$promoBox.append(
					$('<div></div')
						.addClass('promo-box__content o-expander__content')
						.html($promoBoxIntroInitial + $promoBoxIntroExtension)
				);
				$promoBox.append(
					$('<button></button>')
						.addClass('o-expander__toggle o--if-js')
						.attr('data-trackable', 'expander-toggle')
				);
			} else {
				$promoBox.append(
					$('<div></div')
						.addClass('promo-box__content')
						.html($promoBoxIntroInitial)
				);
			}
		}

		return $promoBox;
	});

	return $;
};
