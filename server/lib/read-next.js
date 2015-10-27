'use strict';

const api = require('next-ft-api-client');
const articlePodMapping = require('../mappings/article-pod-mapping');
const articleTopicMapping = require('../mappings/article-topic-mapping');

module.exports = function(storyPackageIds, articleId, primaryTag, publishedDate) {

	let packageArticleFetch, topicArticleFetch;

	if (storyPackageIds.length) {
		packageArticleFetch = api.contentLegacy({
			uuid: storyPackageIds[0],
			useElasticSearch: true
		})
			.then(articlePodMapping);
	}

	if (primaryTag) {
		topicArticleFetch = api.searchLegacy({
			query: primaryTag.taxonomy + 'Id:"' + primaryTag.id + '"',
			count: 2,
			fields: true,
			useElasticSearch: true
		})
			.then(articles => {
				return articlePodMapping(
					articles
						.map(article => article._source)
						.filter(article => article.item.id !== articleId)
						.shift()
				);
			});
	}

	return Promise.all([ packageArticleFetch, topicArticleFetch ])
		.then(results => {
			let packageArticle = results[0];
			let topicArticle = results[1];

			if (!topicArticle && !packageArticle) {
				return;
			}

			if (packageArticle) {
				packageArticle.source = 'package';
			}

			if (topicArticle) {
				topicArticle.source = 'topic';
			}

			// hierarchy of compellingness governing which read next article to return
			if (topicArticle && new Date(topicArticle.lastUpdated) > new Date(publishedDate)) {
				// 1. return article with same topic as parent if more recent
				topicArticle.moreRecent = true;
				return topicArticle;
			} else if (packageArticle) {
				// 2. otherwise if story package return the first one
				return packageArticle;
			} else {
				// 3. failing that return the article on the same topic
				return topicArticle;
			}
		});
};
