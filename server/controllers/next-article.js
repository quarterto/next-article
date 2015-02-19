'use strict';

var ft = require('../utils/api').ft;
var Metrics = require('next-metrics');
var cacheControl = require('../utils/cache-control');
var fetchres = require('fetchres');
var cheerio = require('cheerio');
require('es6-promise').polyfill();
var pullQuotesTransform = require('../transforms/pull-quotes');
var bigNumberTransform = require('../transforms/big-number');
var ftContentTransform = require('../transforms/ft-content');
var relativeLinksTransform = require('../transforms/relative-links');
var slideshowTransform = require('../transforms/slideshow');
var trimmedLinksTransform = require('../transforms/trimmed-links');
var replaceHrs = require('../transforms/replace-hrs');
var replaceEllipses = require('../transforms/replace-ellipses');
var request = require('request');

function fetchArticle(uid){
	var url = 'http://api.ft.com/content/items/v1/' + uid;
	console.log('fetch ' + url);
	return fetch(url, {
		headers: {
			'X-Api-Key': process.env.api2key
		}
	})
	.then(fetchres.json)
	.then(function(article) {
		return article.item;
	})
	.catch(function(e){
		console.error(e);
	});
}

function getCurrentArticleSection(uid){
	return fetchArticle(uid)
	.then(function(item) {
		return item.metadata.primarySection.term;
	})
	.catch(function(e){
		console.error(e);
	});
};

function getArticleSectionList(section){
	var requestbody = {
		"queryString" : "primarySectionId:=\"" + section.id +  "\"",
		"queryContext" : {
			"curations" : [ "ARTICLES"]
		}
	};


	return new Promise(function(resolve, reject){
		console.log('request articles in section ' + section.name + ' with id ' + section.id);
		request({
			method : "POST",
			uri : 'http://contentapi.ft.com/content/search/v1/',
			json : requestbody,
			headers : {
				'X-Api-Key': process.env.api2key
			}
		}, function(err, mess, response){
			if(err){
				return reject(err);
			}

			console.log(response);
			resolve(response.results[0].results.map(function(result){
				return result.id;
			}));
		});
	});
}

function getNextArticle(articleList, currentId){
	for(var i= 0, l=articleList.length; i<l; i++){
		if(articleList[i] === currentId){
			return articleList[i+1];
		}
	}
}

module.exports = function(req, res, next){
	var uid = req.params[0];
	getCurrentArticleSection(uid)
	.then(getArticleSectionList)
	.then(function(articles) {
		var nextArticle = getNextArticle(articles, uid);
		return fetchArticle(nextArticle);
	}).then(function(article){
				require('fs').writeFileSync('article.json', JSON.stringify(article, null, 4), {encoding:'utf8'});
				res.vary(['Accept-Encoding', 'Accept']);
				res.set(cacheControl);

				switch(req.accepts(['html', 'json'])) {
					case 'html':
						article.bodyXML = replaceEllipses(article.body.body);
						article.bodyXML = replaceHrs(article.body.body);
						var $ = cheerio.load(article.body.body);
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
						article.bodyXML = article.body.body.replace(/<\/a>\s+([,;.:])/mg, '</a>$1');
						if (res.locals.flags.streamsFromContentApiV2.isSwitchedOn) {
							article.mentions = getMentions(article.annotations);
						}
						article.id = article.id.replace('http://www.ft.com/thing/', '');

						// HACK - Force the last word in the title never to be an ‘orphan’
						article.titleHTML = article.title.title.replace(/(.*)(\s)/, '$1&nbsp;');
						res.render((res.locals.flags.articleTemplate2.isSwitchedOn ? 'layout_2-improved' : 'layout_2'), {
							article: article,
							title: article.title.title,
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
	}).catch(function(e){
		console.error(e);
		console.error(e.stack);
	});
};
