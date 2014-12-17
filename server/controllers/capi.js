/*jshint node:true*/
'use strict';

var Stream = require('../models/stream');
var ft = require('../utils/api').ft;
var Metrics = require('next-metrics');
var cacheControl = require('../utils/cache-control');

/*
	Takes data from the content api and returns it in the required format
*/

module.exports = function(req, res, next) {

	Metrics.instrument(res, { as: 'express.http.res' });

	ft
		.get([req.params[0]])
		.then(function (articles) {
			var article = articles[0];
			res.vary(['Accept-Encoding', 'Accept']);
			res.set(cacheControl);
			article = {
				id: article.id,
				authors: article.authors,
				people: article.people,
				organisations: article.organisations,
				regions: article.regions,
				topics: article.topics,
				headline: article.headline,
				lastUpdated: article.lastUpdated,
				standFirst: article.standFirst,
				primarySection: article.primarySection,
				body: [
					article.paragraphs(0, 2, { removeImages: false }).toString(),
					article.paragraphs(2, 100, { removeImages: false }).toString()
				],
				largestImage: article.largestImage,
				has_gallery: article.has_gallery,
				video: article.video,
				has_video: article.has_video,
				showMedia: article.showMedia,
				wordCount: article.wordCount,
				readingTime: article.readingTime
			};

			switch(req.accepts(['html', 'json'])) {
				case 'html':
					res.render('layout', { article: article });
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
};
