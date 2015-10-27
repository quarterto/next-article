'use strict';

var api = require('next-ft-api-client');
var articleTopicMapping = require('../../mappings/article-topic-mapping');
var articlePodMapping = require('../../mappings/article-pod-mapping');

module.exports = function(packageIds, articleId, primaryTag) {
	let todo = Promise.resolve();

	if (packageIds.length < 5) {
		todo = api.searchLegacy({
			query: primaryTag.taxonomy + 'Id:"' + primaryTag.id + '"',
			count: 6 - packageIds.length,
			useElasticSearch: true
		})
			.then(function(ids) {
				let deduped = ids.filter(id => id !== articleId).slice(0, 5);

				return {
					ids: packageIds.concat(deduped)
				};
			});
	}

	todo
		.then(function(it) {
			return api.contentLegacy({
				uuid: (it && it.ids) || [],
				useElasticSearch: true
			});
		})
		.then(function(stories) {
			return stories.map(articlePodMapping);
		});
};
