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
					if (fetchres.originatedError(err)) {
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

		return api.content({ uuid: extractUuid(articleV2.mainImage.id), type: 'ImageSet', retry: 0 })
			.then(function (images) {
				var image = images.members.reduce(function (a, b) {
					return a;
				});
				return api.content({ uuid: extractUuid(image.id), type: 'ImageSet', retry: 0 });
			})
			.catch(function(err) {
				if (fetchres.originatedError(err)) {
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
					fullWidthMainImages: res.locals.flags.fullWidthMainImages ? 1 : 0,
					reserveSpaceForMasterImage: res.locals.flags.reserveSpaceForMasterImage ? 1 : 0
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

			var metadata = articleV1 && articleV1.item && articleV1.item.metadata;
			var primaryTag = metadata ? articlePrimaryTag(metadata) : undefined;
			if (primaryTag) {
				primaryTag.conceptId = primaryTag.id;
				primaryTag.url = '/stream/' + primaryTag.taxonomy + 'Id/' + primaryTag.id;
			}

			// Some posts (e.g. FastFT are only available in CAPI v2)
			// TODO: Replace with something in CAPI v2
			var isColumnist = metadata && metadata.primarySection.term.name === 'Columnists';

			// Update the images (resize, add image captions, etc)
			return images($, {
				fullWidthMainImages: res.locals.flags.fullWidthMainImages,
			})
				.then(function($) {
					var viewModel = {
						firstClickFree: null,
						comments: article.comments && article.comments.enabled === true,
						article: article,
						articleV1: articleV1 && articleV1.item,
						id: extractUuid(article.id),
						title: article.title,
						byline: bylineTransform(article.byline, articleV1),
						tags: extractTags(article, articleV1, res.locals.flags, primaryTag),
						body: $.html(),
						toc: $.html('.article__toc'),
						isColumnist: isColumnist,
						layout: 'wrapper',
						primaryTag: primaryTag,
						save: {},
						relatedContent: res.locals.flags.articleRelatedContent,
						shareButtons: res.locals.flags.articleShareButtons,
						myFTTray: res.locals.flags.myFTTray,
						moreOns: {},
						dfp: metadata ? getDfp(metadata.sections) : undefined,
						visualCat: metadata ? getVisualCategorisation(metadata) : undefined,
						isSpecialReport: metadata &&
							metadata.primarySection.term.taxonomy === 'specialReports'
					};

					if (metadata) {
						var moreOnTags = [];
						// primary theme first
						if (metadata.primaryTheme) {
							var primaryThemeTag = metadata.primaryTheme.term;
							primaryThemeTag.metadata = 'primaryTheme';
							moreOnTags.push(primaryThemeTag);
						}
						// then author, if this is in a 'Columnists' section and not a duplication of the primaryTheme
						if (
							metadata.primarySection.term.name === 'Columnists' &&
							metadata.authors.length &&
							(!moreOnTags.length || metadata.authors[0].term.id !== moreOnTags[0].id)
						) {
							var authorTag = metadata.authors[0].term;
							authorTag.metadata = 'authors';
							moreOnTags.push(authorTag);
						}
						// finally the primarySection
						var primarySectionTag = metadata.primarySection.term;
						primarySectionTag.metadata = 'primarySection';
						moreOnTags.push(primarySectionTag);
						viewModel.moreOns = moreOnTags
							.slice(0, 2)
							.map(function (moreOnTag) {
								return {
									name: moreOnTag.name,
									url: '/stream/' +  moreOnTag.taxonomy + 'Id/' + moreOnTag.id,
									taxonomy: moreOnTag.taxonomy,
									metadata: moreOnTag.metadata
								};
							});
						// add 'small' class if just one
						viewModel.moreOns[viewModel.moreOns.length === 1 ? 0 : 1].class = 'more-on--small';
					}

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

						if(res.locals.barrier.premiumGrid) {
							viewModel.premiumGridBarrier = res.locals.barrier.premiumGrid;
							viewModel.barrierOverlay = {};
							viewModel.premiumGridBarrier.articleTitle = viewModel.title;
						}

						viewModel.comments = null;
						viewModel.body = null;
						if (viewModel.articleV1) {
							viewModel.articleV1.editorial.standFirst = null;
						}
						viewModel.byline = null;
						viewModel.article.publishedDate = null;
						viewModel.tableOfContents = null;
						viewModel.primaryTag = null;
						viewModel.save = null;
						viewModel.tags = null;
						viewModel.relatedContent = null;
						viewModel.moreOns = null;
						viewModel.shareButtons = null;
						viewModel.myFTTray = null;
					}

					if (res.locals.firstClickFreeModel) {
						viewModel.firstClickFree = res.locals.firstClickFreeModel;
					}

					return viewModel;
				})
				.then(function(viewModel) {
					return res.render('article-v2', viewModel);
				});
		})
		.catch(function(err) {
			if (fetchres.originatedError(err)) {
				return api.contentLegacy({ uuid: req.params.id, useElasticSearch: res.locals.flags.elasticSearchItemGet })
						.then(function(data) {
							if (data.item.location.uri.indexOf('?') > -1) {
								res.redirect(302, data.item.location.uri + "&ft_site=falcon&desktop=true");
							} else {
								res.redirect(302, data.item.location.uri + "?ft_site=falcon&desktop=true");
							}
						})
						.catch(function(err) {
							if (fetchres.originatedError(err)) {
								res.redirect(302, 'http://www.ft.com/cms/s/' + req.params.id + '.html?ft_site=falcon&desktop=true');
							} else {
								next(err);
							}
						});
			}
			next(err);
		});
};
