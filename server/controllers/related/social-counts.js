'use strict';

const fetchres = require('fetchres');
const cacheControl = require('../../utils/cache-control');

function getShareCounts(articleUrl) {
	let url = 'https://ft-next-sharedcount-api.herokuapp.com/v1/getCounts?groupby=url' +
			'&services=facebook,gplus,twitter,stumbleupon,reddit&metrics=comments,shares,votes,endorsements&source=spoor' +
			'&urls=' + articleUrl;
	return fetch(url, { timeout: 3000 })
		.then(fetchres.json);
};


module.exports = function(req, res, next) {
	let url = req.query.url;
	let id = req.params.id;

	getShareCounts(url)
		.then(function(results) {
			let shareCounts = results[url]; //Grouped results return a key of undefined
			res.set(cacheControl);
			res.json({
				shares: shareCounts
			})
		})
		.catch(next);
}
