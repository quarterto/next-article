'use strict';

const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const api = require('next-ft-api-client');
const interactivePoller = require('../lib/ig-poller');

const controllerInteractive = require('./interactive');
const controllerPodcastLegacy = require('./podcast-legacy');
const controllerArticleLegacy = require('./article-legacy');
const controllerArticleV3 = require('./article-v3');

function isArticlePodcast(article) {
	return article
		&& article.item
		&& article.item.provenance
		&& article.item.provenance.originatingParty === 'Acast';
}

function getInteractive(contentId) {
	return interactivePoller.getData().find(
		mapping => mapping.articleuuid === contentId
	);
}

function getArticleV1(contentId, flags) {
	return api.contentLegacy({
		uuid: contentId,
		useElasticSearch: flags.elasticSearchItemGet
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
		useElasticSearch: flags.elasticSearchItemGet
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

function getArticleV3(contentId) {
	return api.content({
		uuid: contentId,
		index: 'v3_api_v2',
		useElasticSearch: true
	});
}

module.exports = function negotiationController(req, res, next) {
	let interactive = getInteractive(req.params.id);

	if (interactive) {
		return controllerInteractive(req, res, next, interactive);
	}

	let articleSources = [];

	if (res.locals.flags.elasticV3) {
		articleSources.push(getArticleV3(req.params.id));
	} else {
		articleSources.push(getArticleV1(req.params.id, res.locals.flags));
		articleSources.push(getArticleV2(req.params.id, res.locals.flags));
	}

	return Promise.all(articleSources)
		.then(articles => {
			if (res.locals.flags.elasticV3) {
				controllerArticleV3(req, res, next, articles[0]);
			} else if (articles[1]) {
				controllerArticleLegacy(req, res, next, articles);
			} else if (isArticlePodcast(articles[0])) {
				controllerPodcastLegacy(req, res, next, articles[0]);
			} else if (articles[0]) {
				let url = articles[0].item.location.uri;
				res.redirect(302, `${url}${url.includes('?') ? '&' : '?'}ft_site=falcon&desktop=true`);
			} else {
				res.sendStatus(404);
			}
		})
		.catch(error => {
			logger.error(`Failed to fetch content: ${error.toString()}`);
			next(error);
		});
};
