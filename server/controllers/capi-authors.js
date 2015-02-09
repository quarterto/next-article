/*jshint node:true*/
/*global fetch*/
'use strict';
var fetchres = require('fetchres');
var cacheControl = require('../utils/cache-control');

module.exports = function(req, res, next) {
	fetch('http://api.ft.com/content/items/v1/' + req.params[0], {
		headers: {
			'X-Api-Key': process.env.apikey
		}
	})
		.then(fetchres.json)
		.then(function(article) {
			res.set(cacheControl);
			res.json(article.item.metadata.authors.map(function(author) {
				return author.term.name;
			}));
		})
		.catch(function(err) {
			if (err instanceof fetchres.BadServerResponseError) {
				res.status(404).end();
			} else {
				next(err);
			}
		});
};
