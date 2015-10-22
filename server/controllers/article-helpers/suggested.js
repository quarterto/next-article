'use strict';

var api = require('next-ft-api-client');
var articleTopicMapping = require('../../mappings/article-topic-mapping');

module.exports = function(article, useElasticSearch) {
	if (!article) { return Promise.resolve(); }
	var topic = articleTopicMapping(!!article.item && article.item.metadata);
	var packageIds = getStoryPackage(article).map(function(item) { return item.id; });

	if (packageIds.length < 5 && topic) {
		return api.searchLegacy({
			query: topic.taxonomy + 'Id:"' + topic.id + '"',
			count: 6 - packageIds.length,
			useElasticSearch: useElasticSearch
		})
		.then(function(ids) {
			return ids.filter(function(id) {
				return id !== article.item.id;
			}).splice(0, 5);
		})
		.then(function(dedupedIds) {
			return {
				ids: packageIds.concat(dedupedIds)
			};
		});
	} else {
		return Promise.resolve({
			ids: packageIds
		});
	}

	return Promise.resolve();
};

function getStoryPackage(article) {
	return (!!article && !!article.item && article.item.package) || [];
}
