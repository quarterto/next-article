'use strict';

require('array.prototype.find');
var fetchres = require('fetchres');
var _ = require('lodash');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var extractUuid = require('../../utils/extract-uuid');

function getCurrentRole(person) {
	var currentMembership = (person.memberships || []).find(function (membership) {
		return _.find(membership.changeEvents, 'startedAt') && !_.find(membership.changeEvents, 'endedAt');
	});
	return currentMembership ? {
		title: currentMembership.title,
		organisation: currentMembership.organisation.prefLabel
	} : undefined;
}

module.exports = function(req, res, next) {
	if (!res.locals.flags.articleRelatedContent) {
		return res.status(404).end();
	}

	if (res.locals.flags.mentionsV2) {
		api.content({
			uuid: req.params.id,
			type: 'Article',
			metadata: true,
			useElasticSearch: res.locals.flags.elasticSearchItemGet
		})
			.then(function (article) {
				res.set(cacheControl);
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
					.filter(_.identity)
					.map(function (person) {
						return {
							name: person.prefLabel || (person.labels && person.labels[0]),
							url: '/people/' + extractUuid(person.id),
							role: getCurrentRole(person)
						};
					});
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
			useElasticSearch: res.locals.flags.elasticSearchItemGet
		})
			.then(function (article) {
				res.set(cacheControl);
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
							.filter(function (person) {
								// need the person data for semantic streams
								return res.locals.flags.semanticStreams ? person : true;
							})
							.map(function (person, index) {
								return {
									name: relations[index].term.name,
									url: res.locals.flags.semanticStreams
										? '/people/' + extractUuid(person.id)
										: '/stream/peopleId/' + relations[index].term.id,
									role: person && getCurrentRole(person)
								};
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
