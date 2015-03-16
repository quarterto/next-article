/*global it, describe, before, beforeEach, afterEach*/
'use strict';

var PORT = process.env.PORT || 3001;

var expect = require('chai').expect;
var sinon = require('sinon');
require('../../server/app');
var nock = require('nock');
var request = require('request');
var fastft = require('fastft-api-client');
var fastftMocks = require('fastft-api-client/mocks');
var $ = require('cheerio');

var articleV1 = require('fs').readFileSync('tests/fixtures/capi1.json', { encoding: 'utf8' });
var articleElastic = require('fs').readFileSync('tests/fixtures/elastic.json', { encoding: 'utf8' });
var articleV2 = require('fs').readFileSync('tests/fixtures/capi2.json', { encoding: 'utf8' });
var search = require('fs').readFileSync('tests/fixtures/search-for__climate-change', { encoding: 'utf8' });
var fastftSearch = require('fs').readFileSync('tests/fixtures/fastft/index.json', { encoding: 'utf8' });
var fastftPost = require('fs').readFileSync('tests/fixtures/fastft/post.json', { encoding: 'utf8' });
var pages = require('fs').readFileSync('tests/fixtures/site/v1/pages.json', { encoding: 'utf8' });

var host = 'http://localhost:' + PORT;

var servesGoodHTML = function (url, done) {
	request.get(host + url, function(req, res) {
		expect(res.headers['content-type']).to.match(/text\/html/);
		expect(res.statusCode).to.equal(200);
		done();
	}, function (err) {
		console.log("An error has occurred", err);
		done(err);
	});
};

var uniqueIdArticle = (function () {
	var count = 999;
	var articleObject = JSON.parse(articleV1);
	return function () {
		articleObject.item.id = (count--) + articleObject.item.id.substr(3);
		return JSON.stringify(articleObject);
	};
}());

var mockMethode = function (n) {

	nock('http://api.ft.com')
		.filteringPath(/v1\/.*\?apiKey=.*$/, 'v1/XXX?apiKey=YYY')
		.get('/content/items/v1/XXX?apiKey=YYY')
		.times(n || 20)
		.reply(200, uniqueIdArticle);
	// non-ft client requests
	nock('http://api.ft.com')
		.filteringPath(/v1\/.*$/, 'v1/XXX')
		.get('/content/items/v1/XXX')
		.reply(200, articleV1);
	nock('http://elastic/')
		.filteringPath(/\/.*$/, '/XXX')
		.get('/XXX')
		.reply(200, articleElastic);
	nock('http://api.ft.com', {
			reqheaders: {
				'X-Api-Key': process.env.api2key
			}
		})
		.filteringPath(/content\/.*\?sjl=WITH_RICH_CONTENT$/, 'content/XXX?sjl=WITH_RICH_CONTENT')
		.get('/content/XXX?sjl=WITH_RICH_CONTENT')
		.times(5)
		.reply(200, articleV2);
	nock('http://api.ft.com')
		.filteringPath(/apiKey=(.*)?$/, 'apiKey=YYY')
		.post('/content/search/v1?apiKey=YYY')
		.reply(200, search)
		.get('/site/v1/pages?apiKey=YYY')
		.reply(200, pages);
};

var mockFastFT = function () {
	sinon.stub(fastft, 'search', fastftMocks.search(fastftSearch));
	sinon.stub(fastft, 'getPost', fastftMocks.getPost(fastftPost));
};

var unmockFastFT = function () {
	fastft.search.restore();
	fastft.getPost.restore();
};

describe('smoke tests for the app', function () {

	before(function(done) {
		setTimeout(done, 3000);
	});

	it('Should serve a good to go page', function (done) {
		request.get('http://localhost:' +  PORT + '/__gtg', function(req, res) {
			expect(res.statusCode).to.equal(200);
			done();
		});
	});

	it('Should serve a main.js file', function (done) {
		request
		.get('http://localhost:' +  PORT + '/grumman/main.js', function (req, res) {
			expect(res.headers['content-type']).to.match(/application\/javascript/);
			expect(res.statusCode).to.equal(200);
			done();
		});
	});

	it('Should serve a main.css file', function (done) {
		request
		.get('http://localhost:' +  PORT + '/grumman/main.css', function (req, res) {
			expect(res.headers['content-type']).to.match(/text\/css/);
			expect(res.statusCode).to.equal(200);
			done();
		});
	});

	describe('urls', function() {
		this.timeout(10000);

		beforeEach(function () {
			mockMethode();
			mockFastFT();
		});

		afterEach(function () {
			unmockFastFT();
		});

		it('Should serve a methode article', function (done) {
			servesGoodHTML('/d0a14962-6e56-11e4-afe5-00144feabdc0', done);
		});

		it('Should serve a fastft article', function (done) {
			servesGoodHTML('/fastft/237332/rocket-internet-has-12-proven-losers-1st-half', done);
		});

		it('Should serve a more-on list', function(done) {
			servesGoodHTML('/more-on/c7d19712-6df5-11e4-8f96-00144feabdc0', done);
		});

		it('Should serve an on this topic list', function (done) {
			servesGoodHTML('/more-on/primaryTheme/c7d19712-6df5-11e4-8f96-00144feabdc0', done);
		});

	});

	describe('tracking', function () {

		beforeEach(function () {
			mockMethode();
		});

		it('should add tracking to all article links', function (done) {
			request.get(host + '/d0a14962-6e56-11e4-afe5-00144feabdc0', function(error, res, body) {
				$(body).find('.article a').each(function (index, el) {
					var link = $(el);
					expect(link.attr('data-trackable'), 'href="' + link.attr('href') + '"').to.not.be.undefined;
				});
				done();
			}, function (err) {
				console.log('An error has occurred', err);
				done(err);
			});
		});

	});
});
