'use strict';

var $ = require('cheerio');
var resize = require('../utils/resize');
var api = require('next-ft-api-client');

module.exports = function($body, flags) {

	var imageSetSelector = 'ft-content[type$="ImageSet"]';
	var imageSetPromises = $body(imageSetSelector)
		.map(function (index, el) {
			return api.content({ uuid: $(el).attr('url').replace('http://api.ft.com/content/', ''), type: 'ImageSet' })
				.catch(function(error) {
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
				var width = isMain ? 710 : 600;
				var binaryId = imageSet.members[0].id.replace('http://api.ft.com/content/', '');
				var imageUrl = resize('http://com.ft.imagepublish.prod.s3.amazonaws.com/' + binaryId, { width: width });
				var $figure = $('<figure></figure>')
					.addClass('article__image-wrapper ng-figure-reset');

				if (!$image.parent().hasClass('article__promo-box')) {
					if (!isMain) {
						$figure.addClass('article__inline-image ng-pull-out ng-inline-element');
					} else {
						$figure.addClass('article__main-image ng-media-wrapper');
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
				var $image = $('<img></img')
					.addClass('article__image')
					.attr('src', imageUrl)
					.attr('alt', '');
				if (isMain) {
					$image.addClass('ng-media');
				}
				$figure.prepend($image);
				if ($image.parent('p').length) {
					$image.parent('p').before($figure);
					return '';
				} else {
					return $figure;
				}
			});

			return $body;
		});
};
