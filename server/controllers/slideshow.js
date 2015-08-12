'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');

module.exports = function(req, res, next) {

	// E.g. 4eb77dd4-9b35-11e4-be20-002128161462
	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function(data) {
			if (data.item && data.item && data.item.assets && data.item.assets[0] && data.item.assets[0].type === 'slideshow') {
				res.render('slideshow', {
					title: data.item.assets[0].fields.title,
					syncid: req.query.syncid,
					slides: data.item.assets[0].fields.slides
				});
			} else {
				res.status(404).end();
			}
		})
		.catch(function(err) {
			if (fetchres.originatedError(err)) {
				res.status(404).end();
			} else {
				throw err;
			}
		})
		.catch(next);

};
