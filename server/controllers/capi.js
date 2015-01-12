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

	if(res.locals.flags.articlesFromContentApiV2.isSwitchedOn) {
		//Example article: http://int.api.ft.com/content/834ffdf2-728c-11e1-9be9-00144feab49a
		fetch('http://int.api.ft.com/content/54307a12-37fa-11e3-8f44-002128161462', {
			headers: {
			  'X-Api-Key': process.env.api2key
			}
		})
		.then(function(response) {
			if (response.status >= 400) {
            	throw new Error("Bad response from server");
        	}
        	return response.json();
        })
        .then(function(response) {
			var article = response;
			res.render('layout_2', { article: article });
			//res.json(response);
		})
		.catch(next);
		
	} else {
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
	}
};
