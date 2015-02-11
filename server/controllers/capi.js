/*global fetch*/
/*jshint node:true*/
'use strict';

var ft = require('../utils/api').ft;
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
var replaceHrs = require('../transforms/replace-hrs');
var replaceEllipses = require('../transforms/replace-ellipses');

var getMentions = function (annotations) {
	return annotations.filter(function (an) {
		return an.predicate.indexOf('mentions') > -1;
	}).map(function (an) {
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
	if (res.locals.flags.articlesFromContentApiV2.isSwitchedOn) {
		var contentEndpoint = res.locals.flags.streamsFromContentApiV2.isSwitchedOn ? 'enrichedcontent' : 'content';
		// Example article: http://int.api.ft.com/content/54307a12-37fa-11e3-8f44-002128161462
		// http://int.api.ft.com/enrichedcontent/3e9e7958-cffe-3257-bd84-41706f03f039 has more annotationss
		fetch('http://api.ft.com/' + contentEndpoint + '/' + req.params[0] + '?sjl=WITH_RICH_CONTENT', {
			headers: {
				'X-Api-Key': process.env.api2key
			}
		})
		.then(fetchres.json)
		.then(function(article) {
			res.vary(['Accept-Encoding', 'Accept']);
			res.set(cacheControl);

			switch(req.accepts(['html', 'json'])) {
				case 'html':
					article.bodyXML = replaceEllipses(article.bodyXML);
					article.bodyXML = replaceHrs(article.bodyXML);
					var $ = cheerio.load(article.bodyXML);
					//Add inline MPU slot
					var inlineMpuSlot = $('<div />').addClass('article__mpu').attr({
						'data-o-grid-colspan': '12 L0',
						'data-ad-mpu': 'xs'
					});
					$('p').eq(0).after(inlineMpuSlot);
					$('a[href*=\'#slide0\']').replaceWith(slideshowTransform);
					$('pull-quote').replaceWith(pullQuotesTransform);
					$('big-number').replaceWith(bigNumberTransform);
					$('ft-content').replaceWith(ftContentTransform);
					$('blockquote').attr('class', 'o-quote o-quote--standard');
					$('a').replaceWith(relativeLinksTransform);
					$('a').replaceWith(trimmedLinksTransform);

					article.bodyXML = $.html();
					article.bodyXML = article.bodyXML.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');
					if (res.locals.flags.streamsFromContentApiV2.isSwitchedOn) {
						article.mentions = getMentions(article.annotations);
					}
					article.id = article.id.replace('http://www.ft.com/thing/', '');

					// HACK - Force the last word in the title never to be an ‘orphan’
					article.titleHTML = article.title.replace(/(.*)(\s)/, '$1&nbsp;');
					res.render((res.locals.flags.articleTemplate2.isSwitchedOn ? 'layout_2-improved' : 'layout_2'), {
						article: article,
						title: article.title,
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
				res.status(404).end();
			} else {
				next(err);
			}
		});

	} else {
		ft
		.get(req.params[0])
		.then(function (article) {
			res.vary(['Accept-Encoding', 'Accept']);
			res.set(cacheControl);

			switch(req.accepts(['html', 'json'])) {
				case 'html':
					res.render('layout', {
						article: article,
						layout: 'wrapper'
					});
					break;

				case 'json':
					res.set(cacheControl);
					res.json(article);
					break;

				default:
					res.status(406).end();
					break;

			}

		})
		.catch(next);
	}
};
