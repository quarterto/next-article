'use strict';

var fetchres = require('fetchres');
var errorsHandler = require('express-errors-handler');
var catchNetworkErrors = require('./catch-network-errors');

module.exports = function(opts) {
	var uuid = opts.uuid;
	var useElasticSearch = opts.useElasticSearch;

	if (useElasticSearch && !process.env.ELASTIC_SEARCH_URL) {
		useElasticSearch = false;
		errorsHandler.captureMessage('Cannot use elastic search without an ELASTIC_SEARCH_URL', {
			tags: {
				service: 'capiv1'
			}
		})
	}

	var url = useElasticSearch
		? process.env.ELASTIC_SEARCH_URL + '/' + uuid
		: 'http://api.ft.com/content/items/v1/' + uuid + '?feature.blogposts=on';

	return fetch(url, {
			timeout: 3000,
			headers: {
				'X-Api-Key': process.env.apikey
			}
		})
			.catch(catchNetworkErrors)
			.then(function(response) {
				if (!response.ok) {
					errorsHandler.captureMessage('Failed getting "' + uuid + '"', {
						tags: {
							service: 'capiv1',
							status: response.status
						}
					})
				}
				return response;
			})
			.then(fetchres.json)
			.then(function(data) {
				return useElasticSearch ? data._source : data;
			});
};
