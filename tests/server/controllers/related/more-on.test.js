/*global describe, it*/
'use strict';

var expect = require('chai').expect;
var nock = require('nock');
var request = require('request');

var helpers = require('../../helpers');
var articleV1Elastic = require('../../../fixtures/capi-v1-elastic-search.json');
var articleV2 = require('../../../fixtures/capi-v2.json');
var anotherArticleV2 = require('../../../fixtures/capi-v2-another.json');

module.exports = function () {

	describe('More On', function() {

		it('should serve more on an article’s metadata', function(done) {
			nock('https://ft-elastic-search.com')
				.get('/v1_api_v2/item/02cad03a-844f-11e4-bae9-00144feabdc0')
				.reply(200, articleV1Elastic);
			nock('http://api.ft.com')
				.get('/enrichedcontent/02cad03a-844f-11e4-bae9-00144feabdc0')
				.reply(200, articleV2)
				.post('/content/search/v1')
				.reply(200, require('../../../fixtures/search.json'))
				.filteringPath(/^\/content\/[^\/]*$/, '/content/XXX')
				.get('/content/XXX')
				.times(3)
				.reply(200, anotherArticleV2);

			request(helpers.host + '/02cad03a-844f-11e4-bae9-00144feabdc0/more-on?metadata-fields=primaryTheme', function (error, res, body) {
				expect(res.headers['content-type']).to.match(/text\/html/);
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should behave gracefully if there is no primaryTheme', function (done) {
			nock('https://ft-elastic-search.com')
				.get('/v1_api_v2/item/02cad03a-844f-11e4-bae9-00144feabdc0')
				.reply(200, require('../../../fixtures/capi-v1-no-primary-theme.json'));

			request(helpers.host + '/02cad03a-844f-11e4-bae9-00144feabdc0/more-on?metadata-fields=primaryTheme', function (error, response, body) {
				response.statusCode.should.equal(200);
				body.should.be.empty;
				done();
			});
		});

	});

};
