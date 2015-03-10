'use strict';

module.exports = function(req, res, next) {
	var apiKey = res.locals.flags.articlesFromContentApiV2.isSwitchedOn ? process.env.apikey : process.env.api2key;
	var api = require('ft-api-client')(apiKey);
	if (req.get('X-FT-Access-Metadata') === 'remote_headers') {
		api.get(req.params[0]).then(function(article){
			res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
			res.vary('X-FT-UID');
			res.set('X-FT-UID', article.id);
			res.set('X-FT-Content-Classification', article.contentClassification);
			res.status(200).end();
		}).catch(next);
	} else {
		next();
	}
};
