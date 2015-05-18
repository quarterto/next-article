'use strict';

var fetchres = require('fetchres');
var logger = require('ft-next-logger');
var api = require('next-ft-api-client');
var subheadersTransform = require('../transforms/subheaders');
var addSubheaderIds = require('../transforms/add-subheader-ids');
var bylineTransform = require('../transforms/byline');
var cacheControl = require('../utils/cache-control');
var extractTags = require('../utils/extract-tags');
var extractUuid = require('../utils/extract-uuid');
var images = require('../transforms/images');

var bodyTransform = require('../transforms/body');

module.exports = function(req, res, next) {
	var articleV1Promise;
	if (res.locals.flags.articleCapiV1Fallback) {
		articleV1Promise = api.contentLegacy({
				uuid: req.params.id,
				useElasticSearch: res.locals.flags.elasticSearchItemGet
			})
				// Some things aren't in CAPI v1 (e.g. FastFT)
				.catch(function(err) {
					if (err instanceof fetchres.BadServerResponseError) {
						return;
					} else {
						throw err;
					}
				});
	} else {
		logger.info("CAPI v1 fallback disabled, defaulting to CAPI v2 only");
	}

	var articleV2Promise = api.content({
		uuid: req.params.id,
		type: 'Article',
		metadata: true,
		useElasticSearch: res.locals.flags.elasticSearchItemGet
	});

	Promise.all([articleV1Promise, articleV2Promise])
		.then(function(articles) {
			res.set(cacheControl);

			var articleV1 = articles[0];
			var article = articles[1];
			var $ = bodyTransform(article.bodyXML);
			var $subheaders = $('.ft-subhead')
				.attr('id', addSubheaderIds)
				.replaceWith(subheadersTransform);
			var primaryTheme = (function() {
				try {
					return {
						title: articleV1.item.metadata.primaryTheme.term.name,
						url: '/stream/' + articleV1.item.metadata.primaryTheme.term.taxonomy + 'Id/' + encodeURIComponent(articleV1.item.metadata.primaryTheme.term.id),
						conceptId: articleV1.item.metadata.primaryTheme.term.taxonomy + ':"' + encodeURIComponent(articleV1.item.metadata.primaryTheme.term.name) + '"'
					};
				} catch (e) {
					return undefined;
				}
			})();

			// Some posts (e.g. FastFT are only available in CAPI v2)
			// TODO: Replace with something in CAPI v2
			var isColumnist = articleV1 && articleV1.item.metadata.primarySection.term.name === 'Columnists';

			// Update the images (resize, add image captions, etc)
			return images($, res.locals.flags)
				.then(function($) {
					var articleBody = $.html();
					var comments = {};
					if (res.locals.barrier) {
						comments = null;
						articleBody = null;
					}

					return res.render('layout', {
						comments: comments,
						article: article,
						articleV1: articleV1 && articleV1.item,
						id: extractUuid(article.id),
						// HACK - Force the last word in the title never to be an ‘orphan’
						title: article.title.replace(/(.*)(\s)/, '$1&nbsp;'),
						byline: bylineTransform(article.byline, articleV1),
						tags: extractTags(article, articleV1, res.locals.flags),
						body: articleBody,
						subheaders: $subheaders.map(function() {
							var $subhead = $(this);
							return {
								text: $subhead.find('.article__subhead__title').text(),
								id: $subhead.attr('id')
							};
						}).get(),
						showTOC: res.locals.flags.articleTOC && $subheaders.length > 2,
						isColumnist: isColumnist,
						// if there's a main image, or slideshow or video, we overlap them on the header
						headerOverlap:
							$.root().children('.article__main-image, ft-slideshow:first-child, .article__video-wrapper:first-child').length,
						layout: 'wrapper',
						primaryTheme: primaryTheme
					});
				});
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				return api.contentLegacy({
						uuid: req.params.id,
						useElasticSearch: false, // TODO: reinstate res.locals.flags.elasticSearchItemGet after talking to @richard-still-ft about plain versions…
						bodyFormat: 'plain'
					})
						.then(function(data) {
							if (res.locals.flags.articleCapiV1Fallback) {
								var article = data.item;
								res.render('layout-v1', {
									id: article.id,
									title: article.title.title,
									standFirst: article.editorial.standFirst,
									byline: article.editorial.byline,
									body: article.body.body,
									publishedDate: article.lifecycle.lastPublishDateTime,
									layout: 'wrapper'
								});
							} else {
								res.render('layout-404', { layout: 'wrapper', url: data.item.location.uri });
							}
						})
						.catch(function(err) {
							if (err instanceof fetchres.BadServerResponseError) {
								res.status(404).end();
							} else {
								next(err);
							}
						});
			}
			next(err);
		});
};
