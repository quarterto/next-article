'use strict';

var api = require('next-ft-api-client');
var articlePodMapping = require('../../mappings/article-pod-mapping');

module.exports = function(packageIds, articleId, primaryTag) {
	let todo = Promise.resolve(packageIds);

	if (packageIds.length < 5) {
		todo = api.searchLegacy({
			query: primaryTag.taxonomy + 'Id:"' + primaryTag.id + '"',
			count: 6 - packageIds.length,
			useElasticSearch: true
		})
			.then(function(ids) {
				let deduped = ids.filter(id => id !== articleId).slice(0, 5);
				return packageIds.concat(deduped);
			});
	}

	return todo
		.then(function(it) {
			return api.contentLegacy({
				uuid: it || [],
				useElasticSearch: true
			});
		})
		.then(function(stories) {
			return stories.map(articlePodMapping);
		});
};
