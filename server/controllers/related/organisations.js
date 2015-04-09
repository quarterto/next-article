'use strict';

var fetchres = require('fetchres');
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
							var relation = relations[index].term;
							console.log(result);
							var organisationModel = {
								name: result && (result.prefLabel || (result.labels && result.labels[0])),
								v1Name: relation.name
							};
							// get the stock id
							relation.attributes.some(function (attribute) {
								if (attribute.key === 'wsod_key') {
									organisationModel.tickerSymbol = attribute.value;
									return true;
								}
								return false;
							});

							return organisationModel;
						})
						.filter(function (organisation) {
							return organisation;
						})
						// put orgs that can display stock data first
						.sort(function (org1, org2) {
							if (org1.tickerSymbol && !org1.tickerSymbol) {
								return -1;
							} else if (!org1.tickerSymbol && org2.tickerSymbol) {
								return 1;
							} else {
								return 0;
							}
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
				res.status(200).end();
			} else if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
