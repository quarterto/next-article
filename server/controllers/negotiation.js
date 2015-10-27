'use strict';

const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const api = require('next-ft-api-client');
const interactivePoller = require('../lib/ig-poller');

const controllerInteractive = require('./interactive');
const controllerPodcastLegacy = require('./podcast-legacy');
const controllerArticleLegacy = require('./article-legacy');
const controllerArticleV3 = require('./article-v3');

function isArticlePodcastV1(article) {
	return article
		&& article.item
		&& article.item.provenance
		&& article.item.provenance.originatingParty === 'Acast';
}

function isArticlePodcastV3(article) {
	return article.provenance.find(
		source => source.includes('https://www.acast.com/')
	);
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
		index: 'v2_api_v2',
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

			// TODO: When only articleV3 this can be changed to simply `webUrl = articles.webUrl`
			const webUrl = articles[0] && articles[0].item && articles[0].item.location && articles[0].item.location.uri
				|| articles[0] && articles[0].webUrl
				|| '';

			if (webUrl.includes('/liveblogs/') || webUrl.includes('/marketslive/')) {
				return res.redirect(302, `${webUrl}${webUrl.includes('?') ? '&' : '?'}ft_site=falcon&desktop=true`);
			}

			if (articles[0] && res.locals.flags.elasticV3) {
				if (isArticlePodcastV3(articles[0])) {
					// return controllerPodcastV3(req, res, next, articles[0]);
				} else {
					return controllerArticleV3(req, res, next, articles[0]);
				}
			}

			if (articles[0] && isArticlePodcastV1(articles[0])) {
				return controllerPodcastLegacy(req, res, next, articles[0]);
			}

			if (articles[1]) {
				return controllerArticleLegacy(req, res, next, articles);
			}

			// TODO: When only articleV3 remove this code and never redirect back to FT.com (except for the liveblog/marketslive case, above)
			if (webUrl) {
				return res.redirect(302, `${webUrl}${webUrl.includes('?') ? '&' : '?'}ft_site=falcon&desktop=true`);
			}

			return res.sendStatus(404);
		})
		.catch(error => {
			logger.error(`Failed to fetch content: ${error.toString()}`);
			next(error);
		});
};
