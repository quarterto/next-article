'use strict';

const api = require('next-ft-api-client');
const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const NoRelatedResultsException = require('../../lib/no-related-results-exception');
const articlePodMapping = require('../../mappings/article-pod-mapping-v3');

function getArticles (tagId, count, parentId) {
	return api.search({
		filter: [ 'metadata.idV1', tagId ],
		// Get +1 for de-duping parent article
		count: count + 1,
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
			if (!articles.length) {
				throw new NoRelatedResultsException();
			}
			return articles
				.filter(article => article.id !== parentId)
				.slice(0, count)
				.map(articlePodMapping);
		});
}

function allSettled(promises) {
	let resolveWhenSettled = function(promise) {
		return new Promise(res => {
			promise.then(res, () => res());
		});
	};
	return Promise.all(promises.map(resolveWhenSettled));
}

module.exports = function (req, res, next) {
	// make sure there are tag ids and an index not greater than 4
	if (!req.query.tagIds || !req.query.index || parseInt(req.query.index, 10) > 4) {
		return res.status(400).end();
	}

	const tagIdArray = req.query.tagIds.split(',');
	const moreOnIndex = req.query.index;
	const parentId = req.params.id;
	const count = Math.min(parseInt(req.query.count, 10), 10) || 5;

	let getArticlesPromises = [];
	let precedingMoreOnIds = [];

	let dedupe = function(articlesToDedupe) {
		if (!articlesToDedupe) {
			return [];
		}
		return articlesToDedupe
			.filter(article => isNotADupe(article.id))
			.slice(0, count);
	};

	let isNotADupe = function(articleId) {
		return precedingMoreOnIds.indexOf(articleId) === -1;
	};

	// get predecessor more-on tag articles for deduping
	tagIdArray.slice(0,(moreOnIndex + 1)).forEach((tagId, i) => {
		getArticlesPromises.push(getArticles(tagId, count * (i + 1),parentId));
	});

	return allSettled(getArticlesPromises)
		.then(moreOnArticlesArray => {
			for (let i = 0; i < moreOnIndex; i++) {
				precedingMoreOnIds = precedingMoreOnIds
				.concat(dedupe(moreOnArticlesArray[i]).map(article => article.id));
			}
			moreOnArticlesArray[moreOnIndex] = dedupe(moreOnArticlesArray[moreOnIndex])
				.map((article, i) => {
					if (article.mainImage && i > 0) {
						article.mainImage = null;
					}
					return article;
				});

			let template = res.locals.flags.articleMoreOnTopicCard
				? 'related/more-on-ab-test-b'
				: 'related/more-on';

			return res.render(template, {
				articles: moreOnArticlesArray[moreOnIndex]
			});
		})
		.catch(function(err) {
			logger.error(err);

			if(err.name === NoRelatedResultsException.NAME) {
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
