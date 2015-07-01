"use strict";

// HACK
var capiV2 = require('next-ft-api-client/src/utils/capi-v2');

module.exports = function(tags) {
	return capiV2({
		path: "/concordances?authority=http://api.ft.com/system/FT-TME&identifierValue="
			+ tags
				.map(function(tag) { return tag.term.id; })
				.join("&identifierValue=")
	})
		.then(function(results) {
			if (results.length === 0) {
				return [];
			}
			return Promise.all(results.concordances
				.filter(function(concordance) {
					return concordance.identifier.authority === 'http://api.ft.com/system/FT-TME';
				})
				.map(function(concordance) {
					return capiV2({

						// COMPLEX: Can't use extractUuid here because need to keep the taxonomy
						path: concordance.concept.apiUrl.replace('http://api.ft.com', '')
					})
						.then(function(thing) {
							thing.tmeId = concordance.identifier.identifierValue;
							return thing;
						});
				}));
		})
		.then(function(results) {
			return results.reduce(function(previousValue, thing) {
				var tmeId = thing.tmeId;
				delete thing.tmeId;
				previousValue[tmeId] = thing;
				return previousValue;
			}, {});
		});
};
