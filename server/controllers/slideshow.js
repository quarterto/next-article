'use strict';

var fetchCapiV1 = require('../utils/fetch-capi-v1');
var fetchres = require('fetchres');

module.exports = function(req, res, next) {

	// E.g. 4eb77dd4-9b35-11e4-be20-002128161462
	fetchCapiV1({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
	})
		.then(function(data) {
			if (data.item && data.item && data.item.assets && data.item.assets[0] && data.item.assets[0].type === 'slideshow') {

				// When in INT the URLs to images don't work.  Hack for now.
				data.item.assets[0].fields.slides = data.item.assets[0].fields.slides.map(function(slide) {
					return slide;
				});

				// HACK - Disable the layout on slideshows
				data.item.assets[0].fields.layout = false;
				res.render('slideshow', data.item.assets[0].fields);
			} else {
				res.status(404).end();
			}
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				throw err;
			}
		})
		.catch(next);

};
