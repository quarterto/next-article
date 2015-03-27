'use strict';

var fetchres = require('fetchres');
var catchNetworkErrors = require('./catch-network-errors');
var logger = require('ft-next-logger');

module.exports = function(opts) {
	var uuid = opts.uuid;
	var type = opts.type || 'unknown';
	var url = 'http://api.ft.com/content/' + uuid + '?sjl=WITH_RICH_CONTENT';

	return fetch(url, {
			timeout: 3000,
			headers: {
				'X-Api-Key': process.env.api2key
			}
		})
			.catch(catchNetworkErrors)
			.then(function(response) {
				if (!response.ok) {
					logger.warn('Failed getting CAPIv2 content', {
						uuid: uuid,
						type: type,
						status: response.status
					});
				}
				return response;
			})
			.then(fetchres.json);
};
