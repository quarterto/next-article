'use strict';

require('array.prototype.find');
var fetchres = require('fetchres');
var _ = require('lodash');
var api = require('next-ft-api-client');
var cacheControl = require('../../utils/cache-control');
var extractUuid = require('../../utils/extract-uuid');
var excludePrimaryTheme = require('../../utils/exclude-primary-theme');
var tagsToFullV2Things = require('../../lib/tags-to-full-v2-things');

function getCurrentRole(person) {
	var currentMembership = (person.memberships || []).find(function(membership) {
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

	if (res.locals.flags.capiV2PeopleOrganisationAnnotations) {
		api.content({
			uuid: req.params.id,
			type: 'Article',
			metadata: true,
			useElasticSearch: res.locals.flags.elasticSearchItemGet
		})
			.then(function(article) {
				res.set(cacheControl);
				var personPromises = article.annotations
					.filter(function(annotation) {
						var type = annotation.directType.replace('http://www.ft.com/ontology/', '');
						return annotation.predicate === 'http://www.ft.com/ontology/annotation/mentions' &&
							['person/Person'].indexOf(type ) > -1;
					})
					.map(function(person) {
						return api.people({
								uuid: extractUuid(person.id)
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
			.then(function(results) {
				var people = results
					.filter(_.identity)
					.map(function(person) {
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
			.catch(function(err) {
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
			.then(function(article) {
				res.set(cacheControl);
				var metadata = article && article.item && article.item.metadata;
				var relations = metadata && metadata.people.filter(excludePrimaryTheme(article));

				if (!relations || !relations.length) {
					throw new Error('No related');
				}
				return tagsToFullV2Things(relations)
					.then(function(results) {
						var people = relations
							.map(function(relation) {
								var person = results[relation.term.id];
								return {
									name: relation.term.name,
									url: person ? '/people/' + extractUuid(person.id) : '/stream/peopleId/' + relation.term.id,
									role: person && getCurrentRole(person),
									conceptId: relation.term.id,
									taxonomy: 'people'
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
			.catch(function(err) {
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
