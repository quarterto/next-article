/*global it, describe, before, beforeEach*/
'use strict';

var PORT = process.env.PORT || 3001;
var expect = require('chai').expect;
var app = require('../../server/app');
var nock = require('nock');
var request = require('request');
var $ = require('cheerio');

var articleV1 = require('fs').readFileSync('tests/fixtures/capi1.json', { encoding: 'utf8' });
var articleV2 = require('fs').readFileSync('tests/fixtures/capi2.json', { encoding: 'utf8' });
var search = require('fs').readFileSync('tests/fixtures/search-for__climate-change', { encoding: 'utf8' });

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

var mockMethode = function (n) {
	nock('http://api.ft.com')
		.filteringPath(/v1\/.*$/, 'v1/XXX')
		.get('/content/items/v1/XXX')
		.reply(200, articleV1);
	nock('http://api.ft.com')
		.filteringPath(/content\/.*\?sjl=WITH_RICH_CONTENT$/, 'content/XXX?sjl=WITH_RICH_CONTENT')
		.get('/content/XXX?sjl=WITH_RICH_CONTENT')
		.times(5)
		.reply(200, articleV2);
	nock('http://api.ft.com', {
			reqheaders: {
				'X-Api-Key': process.env.apikey
			}
		})
		.post('/content/search/v1')
		.reply(200, search);
};

describe('smoke tests for the app', function () {

	before(function() {
		return app.listen;
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

		beforeEach(function () {
			mockMethode();
		});

		it('Should serve a methode article', function (done) {
			servesGoodHTML('/d0a14962-6e56-11e4-afe5-00144feabdc0', done);
		});

		it('Should serve a fastft article', function (done) {
			servesGoodHTML('/fastft/237332/rocket-internet-has-12-proven-losers-1st-half', done);
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
