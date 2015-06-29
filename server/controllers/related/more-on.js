'use strict';

var _ = require('lodash');
require('array.prototype.find');
var fetchres = require('fetchres');
var api = require('next-ft-api-client');
var splunkLogger = require('ft-next-splunk-logger')('next-article');
var cacheControl = require('../../utils/cache-control');
var extractUuid = require('../../utils/extract-uuid');

function hasSemanticStream(taxonomy) {
	return ['people', 'organisations'].indexOf(taxonomy) > -1;
}

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
				.map(function(metadataField, index) {
					var topic = article.item.metadata[metadataField];
					// if it's an array, use the first
					if (Array.isArray(topic)) {
						topic = topic.shift();
					}
					if (!topic) {
						return null;
					}
					topics.push(topic);
					var promises = [];
					promises.push(
						api.searchLegacy({
							query: topic.term.taxonomy + 'Id:"' + topic.term.id + '"',
							// get one extra, in case we dedupe
							count: count + 1,
							useElasticSearch: res.locals.flags.elasticSearchItemGet
						})
							.then(function(ids) {
								return api.content({
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
							})
					);
					if (res.locals.flags.semanticStreams && hasSemanticStream(topic.term.taxonomy)) {
						promises.push(
							api.mapping(topic.term.id, topic.term.taxonomy)
								.then(function (v2Topic) {
									topics[index].uuid = extractUuid(v2Topic.id);
								})
								.catch(function (err) {})
						);
					}
					return Promise.all(promises);
				})
				.filter(_.identity);

			if (!moreOnPromises.length) {
				throw new Error('No related');
			}

			return Promise.all(moreOnPromises);
		})
		.then(function(results) {
			var moreOns = results
				.map(function(result, index) {
					var articleModels = result[0];
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
					topicModel.conceptId = res.locals.flags.userPrefsUseConceptId ? topicModel.id : (topicModel.taxonomy + ':"' + encodeURIComponent(topicModel.name) + '"');
					topicModel.tmeId = res.locals.flags.userPrefsUseConceptId ? null : topicModel.id;

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

					var otherArticleModels = _.flatten(results
						.slice(0, index)
						.map(function(result) { return result[0]; }));

					// add props for more-on cards
					articleModels.forEach(function (articleModel) {
						articleModel.headline = articleModel.title;
						articleModel.lastUpdated = articleModel.publishedDate;
						// Use bare card type
						articleModel.isBare = true;
					});

					// dedupe
					var dedupedArticles = articleModels
						.filter(function(articleModel) {
							return !otherArticleModels.find(function(otherArticleModel) {
								return otherArticleModel.id === articleModel.id;
							});
						})
						.map(function(articleModel) {
							articleModel.id = articleModel.id.replace('http://www.ft.com/thing/', '');
							return articleModel;
						});
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
			} else if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
