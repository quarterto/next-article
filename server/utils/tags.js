'use strict';

var _ = require('lodash');
var api = require('next-ft-api-client');
var logger = require('ft-next-logger');

module.exports = {

	get: function (articleV1, flags) {
		var articleV1Metadata = articleV1 && articleV1.item.metadata;
		// NOTE - yoinked from
		// https://github.com/Financial-Times/ft-api-client/blob/b95cb14b243436407fc14e1bb155e318264dfde7/lib/models/article.js#L345
		var tagProimises = articleV1Metadata ? _(articleV1Metadata.primaryTheme)
			.concat(
				articleV1Metadata.people,
				articleV1Metadata.regions,
				articleV1Metadata.organisations,
				articleV1Metadata.topics
			)
			.filter(function (tag) {
				return tag;
			})
			.uniq(function (tag) { return tag.term.id; })
			.slice(0, 5)
			.map(function (tag) {
				var taxonomy = tag.term.taxonomy;
				// for people or organisations, get their v2 data
				if (flags.mentionsV2 && flags.mentionsV2.isSwitchedOn && ['people', 'organisations'].indexOf(taxonomy) > -1) {
					return api.mapping(tag.term.id, taxonomy)
						.then(function (result) {
							return result ? {
								name: result.prefLabel,
								url: taxonomy + '/' + result.id.replace('http://api.ft.com/things/', '')
							} : null;
						})
						.catch(function (err) {
							logger.warn(err);
							return null;
						});
				} else {
					return Promise.resolve({
						name: tag.term.name,
						url: '/stream/' + taxonomy + '/' + tag.term.name
					});
				}
			})
			.value() : [];

		return Promise.all(tagProimises)
			.then(function (tags) {
				return _.compact(tags);
			});
	}

};
