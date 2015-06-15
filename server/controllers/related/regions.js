'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var excludePrimaryTheme = require('../../utils/exclude-primary-theme');

module.exports = function(req, res, next) {
	if (!res.locals.flags.articleRelatedContent) {
		return res.status(404).end();
	}

	if (res.locals.flags.mentionsV2) {
		// regions not supportd in v2 yet
		res.status(200).end();
	} else {
		api.contentLegacy({
			uuid: req.params.id,
			useElasticSearch: res.locals.flags.elasticSearchItemGet
		})
			.then(function (article) {
				res.set(cacheControl);
				var regions = article.item.metadata.regions.filter(excludePrimaryTheme(article));

				if (!regions.length) {
					throw new Error('No related');
				}

				res.render('related/regions', {
					regions: regions.map(function (region, index) {
						region = region.term;
						var model = {
							name: region.name,
							url: '/stream/regionsId/' + region.id,
							conceptId: res.locals.flags.userPrefsUseConceptId ? region.id : ('regions:' + ['"', encodeURIComponent(region.name), '"'].join('')),
							taxonomy: 'regions'
						};

						return model;
					})
				});
			})
			.catch(function (err) {
				if (err.message === 'No related') {
					res.status(200).end();
				} else if (err instanceof fetchres.BadServerResponseError) {
					res.status(404).end();
				} else {
					next(err);
				}
			});
	}
};
