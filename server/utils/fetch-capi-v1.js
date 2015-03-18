'use strict';

var fetchres = require('fetchres');

module.exports = function(opts) {
	var uuid = opts.uuid;
	var useElasticSearch = opts.useElasticSearch;
	var url = useElasticSearch
		? process.env.ELASTIC_SEARCH_URL + '/' + uuid
		: 'http://api.ft.com/content/items/v1/' + uuid + '?feature.blogposts=on';

	return fetch(url, {
			timeout: 3000,
			headers: {
				'X-Api-Key': process.env.apikey
			}
		})
			.then(function(response) {
				if (!response.ok) {
					console.log("Got " + response.status + " for capi v1 uuid " + uuid);
				}
				return response;
			})
			.then(fetchres.json)
			.then(function(data) {
				return useElasticSearch ? data._source : data;
			});
};
