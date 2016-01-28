'use strict';

const fetchres = require('fetchres');
const logger = require('ft-next-express').logger;
const api = require('next-ft-api-client');
const interactivePoller = require('../lib/ig-poller');
const shellpromise = require('shellpromise');

const controllerInteractive = require('./interactive');
const controllerPodcast = require('./podcast');
const controllerArticle = require('./article');

function isArticlePodcast(article) {
	return article.provenance.find(
		source => source.includes('http://rss.acast.com/')
	);
}

function getInteractive(contentId) {
	return interactivePoller.getData().find(
		mapping => mapping.articleuuid === contentId
	);
}

function getArticle(contentId) {
	return api.content({
		uuid: contentId,
		index: 'v3_api_v2'
	})
		// Some things aren't in CAPI v3 (e.g. Syndicated content)
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
		return controllerInteractive(req, res, next, interactive);
	}

	return getArticle(req.params.id)
		.then(article => {
			const webUrl = article && article.webUrl || '';

			if (webUrl.includes('/liveblogs/') || webUrl.includes('/marketslive/')) {
				return res.redirect(302, `${webUrl}${webUrl.includes('?') ? '&' : '?'}ft_site=falcon&desktop=true`);
			}

			if (article) {
				if (isArticlePodcast(article)) {
					return controllerPodcast(req, res, next, article);
				} else {
					return controllerArticle(req, res, next, article);
				}
			}

			return shellpromise(`curl -s http://www.ft.com/cms/s/${req.params.id}.html -I | grep -i location || echo`, { verbose: true })
				.then(response => {
					const webUrl = response.replace(/^Location:/i, '').trim();

					if (/^http:\/\/www\.ft\.com\//.test(webUrl)) {
						res.redirect(302, `${webUrl}${webUrl.includes('?') ? '&' : '?'}ft_site=falcon&desktop=true`);
					} else {
						res.sendStatus(404);
					}
				});
		})
		.catch(error => {
			logger.error({ event: "CONTENT_FETCH_FAILED", err: error.toString() });
			next(error);
		});
};
