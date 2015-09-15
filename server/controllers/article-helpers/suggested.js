var api = require('next-ft-api-client');
var exposeTopic = require('./exposeTopic');

module.exports = function(article, useElasticSearch) {
	var topic = exposeTopic(article.item && article.item.metadata);
	var packageIds = getStoryPackage(article).map(function(item) { return item.id; });

	if (packageIds.length < 4) {
		return api.searchLegacy({
			query: topic + 'Id:"' + topic.term.id + '"',
			count: 4 - packageIds.length,
			useElasticSearch: useElasticSearch
		})
		.then(function(ids) {
			return {
				ids: packageIds.concat(ids)
			};
		});
	} else {
		return Promise.resolve({
			ids: packageIds
		});
	}
};

function getStoryPackage(article) {
	return (article && article.item && article.item.package) || [];
}
