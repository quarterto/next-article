'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var extractUuid = require('../../utils/extract-uuid');

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
				var relations = article.item.metadata.topics;

				if (!relations.length) {
					throw new Error('No related');
				}

				var topics = relations.filter(function (topic) {
					// exclude primary theme and section
						return true;
					})
					.map(function (topic, index) {
						topic = topic.term;
						var model = {
							name: topic.name,
							url: '/stream/topicsId/' + topic.id,
							conceptId: 'topics:' + ['"', encodeURIComponent(topic.name), '"'].join(''),
							taxonomy: 'topics'
						};

						return model;
					});
					console.log(topics);
					if (!topics.length) {
						throw new Error('No related');
					}
					res.render('related/topics', {
						topics: topics
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
