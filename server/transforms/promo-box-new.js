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
		var promoContentExpansion = $promoBoxIntro.children().length > 2;
<<<<<<< HEAD
		var promoBoxLong = ($promoBoxIntro.length &&
												(($promoBoxIntro.html().split(' ').length > 35 &&
												$promoBoxImage.length) ||
												$promoBoxIntro.html().split(' ').length > 80 ));
=======
		var promoBoxLong = ($promoBoxIntro.html().split(' ').length > 35 &&
			$promoBoxImage.length || $promoBoxIntro.html().split(' ').length > 80 );
>>>>>>> separate new promoboxes code out
		var $promoBoxIntroInitial = $('<div></div>')
			.addClass('promo-box__content__initial')
			.html($promoBoxIntro.children('p').filter(function(index, el) {
				if (index < 2) { return $(this); }
<<<<<<< HEAD
		}));
=======
				})
			);
>>>>>>> separate new promoboxes code out
		var $promoBoxIntroExtension = $('<div></div>')
			.addClass('promo-box__content__extension')
			.html($promoBoxIntro.children('p').filter(function(index, el) {
				if (index >= 2) { return el; }
<<<<<<< HEAD
		}));
=======
				})
			);
>>>>>>> separate new promoboxes code out

		if (promoContentExpansion) {
			$promoBox
				.addClass('o-expander')
				.attr({'data-o-component': 'o-expander',
					'data-o-expander-shrink-to': '0',
					'data-o-expander-count-selector': '.promo-box__content__extension'});
		}

		if (promoBoxLong) {
<<<<<<< HEAD
			$promoBox.addClass('promo-box--long');
=======
			$promoBox.addClass('promo-box__long');
>>>>>>> separate new promoboxes code out
		}

		if ($promoBoxTitle.length) {
			// get inner html (without wrapped p)
			var $promoBoxTitleChild = $promoBoxTitle.children('p');
			$promoBox.append(
				$('<div></div>')
					.addClass('promo-box__title__wrapper')
<<<<<<< HEAD
					.append(
						$('<h3></h3>')
							.addClass('promo-box__title')
							.html($promoBoxTitleChild.length ? $promoBoxTitleChild.html() : $promoBoxTitle.html())
					)
=======
						.append(
							$('<h3></h3>')
								.addClass('promo-box__title')
								.html($promoBoxTitleChild.length ? $promoBoxTitleChild.html() : $promoBoxTitle.html())
						)
>>>>>>> separate new promoboxes code out
			);
		} else {
			$promoBox.append(
				$('<div></div>')
					.addClass('promo-box__title__wrapper')
<<<<<<< HEAD
					.append(
						$('<h3>Related Content</h3>')
							.addClass('promo-box__title')
					)
=======
						.append(
							$('<h3>Related Content</h3>')
								.addClass('promo-box__title')
						)
>>>>>>> separate new promoboxes code out
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
		}

		if ($promoBoxIntro.length) {
			if (promoContentExpansion) {
				$promoBox.append(
					$('<div></div')
						.addClass('promo-box__content o-expander__content')
						.html($promoBoxIntroInitial + $promoBoxIntroExtension)
				);
				$promoBox.append(
					$('<button></button>').addClass('o-expander__toggle o--if-js')
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
