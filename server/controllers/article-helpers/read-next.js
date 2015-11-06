'use strict';

const api = require('next-ft-api-client');
const logger = require('ft-next-express').logger;
const articlePodMapping = require('../../mappings/article-pod-mapping-v3');

module.exports = function(articleId, storyPackageIds, primaryTag, publishedDate) {

	let packageArticleFetch;
	let topicArticleFetch;

	if (storyPackageIds.length) {
		packageArticleFetch = api.content({
			uuid: storyPackageIds[0],
			index: 'v3_api_v2'
		})
			.then(articlePodMapping);
	}

	if (primaryTag) {
		topicArticleFetch = api.search({
			filter: ['metadata.idV1', primaryTag.id],
			// Get an extra so we can de-dupe
			count: 2,
			fields: [
				'id',
				'title',
				'metadata',
				'summaries',
				'mainImage',
				'publishedDate'
			]
		})
			.then(articles => {
				articles = articles.filter(article => article.id !== articleId);
				return articles.length ? articlePodMapping(articles[0]) : null;
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
			if (topicArticle && new Date(topicArticle.publishedDate) > new Date(publishedDate)) {
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
		})
		.catch(error => {
			logger.warn('Fetching read next failed.', error.toString());
		});
};
