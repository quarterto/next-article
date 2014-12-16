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
			res.vary(['Accept-Encoding', 'Accept']);

			console.log(req.accepts(['html', 'json']));
			switch(req.accepts(['html', 'json'])) {
					case 'html':

						var stream = new Stream();
						var title = undefined;

						//consider refactoring 'stream' to push to a key of 'capi' rather than 'methode'
						//and alter those places which use this object?
						articles.forEach(function (article) {
							stream.push('methode', article);
							title = article.headline;
						});

						res.set(cacheControl);
						res.render('layout', {
							mode: 'expand',
							isArticle: true,
							stream: { items: stream.items, meta: { facets: [] }}, // FIXME add facets back in, esult.meta.facets)
							isFollowable: true,
							title: title
						});


						break;

					case 'json':

						var article = articles[0];
						require('../utils/cache-control')(res);
						res.json({
							id: article.id,
							headline: article.headline,
							largestImage: article.largestImage,
							body: [
									article.paragraphs(0, 2, { removeImages: false }).toString(),
									article.paragraphs(2, 100, { removeImages: false }).toString()
								]
							});
						break;
					default:

						res.status(406).end();
						break;
				}

		})
       		.catch(next);
};
