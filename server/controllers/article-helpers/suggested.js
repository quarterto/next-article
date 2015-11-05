'use strict';

const api = require('next-ft-api-client');
const logger = require('ft-next-express').logger;
const articlePodMapping = require('../../mappings/article-pod-mapping-v3');

module.exports = function(articleId, storyPackageIds, primaryTag) {
	let todo;

	if (storyPackageIds.length < 5) {
		todo = api.search({
			filter: ['metadata.idV1', primaryTag.id],
			fields: ['id'],
			count: 6 - storyPackageIds.length
		})
			.then(articles => {
				return storyPackageIds.concat(
					articles
						.filter(article => article.id !== articleId)
						.slice(0, 5 - storyPackageIds.length)
						.map(article => article.id)
				);
			});
	} else {
		Promise.resolve(storyPackageIds);
	}

	return todo
		.then(articleIds => {
			return api.content({
				uuid: articleIds,
				index: 'v3_api_v2'
			});
		})
		.then(articles => {
			return articles.map(articlePodMapping);
		})
		.catch(error => {
			logger.warn('Fetching suggested reads failed.', error.toString());
		});
};
