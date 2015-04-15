'use strict';

var _ = require('lodash');
var capiMapiRegex = require('./capi-mapi-regex').root;

module.exports = function (article, articleV1, flags) {
	if (flags.mentionsV2 && flags.mentionsV2.isSwitchedOn) {
		return _(article.annotations)
			.filter(function (annotation) {
				return ['organisation', 'person'].indexOf(annotation.type.toLowerCase()) > -1;
			})
			.slice(0, 5)
			.map(function (annotation) {
				return {
					name: annotation.label,
					url: annotation.apiUrl.replace(capiMapiRegex, '')
				};
			})
			.value();
	} else {
		var articleV1Metadata = articleV1 && articleV1.item.metadata;
		// NOTE - yoinked from
		// https://github.com/Financial-Times/ft-api-client/blob/b95cb14b243436407fc14e1bb155e318264dfde7/lib/models/article.js#L345
		return articleV1Metadata ? _(articleV1Metadata.primaryTheme ? [articleV1Metadata.primaryTheme] : [])
			.concat(
				articleV1Metadata.people,
				articleV1Metadata.regions,
				articleV1Metadata.organisations,
				articleV1Metadata.topics
			)
			.compact()
			.uniq(function (tag) {
				return tag.term.id;
			})
			.slice(0, 5)
			.map(function (tag) {
				return {
					name: tag.term.name,
					url: '/stream/' + tag.term.taxonomy + '/' + tag.term.name
				};
			})
			.value() : [];
	}
};
