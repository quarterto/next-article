/*jshint node:true*/
/*global fetch*/
'use strict';

var fetchres = require('fetchres');

module.exports = function(req, res, next) {

	// E.g. 4eb77dd4-9b35-11e4-be20-002128161462
	fetch('http://api.ft.com/content/items/v1/' + req.params.id, {
			headers: {
				'X-Api-Key': process.env.apikey
			}
		})
		.then(fetchres.json)
		.then(function(data) {
			if (data.item && data.item && data.item.assets && data.item.assets[0] && data.item.assets[0].type === 'slideshow') {

				// When in INT the URLs to images don't work.  Hack for now.
				data.item.assets[0].fields.slides = data.item.assets[0].fields.slides.map(function(slide) {
//					slide.url = 'http://im.ft-static.com/content/images/0069a6cd-6629-4d49-8acb-2eaba7f61f7c.img';
					return slide;
				});

				// HACK - Disable the layout on slideshows
				data.item.assets[0].fields.layout = false;
				res.render('slideshow', data.item.assets[0].fields);
			} else {
				res.status(404).end();
			}
		})
		.catch(function(err) {
			console.log(err);
			throw err;
		})
		.catch(next);

};
