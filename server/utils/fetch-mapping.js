'use strict';

var fetchres = require('fetchres');
var catchNetworkErrors = require('./catch-network-errors');
var logger = require('./logger');

module.exports = function(uuid, taxonomy, opts) {
	var url = 'https://next-v1tov2-mapping-dev.herokuapp.com/concordance_mapping_v1tov2/' + taxonomy + '/' + uuid;

	return fetch(url, {
			timeout: 3000,
			headers: {
				'X-Api-Key': process.env.apikey
			}
		})
			.catch(catchNetworkErrors)
			.then(function(response) {
				if (!response.ok) {
					logger.warn('Failed getting mapping', {
						uuid: uuid,
						taxonomy: taxonomy,
						status: response.status
					});
				}
				return response;
			})
			.then(fetchres.json)
			.then(function(data) {
				return data.concordance_map.v2;
			});
};
