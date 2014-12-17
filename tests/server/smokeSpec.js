/*jshint node:true*/
/*global it, describe, beforeEach, afterEach*/
'use strict';

require('es6-promise').polyfill();
var PORT = process.env.PORT || 3001;

var expect = require('chai').expect;
var sinon = require('sinon');
require('../../server/app');
var nock = require('nock');
var request = require('request');
var fastft = require('fastft-api-client');
var fastftMocks = require('fastft-api-client/mocks');

var article = require('fs').readFileSync('tests/fixtures/03b49444-16c9-11e3-bced-00144feabdc0', { encoding: 'utf8' });
var search = require('fs').readFileSync('tests/fixtures/search-for__climate-change', { encoding: 'utf8' });
var fastftSearch = require('fs').readFileSync('tests/fixtures/fastft/index.json', { encoding: 'utf8' });
var fastftPost = require('fs').readFileSync('tests/fixtures/fastft/post.json', { encoding: 'utf8' });

var host = 'http://localhost:' + PORT;

var servesGoodHTML = function (url, done) {
	request.get(host + url, function(req, res) {
		expect(res.headers['content-type']).to.match(/text\/html/);
		expect(res.statusCode).to.equal(200);
		done();
	}, function (err) {
		console.log(err);
	});
};

var uniqueIdArticle = (function () {
	var count = 999;
	var articleObject = JSON.parse(article);
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
	nock('http://api.ft.com')
		.filteringPath(/apiKey=(.*)?$/, 'apiKey=YYY')
		.post('/content/search/v1?apiKey=YYY')
		.reply(200, search);
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
		this.timeout(5000);
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

	describe('urls', function () {

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

		it('Should serve a more-on list', function (done) {
			servesGoodHTML('/more-on/c7d19712-6df5-11e4-8f96-00144feabdc0', done);
		});

		it('Should serve an on this topic list', function (done) {
			servesGoodHTML('/more-on/primaryTheme/c7d19712-6df5-11e4-8f96-00144feabdc0', done);
		});

	});
});
