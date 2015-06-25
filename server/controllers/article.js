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
var htmlToText = require('html-to-text');
var bodyTransform = require('../transforms/body');
var getVisualCategorisation = require('ft-next-article-genre');

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

			var $ = bodyTransform(article.bodyXML, res.locals.flags);
			var $crossheads = $('.article__subhead--crosshead');
			var primaryTag = articleV1 && articleV1.item && articleV1.item.metadata ? articlePrimaryTag(articleV1.item.metadata) : undefined;
			if (primaryTag) {
				primaryTag.conceptId = res.locals.flags.userPrefsUseConceptId ? primaryTag.id : (primaryTag.taxonomy + ':"' + encodeURIComponent(primaryTag.name) + '"');
				primaryTag.url = '/stream/' + primaryTag.taxonomy + 'Id/' + primaryTag.id;
			}

			// Some posts (e.g. FastFT are only available in CAPI v2)
			// TODO: Replace with something in CAPI v2
			var isColumnist = articleV1 && articleV1.item.metadata.primarySection.term.name === 'Columnists';

			// Update the images (resize, add image captions, etc)
			return images($, { fullWidthMainImages: res.locals.flags.fullWidthMainImages })
				.then(function($) {
					var viewModel = {
						firstClickFree: null,
						comments: {},
						article: article,
						articleV1: articleV1 && articleV1.item,
						id: extractUuid(article.id),
						// HACK - Force the last word in the title never to be an ‘orphan’
						title: article.title.replace(/(.*)(\s)/, '$1&nbsp;'),
						byline: bylineTransform(article.byline, articleV1),
						tags: extractTags(article, articleV1, res.locals.flags),
						body: $.html(),
						crossheads: $crossheads.map(function() {
							var $crosshead = $(this);
							return {
								text: $crosshead.text(),
								id: $crosshead.attr('id')
							};
						}).get(),
						tableOfContents: res.locals.flags.articleTOC && $crossheads.length > 2,
						isColumnist: isColumnist,
						// if there's a main image, or slideshow or video, we overlap them on the header
						headerOverlap:
							$.root().children('.article__main-image, ft-slideshow:first-child, .article__video-wrapper:first-child').length || $.root().first().children('.article__main-image'),
						layout: 'wrapper',
						primaryTag: primaryTag,
						save: {},
						relatedContent: res.locals.flags.articleRelatedContent,
						moreOns: {},
						meta: {},
						visualCat: (articleV1 && articleV1.item && articleV1.item.metadata) ? getVisualCategorisation(articleV1.item.metadata) : null
					};

					if (res.locals.barrier) {

						if(res.locals.barrier.trialSimple) {
							viewModel.trialSimpleBarrier = res.locals.barrier.trialSimple;
						}

						if(res.locals.barrier.trialGrid) {
							viewModel.trialGridBarrier = res.locals.barrier.trialGrid;
						}

						if(res.locals.barrier.subscriptionGrid) {
							viewModel.subscriptionGridBarrier = res.locals.barrier.subscriptionGrid;
						}

						if(res.locals.barrier.premiumSimple) {
							viewModel.premiumSimpleBarrier = res.locals.barrier.premiumSimple;
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
						viewModel.meta = null;
					}

					if (res.locals.firstClickFreeModel) {
						viewModel.firstClickFree = res.locals.firstClickFreeModel;
					}

					return res.render('article-v2', viewModel);
				});
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				return api.contentLegacy({ uuid: req.params.id })
						.then(function(data) {
							if (res.locals.flags.articleCapiV1Fallback) {
								var article = data.item;
								res.render('article-v1', {
									falconUrl: data.item.location.uri,
									id: article.id,
									title: article.title.title,
									standFirst: article.editorial.standFirst,
									byline: article.editorial.byline,
									body: '<p>' + htmlToText.fromString(article.body.body, {
											wordwrap: false,
											ignoreHref: true,
											ignoreImage: true
										}).replace(/\n/g, "</p>\n<p>") + '</p>',
									publishedDate: article.lifecycle.lastPublishDateTime,
									layout: 'wrapper'
								});
							} else {
								res.render('layout-404', { layout: 'wrapper', url: data.item.location.uri });
							}
						})
						.catch(function(err) {
							if (err instanceof fetchres.BadServerResponseError) {
								res.render('article-v1', {
									title: 'Article not available in the new version of FT.com',
									layout: 'wrapper',
									falconUrl: 'http://www.ft.com/cms/s/' + req.params.id + '.html'
								});
							} else {
								next(err);
							}
						});
			}
			next(err);
		});
};
