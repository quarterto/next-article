'use strict';

var logger = require('ft-next-logger');
var api = require('next-ft-api-client');
var getDfp = require('../utils/get-dfp');
var cacheControl = require('../utils/cache-control');

module.exports = function(req, res) {

	function get(guid) {
		return api.contentLegacy({
			uuid: guid,
			useElasticSearch: true
		});
	};

	function verify(data) {
		return {
			id: data.item.id,
			title: data.item.title.title,
			byline: data.item.editorial.byline,
			tags: data.item.metadata.tags,
			publishedDate: data.item.lifecycle.lastPublishDateTime,
			primaryTag: data.item.metadata.primarySection.term,
			body: data.item.body.body,
			media: {
				type: data.item.assets[0].type,
				url: data.item.assets[0].fields.link
			},
			layout: 'wrapper',
			dfp: getDfp(data.item.metadata.sections)
		};
	};

	function render(data) {
		res.set(cacheControl);
		return res.render('podcast', data);
	};

	function error(err) {
		res.status(500).send('Sorry!');
		console.log(err.message || err);
	};

	if (req && res) {
		return get(req.params.id).then(verify).then(render).catch(error);
	} else {
		return {
			get: get,
			verify: verify,
			render: render,
			error: error
		};
	}

};