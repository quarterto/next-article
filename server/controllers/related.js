'use strict';

var api = require('next-ft-api-client');

module.exports = function(req, res, next) {
	if (!res.locals.flags.articleRelated || res.locals.flags.articleRelated.isSwitchedOff) {
		return res.status(404).end();
	}
	var taxonomy = req.params.taxonomy;

	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
	})
		.then(function (article) {
			var relations = article.item.metadata[taxonomy];
			if (!relations.length) {
				throw new Error('No related');
			}
			var promises = relations.map(function (item) {
				return api.mapping(item.term.id, taxonomy)
					.catch(function(err) {
						return null;
					});
			});
			return Promise.all(promises)
				.then(function (results) {
					// awkwardly need to get the v1 name of the relation for linking to
					var items = results.map(function (item, index) {
							if (!item) {
								return {};
							}
							return {
								name: item.prefLabel || item.labels[0],
								v1Name: relations[index].term.name,
								profile: item.profile ? item.profile.replace(/\\n\\n/g, '</p><p>') : ''
							};
						})
						.filter(function (item) {
							return item;
						});
					if (!items.length) {
						throw new Error('No related');
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
