'use strict';

var $ = require('cheerio');
var resize = require('../utils/resize');
var fetchCapiV2 = require('../utils/fetch-capi-v2');

module.exports = function($body, flags) {

	var imageSetSelector = 'ft-content[type$="ImageSet"]';
	var imageSetPromises = $body(imageSetSelector)
		.map(function (index, el) {
			return fetchCapiV2({ uuid: $(el).attr('url').replace('http://api.ft.com/content/', '') })
				.catch(function(error) {
					console.warn(error);
					return {};
				});
		})
		.get();

	// get the image sets
	return Promise.all(imageSetPromises)
		.then(function (imageSets) {
			$body(imageSetSelector).replaceWith(function (index, image) {
				// get the image set data
				var $image = $(image);
				var id = $image.attr('url').replace('http://api.ft.com/content/', '');
				var imageSet;
				imageSets.some(function (set) {
					if (set.id && set.id.replace('http://www.ft.com/thing/', '') === id) {
						imageSet = set;
						return true;
					} else {
						return false;
					}
				});
				if (!imageSet) {
					return '';
				}
				var isMain =
					flags && flags.fullWidthMainImages && flags.fullWidthMainImages.isSwitchedOn &&
					image.parentNode.tagName === 'root' &&
					$(image.parentNode).children().first().html() === $image.html();
				var width = isMain ? 690 : 470;
				var binaryId = imageSet.members[0].id.replace('http://api.ft.com/content/', '');
				var imageUrl = 'http://com.ft.imagepublish.prod.s3.amazonaws.com/' + binaryId;
				var resizedUrl1x = resize(imageUrl, { width: width });
				var resizedUrl2x = resize(imageUrl, { width: width, dpr: 2 });
				var $figure = $('<figure></figure>')
					.addClass('article__image-wrapper ng-figure-reset');

				if (!$image.parent().hasClass('article__promo-box')) {
					if (!isMain) {
						$figure.addClass('article__inline-image ng-pull-out ng-inline-element');
					} else {
						$figure.addClass('article__main-image');
					}
				} else {
					$figure.addClass('article__promo-box__image');
				}

				if (imageSet.title) {
					var $figcaption = $('<figcaption></figcaption>')
						.addClass('article__image-caption ng-meta')
						.text(imageSet.title);

					$figure.append($figcaption);
				}
				return $figure.prepend('<img class="article__image" src="' + resizedUrl1x + '" srcset="' + resizedUrl1x + ' 1x, ' + resizedUrl2x + ' 2x" alt=""/>');
			});

			return $body;
		});
};
