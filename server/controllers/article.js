'use strict';

var fetchres = require('fetchres');
var logger = require('ft-next-logger');
var api = require('next-ft-api-client');
var bylineTransform = require('../transforms/byline');
var cacheControl = require('../utils/cache-control');
var extractTags = require('../utils/extract-tags');
var extractUuid = require('../utils/extract-uuid');
var images = require('../transforms/images');
var articlePrimaryTag = require('ft-next-article-primary-tag');
var bodyTransform = require('../transforms/body');
var getVisualCategorisation = require('ft-next-article-genre');
var articleXSLT = require('../transforms/article-xslt');
var openGraph = require('../utils/open-graph');
var twitterCardSummary = require('../utils/twitter-card').summary;
var escapeExpression = require('handlebars').Utils.escapeExpression;
var getDfp = require('../utils/get-dfp');

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

	var socialMediaImage = function (articleV2) {

		// don't bother if there's no main image to fetch
		if (!articleV2.mainImage) {
			return Promise.resolve();
		}

		// don't bother if social media flags are off
		if (!res.locals.flags.openGraph && !res.locals.flags.twitterCards) {
			return Promise.resolve();
		}

		return api.content({ uuid: extractUuid(articleV2.mainImage.id), type: 'ImageSet' })
			.then(function (images) {
				var image = images.members.reduce(function (a, b) {
					return a;
				});
				return api.content({ uuid: extractUuid(image.id), type: 'ImageSet' });
			})
			.catch(function(err) {
				if (err instanceof fetchres.BadServerResponseError) {
					return;
				} else {
					throw err;
				}
			});
		};

	Promise.all([articleV1Promise, articleV2Promise])
		.then(function (article) {
			return Promise.all([
				Promise.resolve(article[0]),
				Promise.resolve(article[1]),
				articleXSLT(article[1].bodyXML, 'main', {
					renderSlideshows: res.locals.flags.galleries ? 1 : 0,
					renderInteractiveGraphics: res.locals.flags.articleInlineInteractiveGraphics ? 1 : 0,
					useBrightcovePlayer: res.locals.flags.brightcovePlayer ? 1 : 0,
					renderTOC: res.locals.flags.articleTOC ? 1 : 0,
					fullWidthMainImages: res.locals.flags.fullWidthMainImages ? 1 : 0
				}),
				socialMediaImage(article[1])
			]);
		})
		.then(function(results) {
			res.set(cacheControl);

			var articleV1 = results[0];
			var article = results[1];
			var mainImage = results[3];

			var $ = bodyTransform(results[2], res.locals.flags);

			var primaryTag = articleV1 && articleV1.item && articleV1.item.metadata ? articlePrimaryTag(articleV1.item.metadata) : undefined;
			if (primaryTag) {
				primaryTag.conceptId = primaryTag.id;
				primaryTag.url = '/stream/' + primaryTag.taxonomy + 'Id/' + primaryTag.id;
			}

			// Some posts (e.g. FastFT are only available in CAPI v2)
			// TODO: Replace with something in CAPI v2
			var isColumnist = articleV1 && articleV1.item.metadata.primarySection.term.name === 'Columnists';

			// Update the images (resize, add image captions, etc)
			return images($, {
				fullWidthMainImages: res.locals.flags.fullWidthMainImages,
				fullWidthInlineImages: res.locals.flags.fullWidthInlineImages
			})
				.then(function($) {
					var viewModel = {
						firstClickFree: null,
						comments: {},
						article: article,
						articleV1: articleV1 && articleV1.item,
						id: extractUuid(article.id),
						// HACK - Force the last word in the title never to be an ‘orphan’
						title: escapeExpression(article.title).replace(/(.*)(\s)/, '$1&nbsp;'),
						byline: bylineTransform(article.byline, articleV1),
						tags: extractTags(article, articleV1, res.locals.flags, primaryTag),
						body: $.html(),
						toc: $.html('.article__toc'),
						isColumnist: isColumnist,
						// if there's a main image, or slideshow or video, we overlap them on the header
						headerOverlap:
							$.root().children('.article__main-image, ft-slideshow:first-child, .article__video-wrapper:first-child').length || $.root().first().children('.article__main-image'),
						layout: 'wrapper',
						primaryTag: primaryTag,
						save: {},
						relatedContent: res.locals.flags.articleRelatedContent,
						shareButtons: res.locals.flags.articleShareButtons,
						myFTTray: res.locals.flags.myFTTray,
						moreOns: {},
						dfp: (articleV1 && articleV1.item && articleV1.item.metadata) ? getDfp(articleV1.item.metadata.sections) : undefined,
						visualCat: (articleV1 && articleV1.item && articleV1.item.metadata) ? getVisualCategorisation(articleV1.item.metadata) : undefined
					};

					if (res.locals.flags.openGraph) {
						viewModel.og = openGraph(article, articleV1, mainImage);
					}

					if (res.locals.flags.twitterCards) {
						viewModel.twitterCard = twitterCardSummary(article, articleV1, mainImage);
					}

					if (res.locals.barrier) {

						if (res.locals.barrier.trialSimple) {
							viewModel.trialSimpleBarrier = res.locals.barrier.trialSimple;
						}

						if(res.locals.barrier.trialGrid) {

							viewModel.trialGridBarrier = res.locals.barrier.trialGrid;

							if(!res.locals.barrier.trialGrid.packages.newspaper) {

								viewModel.trialGridBarrier.missingNewspaper = {};
							}

							viewModel.trialGridBarrier.articleTitle = viewModel.title;

							viewModel.barrierOverlay = {};
						}

						if(res.locals.barrier.registerGrid) {

							viewModel.registerGridBarrier = res.locals.barrier.registerGrid;

							if(!res.locals.barrier.registerGrid.packages.newspaper) {

								viewModel.registerGridBarrier.missingNewspaper = {};
							}

							viewModel.registerGridBarrier.articleTitle = viewModel.title;

							viewModel.barrierOverlay = {};
						}

						if(res.locals.barrier.subscriptionGrid) {
							viewModel.subscriptionGridBarrier = res.locals.barrier.subscriptionGrid;
							viewModel.subscriptionGridBarrier.articleTitle = viewModel.title;
							viewModel.barrierOverlay = {};
						}

						if(res.locals.barrier.premiumSimple) {
							viewModel.premiumSimpleBarrier = res.locals.barrier.premiumSimple;
							viewModel.barrierOverlay = {};
							viewModel.premiumSimpleBarrier.articleTitle = viewModel.title;
						}

						viewModel.comments = null;
						viewModel.body = null;
						viewModel.articleV1.editorial.standFirst = null;
						viewModel.byline = null;
						viewModel.article.publishedDate = null;
						viewModel.tableOfContents = null;
						viewModel.primaryTag = null;
						viewModel.save = null;
						viewModel.tags = null;
						viewModel.relatedContent = null;
						viewModel.moreOns = null;
						viewModel.headerOverlap = null;
						viewModel.shareButtons = null;
						viewModel.myFTTray = null;
					}

					if (res.locals.firstClickFreeModel) {
						viewModel.firstClickFree = res.locals.firstClickFreeModel;
					}

					return viewModel;
				})
				.then(function(viewModel) {

					if (!viewModel.body) {
						return viewModel;
					}

					var exampleArticles = [
						'402e1752-e1f1-11e4-bb7f-00144feab7de',
						'54fba5c4-e2d6-11e4-aa1d-00144feab7de'
					];

					if (res.locals.flags.articleComplexTransforms && exampleArticles.indexOf(viewModel.id) > -1) {
						return articleXSLT(viewModel.body, 'article').then(function(transformedBody) {
							viewModel.body = transformedBody;
							return viewModel;
						});
					}

					return viewModel;
				})
				.then(function(viewModel) {
					return res.render('article-v2', viewModel);
				});
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				return api.contentLegacy({ uuid: req.params.id, useElasticSearch: res.locals.flags.elasticSearchItemGet })
						.then(function(data) {
							if (data.item.location.uri.indexOf('?') > -1) {
								res.redirect(302, data.item.location.uri + "&ft_site=falcon");
							} else {
								res.redirect(302, data.item.location.uri + "?ft_site=falcon");
							}
						})
						.catch(function(err) {
							if (err instanceof fetchres.BadServerResponseError) {
								res.redirect(302, 'http://www.ft.com/cms/s/' + req.params.id + '.html?ft_site=falcon');
							} else {
								next(err);
							}
						});
			}
			next(err);
		});
};
