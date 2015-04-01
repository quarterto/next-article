'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');

module.exports = function(req, res, next) {
	var taxonomy = req.params.taxonomy;

	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
	})
		.then(function (article) {
			var promises = article.item.metadata[taxonomy].map(function (item) {
				return api.mapping(item.term.id, taxonomy)
					.catch(function(err) {
						if (err.message === 'Mapping doesn‘t exist') {
							return null;
						} else if (err instanceof fetchres.BadServerResponseError) {
							throw new Error('404');
						} else {
							next(err);
						}
					});
			});
			if (!promises.length) {
				throw new Error('No related')
			}
			return Promise.all(promises)
				.then(function (results) {
					var items = results.filter(function (item) {
						return item;
					}).map(function (item) {
						return {
							name: item.prefLabel || item.labels[0],
							profile: item.profile ? item.profile.replace(/\\n\\n/g, '</p><p>') : ''
						};
					});
					if (!items.length) {
						throw new Error('No related')
					}
					res.render('related/' + taxonomy, {
						items: items
					});
				});

		})
		.catch(function (err) {
			if (err.message === 'No related') {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
