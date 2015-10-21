'use strict';

const fetchres = require('fetchres');
const api = require('next-ft-api-client');
const interactivePoller = require('../lib/ig-poller');

const controllerPodcastLegacy = require('./podcast-legacy');
const controllerArticleLegacy = require('./article-legacy');
const controllerInteractive = require('./interactive');

function isArticlePodcast(article) {
	return article
		&& article.item
		&& article.item.provenance
		&& article.item.provenance.originatingParty === 'Acast';
}

function isArticleFound(results) {
	return results[0] || results[1];
}

function getInteractive(contentId) {
	return interactivePoller.getData().find(
		mapping => mapping.articleuuid === contentId
	);
}

function getArticleV1(contentId, flags) {
	return api.contentLegacy({
		uuid: contentId,
		useElasticSearch: flags.elasticSearchItemGet,
		useElasticSearchOnAws: flags.elasticSearchOnAws
	})
		// Some things aren't in CAPI v1 (e.g. FastFT)
		.catch(function(error) {
			if (fetchres.originatedError(error)) {
				return;
			} else {
				throw error;
			}
		});
}

function getArticleV2(contentId, flags) {
	return api.content({
		uuid: contentId,
		metadata: true,
		useElasticSearch: flags.elasticSearchItemGet,
		useElasticSearchOnAws: flags.elasticSearchOnAws
	})
		// Some things aren't in CAPI v2 (e.g. Podcasts)
		.catch(function(error) {
			if (fetchres.originatedError(error)) {
				return;
			} else {
				throw error;
			}
		});
}

module.exports = function negotiationController(req, res, next) {
	let interactive = getInteractive(req.params.id);

	if (interactive) {
		controllerInteractive(req, res, next, interactive);
	} else {
		Promise.all([
			getArticleV1(req.params.id, res.locals.flags),
			getArticleV2(req.params.id, res.locals.flags)
		])
			.then(articles => {
				if (isArticleFound(articles)) {
					if (isArticlePodcast(articles[0])) {
						controllerPodcastLegacy(req, res, next, articles[0]);
					} else {
						controllerArticleLegacy(req, res, next, articles);
					}
				} else {
					res.send(404);
				}
			})
			.catch(error => {
				logger.error(`Failed to fetch content: ${error.toString()}`);
				res.send(500);
			});
	}
};
