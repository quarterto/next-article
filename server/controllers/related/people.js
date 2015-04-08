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
			var relations = article.item.metadata.people;
			if (!relations.length) {
				throw new Error('No related');
			}
			var promises = relations.map(function (item) {
				return api.mapping(item.term.id, 'people')
					.catch(function(err) {
						return null;
					});
			});
			return Promise.all(promises)
				.then(function (results) {
					// awkwardly need to get the v1 name of the relation for linking to
					var people = results.map(function (result, index) {
							if (!result) {
								return null;
							}
							var personModel = {
								name: result.prefLabel || result.labels[0],
								v1Name: relations[index].term.name
							};
							if (result.memberships) {
								var latestMembership = result.memberships[0];
								if (!latestMembership.changeEvents || !latestMembership.changeEvents[1]) {
									personModel.role = {
										title: latestMembership.title,
										organisation: latestMembership.organisation.prefLabel
									};
								}
							}
							return personModel;
						})
						.filter(function (person) {
							return person;
						});
					if (!people.length) {
						throw new Error('No related');
					}
					res.render('related/people', {
						people: people
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
