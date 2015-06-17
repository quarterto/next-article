'use strict';

module.exports = function (req, res, next) {
	// assumes polling has already started
	var wasRedirected = require('../lib/ig-poller').getData().some(function (mapping) {
		if (mapping.articleuuid === req.params.id) {
			var interactiveFullUrl = 'http://ig.ft.com' + mapping.interactiveurl;
			if (mapping.displaytype === 'embed') {
				res.render('interactive', {
					layout: 'wrapper',
					interactiveUrl: interactiveFullUrl
				});
			} else {
				res.redirect(interactiveFullUrl);
			}
			return true;
		}
		return false;
	});

	if (!wasRedirected) {
		next();
	}
};
