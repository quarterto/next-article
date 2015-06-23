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
		// topics not supportd in v2 yet
		res.status(200).end();
	} else {
		api.contentLegacy({
			uuid: req.params.id,
			useElasticSearch: res.locals.flags.elasticSearchItemGet
		})
			.then(function (article) {
				res.set(cacheControl);
				var topics = article.item.metadata.topics.filter(excludePrimaryTheme(article));

				if (!topics.length) {
					throw new Error('No related');
				}

				res.render('related/topics', {
					topics: topics.map(function (topic, index) {
						topic = topic.term;
						var model = {
							name: topic.name,
							url: '/stream/topicsId/' + topic.id,
							conceptId: res.locals.flags.userPrefsUseConceptId ? topic.id : ('topics:' + ['"', encodeURIComponent(topic.name), '"'].join('')),
							taxonomy: 'topics'
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
	}
};
