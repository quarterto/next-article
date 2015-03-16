'use strict';

var fetchCapiV1 = require('../utils/fetch-capi-v1');

module.exports = function(req, res, next) {
	if (req.get('X-FT-Access-Metadata') === 'remote_headers') {
		fetchCapiV1({
			uuid: req.params[0],
			useElasticSearch: res.locals.flags.elasticSearchItemGet.isSwitchedOn
		})
			.then(function(article) {
				var results = /cms\/s\/([0-3])\//i.exec(article.item.location.uri);
				var classification = 'unconditional';
				if (results.length > 1) {
					switch (results[1]) {
						case '0' :
						case '1' :
							classification = 'conditional_standard';
							break;
						case '2' :
							classification = 'unconditional';
							break;
						case '3' :
							classification = 'conditional_premium';
					}
				}

				res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
				res.vary('X-FT-UID');
				res.set('X-FT-UID', article.item.id);
				res.set('X-FT-Content-Classification', classification);
				res.status(200).end();
			}).catch(next);
	} else {
		next();
	}
};
