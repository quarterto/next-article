'use strict';

const fetchres = require('fetchres');

module.exports = function(req, res, next) {

	// E.g. 4eb77dd4-9b35-11e4-be20-002128161462
	return fetch(`https://api.ft.com/content/items/v1/${req.params.id}?apiKey=${process.env.apikey}`)
		.then(fetchres.json)
		.then(data => {
			if (data
				&& data.item
				&& data.item.assets
				&& data.item.assets[0]
				&& data.item.assets[0].type === 'slideshow') {
				res.render('slideshow', {
					title: data.item.assets[0].fields.title,
					syncid: req.query.syncid,
					slides: data.item.assets[0].fields.slides
				});
			} else {
				res.status(404).end();
			}
		})
		.catch(err => {
			if (fetchres.originatedError(err)) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
