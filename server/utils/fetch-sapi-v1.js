'use strict';

var fetchres = require('fetchres');
var fetchCapiV2 = require('../utils/fetch-capi-v2');

module.exports = function(opts) {
	var query = opts.query;
	var count = opts.count;
	var url = 'http://api.ft.com/content/search/v1';

	var body = {
		queryString: query,
		queryContext: {
			curations: ["ARTICLES", "BLOGS"]
		}
	};

	if (count) {
		body.resultContext = {
			maxResults: count,
			offset: 0
		};
	}

	return fetch(url, {
			timeout: 3000,
			body: JSON.stringify(body),
			method: 'post',
			headers: {
				'Content-Type': 'application/json',
				'X-Api-Key': process.env.apikey
			}
		})
			.then(fetchres.json)
			.then(function(result) {
				result = Promise.all(result.results[0].results.map(function(article) {
					return fetchCapiV2({
						uuid: article.id
					})
						.catch(function(err) {
							if (err instanceof fetchres.BadServerResponseError) {
								return undefined;
							} else {
								throw err;
							}
						});
				}))
					.then(function(articles) {
						return articles.filter(function(article) {
								return article;
							});
					});
				return result;
			});
};
