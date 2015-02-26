

module.exports = function(req, res, next){
	var apiKey = res.locals.flags.articlesFromContentApiV2.isSwitchedOn ? process.env.apikey : process.env.api2key;
	var api = require('ft-api-client')(apiKey);
	if(req.method === 'HEAD' && req.get('X-FT-Access-Metadata') === 'remote_headers'){
		api.get(req.params[0]).then(function(article){
			res.set('X-FT-UID', article.id);
			res.set('X-FT-Content-Classification', article.contentClassification);
			res.status(200).end();
		}).catch(function(e){
			next(e);
		});
	}
};
