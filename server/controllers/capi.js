'use strict';

var Metrics = require('next-metrics');
var cacheControl = require('../utils/cache-control');
var fetchres = require('fetchres');
var cheerio = require('cheerio');
var pullQuotesTransform = require('../transforms/pull-quotes');
var bigNumberTransform = require('../transforms/big-number');
var ftContentTransform = require('../transforms/ft-content');
var relativeLinksTransform = require('../transforms/relative-links');
var slideshowTransform = require('../transforms/slideshow');
var trimmedLinksTransform = require('../transforms/trimmed-links');
var pHackTransform = require('../transforms/p-hack');
var subheadersTransform = require('../transforms/subheaders');
var addSubheaderIds = require('../transforms/add-subheader-ids');
var replaceHrs = require('../transforms/replace-hrs');
var replaceEllipses = require('../transforms/replace-ellipses');
var pStrongsToH3s = require('../transforms/p-strongs-to-h3s');
var externalImgTransform = require('../transforms/external-img');

var getMentions = function(annotations) {
	annotations = annotations || [];
	return annotations.filter(function(an) {
		return an.predicate.indexOf('mentions') > -1;
	}).map(function(an) {

		//TODO : this should go in next-express topicUrl helper
		try {
			var pluralisedType = an.type === 'PERSON' ? 'people' : an.type.toLowerCase() + 's';
			return {
				url: '/stream/' + pluralisedType + '/' + an.uri.split('/').pop(),
				name: an.label
			};
		} catch (e) {
			return {
				url: '#',
				name: 'unavailable'
			};
		}
	});
};

module.exports = function(req, res, next) {
	Metrics.instrument(res, { as: 'express.http.res' });

	var articleV1Promise = fetch('http://api.ft.com/content/items/v1/' + req.params[0], {
			timeout: 3000,
			headers: {
				'X-Api-Key': process.env.apikey
			}
		});
	var articleV2Promise = fetch('http://api.ft.com/content/' + req.params[0] + '?sjl=WITH_RICH_CONTENT', {
			timeout: 3000,
			headers: {
				'X-Api-Key': process.env.api2key
			}
		});

	Promise.all([articleV1Promise, articleV2Promise])
		.then(fetchres.json)
		.then(function(articles) {
			var articleV1 = articles[0],
				article = articles[1];

			res.vary(['Accept-Encoding', 'Accept']);
			res.set(cacheControl);
			switch(req.accepts(['html', 'json'])) {
				case 'html':
					article.bodyXML = replaceEllipses(article.bodyXML);
					article.bodyXML = replaceHrs(article.bodyXML);
					article.bodyXML = pStrongsToH3s(article.bodyXML);
					var $ = cheerio.load(article.bodyXML);

					$('a[href*=\'#slide0\']').replaceWith(slideshowTransform);
					$('big-number').replaceWith(bigNumberTransform);
					$('img').replaceWith(externalImgTransform);
					$('ft-content').replaceWith(ftContentTransform);
					$('p').replaceWith(pHackTransform);
					$('blockquote').attr('class', 'article__block-quote o-quote o-quote--standard');
					$('pull-quote').replaceWith(pullQuotesTransform);

					// HACK - Fix for paragraphs in blockquotes
					$('blockquote > ft-paragraph').replaceWith(function(index, el) {
						el = $(el);
						return '<p>' + el.html() + '</p>';
					});
					$('a').replaceWith(relativeLinksTransform);
					$('a').replaceWith(trimmedLinksTransform);

					var subheaders = $('.ft-subhead')
						.attr('id', addSubheaderIds)
						.replaceWith(subheadersTransform);

					article.bodyXML = $.html();

					article.bodyXML = article.bodyXML.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');
					article.mentions = getMentions(article.annotations);
					article.id = article.id.replace('http://www.ft.com/thing/', '');

					// HACK - Force the last word in the title never to be an ‘orphan’
					article.titleHTML = article.title.replace(/(.*)(\s)/, '$1&nbsp;');

					if (article.mainImage) {
						article.mainImage = article.mainImage.id.replace(/^http:\/\/api\.ft\.com\/content\//, '');
					}

					res.render('layout', {
						article: article,
						articleV1: articleV1.item,
						title: article.title,
						mainImage: article.mainImage,
						subheaders: subheaders.map(function() {
							var $subhead = $(this);

							return {
								text: $subhead.find('.ft-subhead__title').text(),
								id: $subhead.attr('id')
							};
						}).get(),
						showTOC: res.locals.flags.articleTOC.isSwitchedOn && subheaders.length > 2,
						layout: 'wrapper'
					});
					break;

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
				return fetch('http://api.ft.com/content/items/v1/' + req.params[0] + '?feature.blogposts=on', {
					timeout: 3000,
					headers: {
						'X-Api-Key': process.env.apikey
					}
				})
					.then(fetchres.json)
					.then(function(data) {
						res.render('layout_404', { layout: 'wrapper', url: data.item.location.uri });
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
