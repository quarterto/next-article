'use strict';

var $ = require('cheerio');
var resize = require('../utils/resize');
var api = require('next-ft-api-client');
var logger = require('ft-next-logger');
var capiMapiRegex = require('../utils/capi-mapi-regex').content;

module.exports = function($body, opts) {

	var imageSetPromises = $body('img[data-image-set-id]')
		.map(function (index, img) {
			return api.content({ uuid: $(img).attr('data-image-set-id'), type: 'ImageSet' })
				.catch(function(error) {
					logger.error(error);
					return null;
				});
		})
		.get();

	// get the image sets
	return Promise.all(imageSetPromises)
		.then(function (imageSets) {
			imageSets.forEach(function (imageSet) {
				if (!imageSet) {
					return;
				}
				var imgSrc = resize('ftcms:' + imageSet.members[0].id.replace(capiMapiRegex, ''), { width: 710 });
				var $img = $body('img[data-image-set-id="' + imageSet.id.replace('http://www.ft.com/thing/', '') + '"]')
					.attr('src', imgSrc);

				if (imageSet.title) {
					var $figcaption = $('<figcaption></figcaption>')
						.addClass('article__image-caption ng-meta')
						.text(imageSet.title);
					$img.after($figcaption);
				}
			});

			return $body;
		});
};
