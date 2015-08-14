/*global describe, it, afterEach*/
'use strict';

var nock = require('nock');
var request = require('request');

var helpers = require('../../helpers');
var anotherArticleV2 = require('../../../fixtures/capi-v2-another.json');

module.exports = function() {

	afterEach(function() {
		nock.cleanAll();
	});

	describe('More On', function() {

		it('should behave gracefully if there is no primaryTheme', function(done) {
			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget')
				.reply(200, require('../../../fixtures/capi-v1-no-primary-theme.json'));
			nock('http://api.ft.com')
				.post('/content/search/v1')
				.reply(200, require('../../../fixtures/search.json'))
				.filteringPath(/^\/content\/[^\/]*$/, '/content/XXX')
				.get('/content/XXX')
				.times(3)
				.reply(200, anotherArticleV2);

			request(helpers.host + '/article/02cad03a-844f-11e4-bae9-00144feabdc0/more-on?metadata-fields=primaryTheme', function(error, response, body) {
				response.statusCode.should.equal(200);
				body.should.be.empty;
				done();
			});
		});

	});

};
