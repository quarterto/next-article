'use strict';

var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var extractUuid = require('../../utils/extract-uuid');
var excludePrimaryTheme = require('../../utils/exclude-primary-theme');
var tagsToFullV2Things = require('../../lib/tags-to-full-v2-things');

module.exports = function(req, res, next) {
	if (!res.locals.flags.articleRelatedContent) {
		return res.status(404).end();
	}

	if (res.locals.flags.capiV2PeopleOrganisationAnnotations) {
		api.content({
			uuid: req.params.id,
			type: 'Article',
			metadata: true,
			useElasticSearch: res.locals.flags.elasticSearchItemGet
		})
			.then(function (article) {
				res.set(cacheControl);
				var orgPromises = article.annotations
					.filter(function (annotation) {
						var type = annotation.directType.replace('http://www.ft.com/ontology/', '');
						return annotation.predicate === 'http://www.ft.com/ontology/annotation/mentions' &&
							['organisation/Organisation', 'company/PublicCompany'].indexOf(type ) > -1;
					})
					.map(function (organisation) {
						return api.organisations({
								uuid: extractUuid(organisation.id)
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
					});
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
				} else if (err instanceof fetchres.ReadTimeoutError) {
					res.status(500).end();
				} else if (fetchres.originatedError(err)) {
					res.status(404).end();
				} else {
					next(err);
				}
			});
	} else {
		api.contentLegacy({
			uuid: req.params.id,
			useElasticSearch: res.locals.flags.elasticSearchItemGet
		})
			.then(function (article) {
				res.set(cacheControl);
				var metadata = article && article.item && article.item.metadata;
				var relations = metadata && metadata.organisations.filter(excludePrimaryTheme(article));

				if (!relations || !relations.length) {
					throw new Error('No related');
				}
				return tagsToFullV2Things(relations)
					.then(function(results) {
						var organisations = relations
							.map(function(relation) {
								var organisation = results[relation.term.id];
								var organisationModel = {
									name: relation.term.name,
									url: organisation ? '/organisations/' + extractUuid(organisation.id) : '/stream/organisationsId/' + relation.term.id,
									conceptId: relation.term.id,
									taxonomy: 'organisations'
								};
								// get the stock id
								relation.term.attributes.some(function(attribute) {
									if (attribute.key === 'wsod_key') {
										organisationModel.tickerSymbol = attribute.value;
										return true;
									}
									return false;
								});

								return organisationModel;
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
				} else if (err instanceof fetchres.ReadTimeoutError) {
					res.status(500).end();
				} else if (fetchres.originatedError(err)) {
					res.status(404).end();
				} else {
					next(err);
				}
			});
	}
};
