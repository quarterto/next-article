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
			.then(fetchres.json);
};
