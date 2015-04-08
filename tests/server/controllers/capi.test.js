/*global it, describe, before, beforeEach, afterEach*/
'use strict';

var PORT = process.env.PORT || 3001;
var expect = require('chai').expect;
require('chai').should();
var nock = require('nock');
var request = require('request');
var $ = require('cheerio');

var articleV1Elastic = require('../fixtures/capi-v1-elastic-search.json');
var articleV2 = require('../fixtures/capi-v2.json');

var host = 'http://localhost:' + PORT;

var mockMethode = function() {
	nock('https://ft-elastic-search.com')
		.get('/v1_api_v2/item/02cad03a-844f-11e4-bae9-00144feabdc0')
		.reply(200, articleV1Elastic);
	nock('http://api.ft.com')
		.get('/enrichedcontent/02cad03a-844f-11e4-bae9-00144feabdc0')
		.reply(200, articleV2);
};

var servesGoodHTML = function(url, done) {
	request(host + url, function(error, res, body) {
		expect(res.headers['content-type']).to.match(/text\/html/);
		expect(res.statusCode).to.equal(200);
		done();
	});
};

describe('Capi', function() {

	beforeEach(function() {
		mockMethode();
	});

	it('should serve a methode article', function(done) {
		servesGoodHTML('/02cad03a-844f-11e4-bae9-00144feabdc0', done);
	});

});
