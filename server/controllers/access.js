'use strict';

var api = require('next-ft-api-client');
var fetchres = require('fetchres');
var url	= require('url');
require('array.prototype.find');

var accessMetadata = [
	{
		path_regex: '/cms/s/[01]',
		classification: 'conditional_standard'
	},
	{
		path_regex: '/cms/s/2',
		classification: 'unconditional'
	},
	{
		path_regex: '/cms/s/3',
		classification: 'conditional_premium'
	},
	{
		path_regex: '/fastft',
		classification: 'conditional_standard'

	},
	{
		host_regex: 'ftalphaville\.ft\.com',
		classification: 'conditional_registered'

	}
];

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
			api.contentLegacy({
					uuid: req.params.id,
					useElasticSearch: res.locals.flags.elasticSearchItemGet
				})
				.catch(suppressBadResponses),
			api.content({
					uuid: req.params.id,
					useElasticSearch: res.locals.flags.elasticSearchItemGet
				})
				.catch(suppressBadResponses),
			fetch('http://blogs.ft.com/__access_metadata')
				.then(function (response) {
					if (!response.ok) {
						return {
							accessMetadata: []
						};
					}
					return response.json();
				})
		])
			.then(function(results) {
				var articleLegacy = results[0];
				var article = results[1];
				// if this article doesn't exist in capi, continue
				if (!articleLegacy && !article) {
					return next();
				}
				var blogAccessMetadata = results[2].access_metadata.map(function (access) {
					access.host_regex = 'blogs\.ft\.com';
					return access;
				});
				var classification = 'conditional_registered';
				var articleUrl = url.parse(articleLegacy ? articleLegacy.item.location.uri : article.webUrl);
				var access = accessMetadata
					.concat(blogAccessMetadata)
					.find(function (access) {
						if (access.path_regex && articleUrl.pathname.search(access.path_regex) === -1) {
							return false;
						}
						if (access.host_regex && articleUrl.hostname.search(access.host_regex) === -1) {
							return false;
						}
						return true;
					});
				if (access) {
					classification = access.classification;
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
