'use strict';

var $ = require('cheerio');
var resize = require('../utils/resize');
var api = require('next-ft-api-client');
var logger = require('ft-next-logger').logger;
var capiMapiRegex = require('../utils/capi-mapi-regex').content;

module.exports = function($body, opts) {

	var $images = $body('picture[data-image-set-id]');

	var imageSetPromises = $images
		.map(function (index, img) {
			const uuid = $(img).attr('data-image-set-id');
			return api.content({ uuid, type: 'ImageSet', retry: 0 })
				.catch(function(error) {
					logger.error(`Failed getting image '${uuid}'`, error);
					return null;
				});
		})
		.get();

	// get the image sets
	return Promise.all(imageSetPromises)
		.then(function(imageSets) {
			imageSets.forEach(function(imageSet, i) {
				if (!imageSet) {
					return;
				}

				var sources = $images.eq(i).find('source');

				sources.each(function(index, source) {
					var width = $(source).attr('data-image-size');
					$(source).attr('srcset', resize('ftcms:' + imageSet.members[0].id.replace(capiMapiRegex, ''), { width: width }));
				});

				var fallbackType = $images.eq(i).find('img').attr('data-image-type');
				$images.eq(i).find('img').attr(fallbackType, resize('ftcms:' + imageSet.members[0].id.replace(capiMapiRegex, ''), { width: $images.eq(i).find('img').attr('data-image-size') }));

				if ($images.eq(i).parent().filter('figure').length > 0 && imageSet.title) {
					$images.eq(i).after(
						'<figcaption class="article__image-caption ng-meta">' +
							imageSet.title +
						'</figcaption>'
					);
				}
			});

			return $body;
		});
};
