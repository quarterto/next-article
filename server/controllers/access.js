'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');

function suppressBadResponses(err) {
	if (fetchres.originatedError(err)) {
		return;
	} else {
		throw err;
	}
}

module.exports = function(req, res, next) {
	if (req.get('X-FT-Access-Metadata') === 'remote_headers') {
		Promise.all([
			api.contentLegacy({ uuid: req.params.id, useElasticSearch: res.locals.flags.elasticSearchItemGet }).catch(suppressBadResponses),
			api.content({ uuid: req.params.id, useElasticSearch: res.locals.flags.elasticSearchItemGet }).catch(suppressBadResponses)
		])
			.then(function(articles) {
				var articleLegacy = articles[0];
				var article = articles[1];
				var classification = 'unconditional';
				var results;

				if (articleLegacy) {
					results = /cms\/s\/([0-3])\//i.exec(articleLegacy.item.location.uri);
				}
				// “if the match fails, the exec() method returns null” — MDN
				// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
				// We often don't get matches for, say, blog articles.
				if (results) {
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
				} else if (article && article.webUrl.indexOf('fastft') > -1) {
					classification = 'conditional_standard';
				} else {
					classification = 'conditional_registered';
				}

				res.set('Outbound-Cache-Control', 'public, max-age=3600');
				res.set('Surrogate-Control', 'max-age=3600');
				res.vary('X-FT-UID');
				res.set('X-FT-UID', req.params.id);
				res.set('X-FT-Content-Classification', classification);
				res.status(200).end();
			})
			.catch(next);
	} else {
		next();
	}
};
