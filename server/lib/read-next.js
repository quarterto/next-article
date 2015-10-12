"use strict";

var articlePodMapping = require('../mappings/article-pod-mapping');
var articleTopicMapping = require('../mappings/article-topic-mapping');
var api = require('next-ft-api-client');

module.exports = function(articleV1, useElasticSearch, useElasticSearchOnAws) {
	var parent = articleV1;
	var parentLastPublishedDateTime = parent.item.lifecycle.lastPublishDateTime;

	var storyPackagePromise;
	if (parent.item.package.length) {
		storyPackagePromise = api.contentLegacy({
				uuid: parent.item.package[0].id,
				useElasticSearch: useElasticSearch,
				useElasticSearchOnAws: useElasticSearchOnAws
			})
			.then(function(storyPackageArticle) {
				return articlePodMapping(storyPackageArticle);
			})
			.catch(function(error) {
				return ;
			});
	}

	var parentTopic = articleTopicMapping(parent.item.metadata);
	var topicPromise;
	if (parentTopic) {
		topicPromise = api.searchLegacy({
			query: parentTopic.taxonomy + 'Id:"' + parentTopic.id + '"',
			count: 2,
			fields: true,
			useElasticSearch: useElasticSearch
		})
		.then(function(topicArticlesES) {
			var topicArticle = topicArticlesES.map(function(topicArticleES) {
				return topicArticleES._source;
			})
				.filter(function(topicArticle) {
					return topicArticle.item.id !== parent.item.id;
				})
				.slice(0,1);
			return articlePodMapping(topicArticle[0]);
		})
		.catch(function(error) {
			return ;
		});
	}

	return Promise.all([storyPackagePromise,topicPromise])
		.then(function(results) {
			var packageArticle = results[0];
			if (packageArticle) {
				packageArticle.source = "package";
			}
			var topicArticle = results[1];
			if (!topicArticle && packageArticle) {
					return packageArticle;
			}
			if (!topicArticle && !packageArticle) {
				return ;
			}
			topicArticle.source = "topic";
			// hierarchy of compellingness governing which read next article to return
			// 1. return article with same topic as parent if more recent
			if (new Date(topicArticle.lastUpdated) > new Date(parentLastPublishedDateTime)) {
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
