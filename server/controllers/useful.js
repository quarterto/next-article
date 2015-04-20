'use strict';

var fetchres = require('fetchres');
var cacheControl = require('../utils/cache-control');

module.exports = function(req, res, next) {
	console.log('Basic ' + (new Buffer('next:' + process.env.NEXT_BEACON_DASHBOARD_KEY)).toString('base64'));
	fetch('https://ft-next-beacon-dashboard.herokuapp.com/api?event_collection=cta&metric=count_unique&domPathContains=how-useful%20%7C%20yes&group_by=page.location.pathname&timeframe=this_7_days&interval=weekly&target_property=user.erights', {
			headers: {
				Authorization: 'Basic ' + (new Buffer('next:' + process.env.NEXT_BEACON_DASHBOARD_KEY)).toString('base64')
			},
			timeout: 10000
		})
		.then(fetchres.json)
		.then(function(data) {
			console.log(data);
			res.set(cacheControl);
			res.json(data.result[1]);
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.sendStatus(404);
			} else {
				next(err);
			}

		});
};
