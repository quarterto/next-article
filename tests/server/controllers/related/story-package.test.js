/*global describe, it, beforeEach*/
'use strict';

var nock = require('nock');

var helpers = require('../../helpers');
var articleV1Elastic = require('../../../fixtures/capi-v1-elastic-search.json');
var articleV2 = require('../../../fixtures/capi-v2.json');

module.exports = function() {

	describe('Story Package', function() {

		beforeEach(function() {
			helpers.mockMethode();
		});

		it('should serve more on an article', function(done) {
			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget')
				.reply(200, articleV1Elastic);
			// set up 'more on' responses (gets story package's articles)
			nock('http://api.ft.com')
				.filteringPath(/^\/content\/[^\/]*$/, '/content/XXX')
				.get('/content/XXX')
				.times(5)
				.reply(200, articleV2);

			helpers.servesGoodHTML('/02cad03a-844f-11e4-bae9-00144feabdc0/story-package', done);
		});

	});

};
