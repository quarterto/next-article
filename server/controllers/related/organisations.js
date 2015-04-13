'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');

function extractUuid(id) {
	return id.replace(/http:\/\/(api|www)\.ft\.com\/things\//, '');
}

module.exports = function(req, res, next) {
	if (!res.locals.flags.articleRelated || res.locals.flags.articleRelated.isSwitchedOff) {
		return res.status(404).end();
	}

	if (res.locals.flags.mentionsV2 && res.locals.flags.mentionsV2.isSwitchedOn) {
		api.content({
			uuid: req.params.id,
			type: 'Article',
			metadata: true
		})
			.then(function (article) {
				var mentions = article.mentions || [];
				var orgPromises = article.annotations
					.filter(function (annotation) {
						return annotation.predicate === 'http://www.ft.com/ontology/annotation/mentions' &&
							annotation.type === 'ORGANISATION';
					})
					.map(function (organisation) {
						console.log(extractUuid(organisation.uri));
						return api.organisations({
								uuid: extractUuid(organisation.uri)
							})
							.catch(function(err) {
								return null;
							});
					});
				if (!orgPromises.length) {
					throw new Error('No related');
				}
				return Promise.all(orgPromises);
			})
			.then(function (results) {
				var organisations = results
					.filter(function (organisation) {
						return organisation;
					})
					.map(function (organisation) {
						return {
							name: organisation && (organisation.prefLabel || (organisation.labels && organisation.labels[0])),
							url: '/organisations/' + extractUuid(organisation.id)
						};
					})
				if (!organisations.length) {
					throw new Error('No related');
				}
				res.render('related/organisations', {
					organisations: organisations
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
	} else {
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
								var organisationModel = {
									name: relation.name,
									url: '/stream/organisations/' + relation.name
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
	}
};
