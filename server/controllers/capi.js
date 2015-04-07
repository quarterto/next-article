'use strict';

var api = require('next-ft-api-client');
var cacheControl = require('../utils/cache-control');
var fetchres = require('fetchres');
var cheerio = require('cheerio');
var pullQuotesTransform = require('../transforms/pull-quotes');
var bigNumberTransform = require('../transforms/big-number');
var ftContentTransform = require('../transforms/ft-content');
var relativeLinksTransform = require('../transforms/relative-links');
var slideshowTransform = require('../transforms/slideshow');
var trimmedLinksTransform = require('../transforms/trimmed-links');
var subheadersTransform = require('../transforms/subheaders');
var addSubheaderIds = require('../transforms/add-subheader-ids');
var replaceHrs = require('../transforms/replace-hrs');
var replaceEllipses = require('../transforms/replace-ellipses');
var pStrongsToH3s = require('../transforms/p-strongs-to-h3s');
var externalImgTransform = require('../transforms/external-img');
var removeBodyTransform = require('../transforms/remove-body');
var images = require('../transforms/images');
var bylineTransform = require('../transforms/byline');
var promoBoxTransform = require('../transforms/promo-box');

function getUuid(id) {
	return id.replace('http://www.ft.com/thing/', '');
}

module.exports = function(req, res, next) {
	var articleV1Promise = api.contentLegacy({
			uuid: req.params[0],
			useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
		})
			// Some things aren't in CAPI v1 (e.g. FastFT)
			.catch(function(err) {
				if (err instanceof fetchres.BadServerResponseError) {
					return;
				} else {
					throw err;
				}
			});

	var articleV2Promise = api.content({
		uuid: req.params[0],
		type: 'Article',
		metadata: true
	});

	Promise.all([articleV1Promise, articleV2Promise])
		.then(function(articles) {
			var articleV1 = articles[0];
			var article = articles[1];

			res.vary(['Accept-Encoding', 'Accept']);
			res.set(cacheControl);
			switch(req.accepts(['html', 'json'])) {
				case 'html':
					var body = article.bodyXML;

					// HACK around a bug in the content api by replacing <br></br> with <br>
					// See: http://api.ft.com/content/e80e2706-c7ec-11e4-8210-00144feab7de
					body = body.replace(/<br><\/br>/g, '<br>');
					body = replaceEllipses(body);
					body = replaceHrs(body);
					body = body.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');
					var $ = cheerio.load(body);

					$('body > p').replaceWith(pStrongsToH3s);
					$('a[href$="#slide0"]').replaceWith(slideshowTransform);
					$('big-number').replaceWith(bigNumberTransform);
					$('img').replaceWith(externalImgTransform);
					$('ft-content').not('[type$="ImageSet"]').replaceWith(ftContentTransform);
					$('blockquote').attr('class', 'article__block-quote o-quote o-quote--standard');
					$('pull-quote').replaceWith(pullQuotesTransform);
					$('promo-box').replaceWith(promoBoxTransform);

					// insert inline related
					if ($('body > p').length >= 6) {
						var paraHook = $('body > p').get(3);
						$(paraHook).after('<div class="js-more-on-inline" data-trackable="more-on-inline"></div>');
					}

					$('body').replaceWith(removeBodyTransform);
					$('a').replaceWith(relativeLinksTransform);
					$('a').replaceWith(trimmedLinksTransform);
					$('a').attr('data-trackable', 'link');

					var $subheaders = $('.ft-subhead')
						.attr('id', addSubheaderIds)
						.replaceWith(subheadersTransform);

					var primarySection = (function () {
						try {
							return {
								title: articleV1.item.metadata.primaryTheme.term.name,
								url: '/stream/' + articleV1.item.metadata.primaryTheme.term.taxonomy + '/' + encodeURIComponent(articleV1.item.metadata.primaryTheme.term.name),
								conceptId: articleV1.item.metadata.primaryTheme.term.taxonomy + ':"' + encodeURIComponent(articleV1.item.metadata.primaryTheme.term.name) + '"'
							};
						} catch (e) {
							return {
								title: '',
								url: '/'
							};
						}
					})();
					var mentions = (article.annotations || [])
						.filter(function(annotation) {
							return annotation.predicate === 'http://www.ft.com/ontology/annotation/mentions';
						})
						.map(function(annotation) {
							return {
								label: annotation.label,
								url: annotation.apiUrl.replace(/^http:\/\/api\.ft\.com\//, '')
							};
						});

					// Update the images (resize, add image captions, etc)
					return images($, res.locals.flags)
						.then(function ($) {
							return res.render('layout', {
								article: article,
								articleV1: articleV1 && articleV1.item,
								id: getUuid(article.id),
								// HACK - Force the last word in the title never to be an ‘orphan’
								title: article.title.replace(/(.*)(\s)/, '$1&nbsp;'),
								byline: bylineTransform(article.byline, articleV1),
								body: $.html(),
								subheaders: $subheaders.map(function() {
									var $subhead = $(this);
									return {
										text: $subhead.find('.article__subhead__title').text(),
										id: $subhead.attr('id')
									};
								}).get(),
								showTOC: res.locals.flags.articleTOC.isSwitchedOn && $subheaders.length > 2,
								isColumnist: primarySection.title === 'Columnists',
								// if there's a video or sideshow first, we overlap them on the header
								headerOverlap:
									$('> .article__main-image').length ||
									$('> a:first-child').attr('data-asset-type') === 'video' ||
									$('> ft-slideshow:first-child').length,
								layout: 'wrapper',
								headerData: {
									isStream: false,
									section: primarySection
								},
								mentions: mentions
							});
						});

				case 'json':
					res.set(cacheControl);
					res.set('Content-Type: application/json');
					res.send(JSON.stringify(article, undefined, 2));
					res.end();
					break;
			}
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				api.contentLegacy({
						uuid: req.params[0],
						useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
					})
						.then(function(data) {
							res.render('layout-404', { layout: 'wrapper', url: data.item.location.uri });
						})
						.catch(function(err) {
							if (err instanceof fetchres.BadServerResponseError) {
								res.status(404).end();
							} else {
								next(err);
							}
						});
			} else {
				next(err);
			}
		});
};
