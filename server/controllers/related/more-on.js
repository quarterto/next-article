'use strict';

var _ = require('lodash');
require('array.prototype.find');
var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var splunkLogger = require('ft-next-splunk-logger')('next-article');
var cacheControl = require('../../utils/cache-control');
var getVisualCategory = require('ft-next-article-genre');

module.exports = function (req, res, next) {
	var topics = [];
	var metadataFields = (req.query['metadata-fields'] || '').split(',');
	var count = parseInt(req.query.count) || 5;

	api.contentLegacy({
		uuid: req.params.id,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	})
		.then(function(article) {
			res.set(cacheControl);
			var moreOnPromises = metadataFields
				.map(function(metadataField) {
					var topic = article.item.metadata[metadataField];
					// if it's an array, use the first
					if (Array.isArray(topic)) {
						topic = topic.shift();
					}
					if (!topic) {
						return null;
					}
					var exists = topics.find(function(existing) {
						return topic.term.id === existing.term.id;
					});
					if (exists) {
						return;
					}

					topics.push(topic);

					return api.searchLegacy({
							query: topic.term.taxonomy + 'Id:"' + topic.term.id + '"',
							// get twice as many, in case we dedupe
							count: count * 2,
							useElasticSearch: res.locals.flags.elasticSearchItemGet
						})
						.then(function(ids) {
							if (ids.indexCount === 0) {
								return [];
							}
							return api.contentLegacy({
								uuid: ids,
								useElasticSearch: res.locals.flags.elasticSearchItemGet,
								type: 'Article'
							})
							.catch(function (err) {
								if (err instanceof fetchres.ReadTimeoutError) {
									splunkLogger('Timeout reading JSON for ids: %j', ids);
								}
								throw err;
							});
						});
				})
				.filter(_.identity);

			if (!moreOnPromises.length) {
				throw new Error('No related');
			}

			return Promise.all(moreOnPromises);
		})
		.then(function(results) {
			var moreOns = results
				.map(function(articleModels, index) {
					var topic = topics[index];
					var topicModel = {
						id: topic.term.id,
						name: topic.term.name,
						taxonomy: topic.term.taxonomy
					};
					topicModel.url = topic.uuid ?
						topicModel.taxonomy + '/' + topic.uuid :
						'/stream/' + encodeURIComponent(topicModel.taxonomy) + 'Id/' + encodeURIComponent(topicModel.id);
					topicModel.isAuthor = topicModel.taxonomy === 'authors';
					topicModel.title = 'More ' + (topicModel.isAuthor ? 'from' : 'on');
					topicModel.conceptId = topicModel.id;

					if (topicModel.taxonomy === 'organisations') {
						// get the stock id
							topic.term.attributes.some(function(attribute) {
								if (attribute.key === 'wsod_key') {
									topicModel.tickerSymbol = attribute.value;
									return true;
								}
								return false;
							});
					}

					// dedupe
					var otherArticleModels = index > 0 ? results[index - 1] : [];
					var dedupedArticles = articleModels
						.filter(function (articleModel) {
							return !otherArticleModels.find(function(otherArticleModel) {
								return otherArticleModel.item.id === articleModel.item.id;
							});
						})
						// add props for more-on cards
						.map(function (articleModel) {
							return {
								id: articleModel.item.id,
								headline: articleModel.item.title.title,
								lastUpdated: articleModel.item.lifecycle.lastPublishDateTime,
								isDiscreet: true,
								visualCategory: getVisualCategory(articleModel.item.metadata)
							};
						})
						.slice(0, count);
					return dedupedArticles.length ? {
						articles: dedupedArticles,
						topic: topicModel
					} : null;
				})
				.filter(_.identity);

			res.render('related/more-on', {
				moreOns: moreOns
			});
		})
		.catch(function(err) {
			if (err.message === 'No related') {
				res.status(200).end();
			} else if (err instanceof fetchres.ReadTimeoutError) {
				res.status(500).end();
			} else if (fetchres.originatedError(err)) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
