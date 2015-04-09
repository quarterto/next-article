'use strict';

var nock = require('nock');
var request = require('request');
var expect = require('chai').expect;

var articleV1Elastic = require('../fixtures/capi-v1-elastic-search.json');
var articleV2 = require('../fixtures/capi-v2.json');
var fastFtArticleV2 = require('../fixtures/capi-v2-fastft.json');
var PORT = process.env.PORT || 3001;
var host = 'http://localhost:' + PORT;

module.exports = {
	host: host,
	servesGoodHTML: function(url, done) {
		request(host + url, function(error, res, body) {
			expect(res.headers['content-type']).to.match(/text\/html/);
			expect(res.statusCode).to.equal(200);
			done();
		});
	},
	mockMethode: function() {
		nock('https://ft-elastic-search.com')
			.get('/v1_api_v2/item/02cad03a-844f-11e4-bae9-00144feabdc0')
			.reply(200, articleV1Elastic);
		nock('https://ft-elastic-search.com')
			.get('/v1_api_v2/item/b002e5ee-3096-3f51-9925-32b157740c98')
			.reply(404);
		nock('http://api.ft.com')
			.get('/enrichedcontent/02cad03a-844f-11e4-bae9-00144feabdc0')
			.reply(200, articleV2);
		nock('http://api.ft.com')
			.get('/enrichedcontent/b002e5ee-3096-3f51-9925-32b157740c98')
			.reply(200, fastFtArticleV2);
	}
};
