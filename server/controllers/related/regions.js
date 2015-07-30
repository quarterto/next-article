'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var excludePrimaryTheme = require('../../utils/exclude-primary-theme');

module.exports = function(req, res, next) {
	if (!res.locals.flags.articleRelatedContent) {
		return res.status(404).end();
	}

	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function (article) {
			res.set(cacheControl);
			var metadata = article && article.item && article.item.metadata;
			var regions = metadata && metadata.regions.filter(excludePrimaryTheme(article));

			if (!regions || !regions.length) {
				throw new Error('No related');
			}

			res.render('related/regions', {
				regions: regions.map(function (region, index) {
					region = region.term;
					var model = {
						name: region.name,
						url: '/stream/regionsId/' + region.id,
						conceptId: region.id,
						taxonomy: 'regions'
					};

					return model;
				})
			});
		})
		.catch(function (err) {
			if (err.message === 'No related') {
				res.status(200).end();
			} else if (err instanceof fetchres.ReadTimeoutError) {
				res.status(500).end();
			} else if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
