/*jshint node:true*/
'use strict';

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
