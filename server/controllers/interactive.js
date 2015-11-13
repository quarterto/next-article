'use strict';

module.exports = function interactiveController(req, res, next, payload) {
	if (payload.displaytype === 'embed') {
		res.render('interactive', {
			layout: 'wrapper',
			interactiveUrl: payload.interactiveurl
		});
	} else {
		res.redirect(payload.interactiveurl);
	}
};
