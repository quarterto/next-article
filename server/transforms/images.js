'use strict';

var $ = require('cheerio');
var resize = require('../utils/resize');
var api = require('next-ft-api-client');
var logger = require('ft-next-logger');
var capiMapiRegex = require('../utils/capi-mapi-regex').content;

module.exports = function($body, opts) {

	var $images = $body('img[data-image-set-id]');

	var imageSetPromises = $images
		.map(function (index, img) {
			return api.content({ uuid: $(img).attr('data-image-set-id'), type: 'ImageSet', retry: 0 })
				.catch(function(error) {
					logger.error(error);
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

				var imgSrc = resize('ftcms:' + imageSet.members[0].id.replace(capiMapiRegex, ''), { width: 710 });
				var $img = $images.eq(i).attr('src', imgSrc);

				if ($img.parent().filter('figure').length > 0 && imageSet.title) {
					$img.after(
						'<figcaption class="article__image-caption ng-meta">' +
							imageSet.title +
						'</figcaption>'
					);
				}
			});

			return $body;
		});
};
