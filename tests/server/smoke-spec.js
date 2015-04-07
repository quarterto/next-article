/*global it, describe, before, beforeEach, afterEach*/
'use strict';

var PORT = process.env.PORT || 3001;
var expect = require('chai').expect;
require('chai').should();
var nock = require('nock');
var request = require('request');
var $ = require('cheerio');

var articleV1Elastic = require('../fixtures/capi-v1-elastic-search.json')
var articleV2 = require('fs').readFileSync('tests/fixtures/capi-v2.json', { encoding: 'utf8' });

var host = 'http://localhost:' + PORT;

var servesGoodHTML = function(url, done) {
	request(host + url, function(error, res, body) {
		expect(res.headers['content-type']).to.match(/text\/html/);
		expect(res.statusCode).to.equal(200);
		done();
	});
};

var mockMethode = function() {
	nock('https://ft-elastic-search.com')
		.get('/v1_api_v2/item/02cad03a-844f-11e4-bae9-00144feabdc0')
		.reply(200, articleV1Elastic);
	nock('http://api.ft.com')
		.get('/enrichedcontent/02cad03a-844f-11e4-bae9-00144feabdc0')
		.reply(200, articleV2);
};

describe('Smoke Tests: ', function() {

	before(function() {
		nock('http://ft-next-api-feature-flags.herokuapp.com')
			.get('/production')
			.reply(200, require('../fixtures/flags'));
		return require('../../server/app').listen;
	});

	afterEach(function () {
		nock.cleanAll();
	});

	describe('Assets', function() {

		it('should serve a good to go page', function(done) {
			request(host + '/__gtg', function(error, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should serve a main.js file', function(done) {
			request(host + '/grumman/main.js', function(error, res, body) {
				expect(res.headers['content-type']).to.match(/application\/javascript/);
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should serve a main.css file', function(done) {
			request(host + '/grumman/main.css', function(error, res, body) {
				expect(res.headers['content-type']).to.match(/text\/css/);
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

	});

	describe('URLs', function() {

		beforeEach(function() {
			mockMethode();
		});

		it('should serve a methode article', function(done) {
			servesGoodHTML('/02cad03a-844f-11e4-bae9-00144feabdc0', done);
		});

		it('should serve more on an article', function(done) {
			nock('https://ft-elastic-search.com')
				.get('/v1_api_v2/item/02cad03a-844f-11e4-bae9-00144feabdc0')
				.reply(200, articleV1Elastic);
			// set up 'more on' responses (gets story package's articles)
			nock('http://api.ft.com')
				.filteringPath(/^\/content\/[^\/]*$/, '/content/XXX')
				.get('/content/XXX')
				.times(5)
				.reply(200, articleV2);

			servesGoodHTML('/more-on/02cad03a-844f-11e4-bae9-00144feabdc0', done);
		});

		it('should serve more on an article’s metadata', function(done) {
			nock('http://api.ft.com')
				.post('/content/search/v1')
				.reply(200, require('../fixtures/search.json'))
				.filteringPath(/^\/content\/[^\/]*$/, '/content/XXX')
				.get('/content/XXX')
				.times(3)
				.reply(200, articleV2);

			servesGoodHTML('/more-on/primaryTheme/02cad03a-844f-11e4-bae9-00144feabdc0', done);
		});

	});

	describe('Fast FT', function() {

		it('should redirect to article', function(done) {
			nock('http://clamo.ftdata.co.uk')
				.get('/api?request=%5B%7B%22action%22:%22getPost%22,%22arguments%22:%7B%22id%22:237332%7D%7D%5D')
				.reply(200, require('../fixtures/fastft/rocket.json'));

			request({
				url: host + '/fastft/237332/rocket-internet-has-12-proven-losers-1st-half',
				followRedirect: false
			}, function(error, response, body) {
				expect(response.statusCode).to.equal(302);
				expect(response.headers.location).to.equal('/cfae5a13-08a0-39d6-b36c-452d03ee44aa');
				done();
			});
		});

		it('should 404 if error response', function(done) {
			nock('http://clamo.ftdata.co.uk')
				.get('/api?request=%5B%7B%22action%22:%22getPost%22,%22arguments%22:%7B%22id%22:237332%7D%7D%5D')
				.reply(200, require('../fixtures/fastft/not-found.json'));

			request(host + '/fastft/237332/rocket-internet-has-12-proven-losers-1st-half', function(error, response, body) {
				expect(response.statusCode).to.equal(404);
				done();
			});
		});

	});

	describe('Link Tracking', function() {

		beforeEach(function() {
			mockMethode();
		});

		it('should add tracking to all article links', function(done) {
			request(host + '/02cad03a-844f-11e4-bae9-00144feabdc0', function(error, response, body) {
				$(body).find('.article a').each(function(index, el) {
					var $link = $(el);
					expect($link.attr('data-trackable'), 'href="' + $link.attr('href') + '"').to.not.be.undefined;
				});
				done();
			});
		});

	});

	describe('More On', function() {

		it('should behave gracefully if there is no primaryTheme', function (done) {
			nock('https://ft-elastic-search.com')
				.get('/v1_api_v2/item/f2b13800-c70c-11e4-8e1f-00144feab7de')
				.reply(200, require('../fixtures/capi-v1-no-primary-theme.json'));

			request(host + '/primaryTheme/f2b13800-c70c-11e4-8e1f-00144feab7de', function (error, response, body) {
				response.statusCode.should.equal(404);
				done();
			});
		});

	});

	describe('Elastic Search', function() {

		it('should work not using elastic search', function (done) {
			nock('http://api.ft.com')
				.get('/content/items/v1/0369dd4e-8513-11e1-2a93-978e959e1fd3?feature.blogposts=on')
				.reply(200, require('../fixtures/capi-v1.json'));
			nock('http://api.ft.com')
				.get('/enrichedcontent/0369dd4e-8513-11e1-2a93-978e959e1fd3')
				.reply(200, articleV2);

			request({
				url: host + '/0369dd4e-8513-11e1-2a93-978e959e1fd3',
				headers: { Cookie: 'next-flags=elasticSearchItemGet:of' }
			}, function (error, response, body) {
				response.statusCode.should.equal(200);
				done();
			});
		});

	});

});
