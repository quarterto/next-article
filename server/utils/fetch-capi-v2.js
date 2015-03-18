'use strict';

var fetchres = require('fetchres');

module.exports = function(opts) {
	var uuid = opts.uuid;
	var url = 'http://api.ft.com/content/' + uuid + '?sjl=WITH_RICH_CONTENT';

	return fetch(url, {
			timeout: 3000,
			headers: {
				'X-Api-Key': process.env.api2key
			}
		})
			.then(function(response) {
				if (!response.ok) {
					console.log("Got " + response.status + " for capi v2 uuid " + uuid);
				}
				return response;
			})
			.then(fetchres.json);
};
