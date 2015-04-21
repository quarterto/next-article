'use strict';

var fetchres = require('fetchres');
var cacheControl = require('../utils/cache-control');
var api = require('next-ft-api-client');

module.exports = function(req, res, next) {
	fetch('https://ft-next-beacon-dashboard.herokuapp.com/api?event_collection=cta&metric=count_unique&domPathContains=how-useful%20%7C%20yes&group_by=page.location.pathname&timeframe=this_7_days&interval=weekly&target_property=user.erights', {
			headers: {
				Authorization: 'Basic ' + (new Buffer('next:' + process.env.NEXT_BEACON_DASHBOARD_KEY)).toString('base64')
			},
			timeout: 10000
		})
		.then(fetchres.json)
		.then(function(data) {
			res.set(cacheControl);
			var uuids = data.result[1].value.sort(function(a, b) {
					if (a.result < b.result) {
						return 1;
					}
					if (a.result > b.result) {
						return -1;
					}
					return 0;
				})
				.map(function(article) {
					return article['page.location.pathname'];
				})
				.splice(0, 5);

			return api.content({
				uuid: uuids,
				useElasticSearch: res.locals.flags.elasticSearchItemGet
			});
		})
		.then(function(articles) {
			articles = articles.map(function(article) {
				article.id = article.id.replace('http://www.ft.com/thing/', '');
				return article;
			});
			res.render('useful', {
				wrapper: 'vanilla',
				articles: articles
			});
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.sendStatus(404);
			} else {
				next(err);
			}

		});
};
