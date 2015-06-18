'use strict';

module.exports = function (req, res, next) {
	// assumes polling has already started
	var wasRedirected = require('../lib/ig-poller').getData().some(function (mapping) {
		if (mapping.articleuuid === req.params.id) {
			if (mapping.displaytype === 'embed') {
				res.render('interactive', {
					layout: 'wrapper',
					interactiveUrl: mapping.interactiveurl
				});
			} else {
				res.redirect(mapping.interactiveurl);
			}
			return true;
		}
		return false;
	});

	if (!wasRedirected) {
		next();
	}
};
