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
				var personPromises = article.annotations
					.filter(function (annotation) {
						return annotation.predicate === 'http://www.ft.com/ontology/annotation/mentions' &&
							annotation.type === 'PERSON';
					})
					.map(function (person) {
						return api.people({
								uuid: extractUuid(person.uri)
							})
							.catch(function(err) {
								return null;
							});
					});
				if (!personPromises.length) {
					throw new Error('No related');
				}
				return Promise.all(personPromises);
			})
			.then(function (results) {
				var people = results
					.filter(function (person) {
						return person;
					})
					.map(function (person) {
						return {
							name: person && (person.prefLabel || (person.labels && person.labels[0])),
							url: '/people/' + extractUuid(person.id)
						};
						if (person && person.memberships) {
							var latestMembership = person.memberships[0];
							if (!latestMembership.changeEvents || !latestMembership.changeEvents[1]) {
								personModel.role = {
									title: latestMembership.title,
									organisation: latestMembership.organisation.prefLabel
								};
							}
						}
						return personModel;
					})
				if (!people.length) {
					throw new Error('No related');
				}
				res.render('related/people', {
					people: people
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
						var people = results
							.filter(function (result) {
								return result;
							})
							.map(function (person, index) {
								var personModel = {
									name: relations[index].term.name,
									url: '/stream/people/' + relations[index].term.name
								};
								if (person && person.memberships) {
									var latestMembership = person.memberships[0];
									if (!latestMembership.changeEvents || !latestMembership.changeEvents[1]) {
										personModel.role = {
											title: latestMembership.title,
											organisation: latestMembership.organisation.prefLabel
										};
									}
								}
								return personModel;
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
	}
};
