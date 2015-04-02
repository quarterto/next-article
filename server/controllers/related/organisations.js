'use strict';

var api = require('next-ft-api-client');

module.exports = function(req, res, next) {
	if (!res.locals.flags.articleRelated || res.locals.flags.articleRelated.isSwitchedOff) {
		return res.status(404).end();
	}

	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
	})
		.then(function (article) {
			var relations = article.item.metadata.organisations;
			if (!relations.length) {
				throw new Error('No related');
			}
			var promises = relations.map(function (item) {
				return api.mapping(item.term.id, 'organisations')
					.catch(function(err) {
						return null;
					});
			});
			return Promise.all(promises)
				.then(function (results) {
					var organisations = results.map(function (result, index) {
							if (!result) {
								return null;
							}
							var relation = relations[index].term;
							var organisationModel = {
								name: result.prefLabel || result.labels[0],
								v1Name: relation.name
							};
							// get the stock id
							relation.attributes.some(function (attribute) {
								if (attribute.key === 'wsod_key') {
									return organisationModel.tickerSymbol = attribute.value;
								}
								return false;
							});

							return organisationModel;
						})
						.filter(function (organisation) {
							return organisation;
						});
					if (!organisations.length) {
						throw new Error('No related');
					}
					res.render('related/organisations', {
						organisations: organisations
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
