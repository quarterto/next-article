'use strict';

var fetchres = require('fetchres');
var logger = require('ft-next-logger');
var cacheControl = require('../utils/cache-control');

function commentsSwitchedOn(uuid) {
	return fetch('http://www.ft.com/cms/s/' + uuid + '.html', {
			headers: {
				'User-Agent': 'Googlebot-News'
			},
			timeout: 3000
		})
			.then(fetchres.text)
			.then(function(data) {
				if (data.indexOf('<div id="ft-article-comments"></div>') > -1) {
					logger.info("Comments switched on for " + uuid);
					return true;
				}
				logger.info("Comments switched off for " + uuid);
				return false;
			})
			.catch(function(err) {
				// Just gracefully, silently fail…
				logger.warn("Failed to pull whether comments is available from FT.com for " + uuid);
				return false;
			});
}

module.exports = function(req, res, next) {
	res.set(cacheControl);
	if (res.locals.flags.articleCommentsHack) {
		commentsSwitchedOn(req.params.id)
			.then(function(on) {
				res.json(on);
			})
			.catch(next);
	} else {
		logger.info("Comments hack disabled, defaulting to no comments");
		res.json(false);
	}
};
