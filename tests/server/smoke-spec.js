/*global it, describe, before, beforeEach*/
'use strict';

var PORT = process.env.PORT || 3001;
var expect = require('chai').expect;
var nock = require('nock');
var request = require('request');
var $ = require('cheerio');

var articleV1 = require('fs').readFileSync('tests/fixtures/capi1.json', { encoding: 'utf8' });
var articleV2 = require('fs').readFileSync('tests/fixtures/capi2.json', { encoding: 'utf8' });
var fastFtBody = require('fs').readFileSync('tests/fixtures/fastft/rocket.json', { encoding: 'utf8' });
var fastFtErrorBody = require('fs').readFileSync('tests/fixtures/fastft/notfound.json', { encoding: 'utf8' });
var search = require('fs').readFileSync('tests/fixtures/search-for__climate-change', { encoding: 'utf8' });
var flags = require('fs').readFileSync('tests/fixtures/flags.json', { encoding: 'utf8' });

var host = 'http://localhost:' + PORT;

var servesGoodHTML = function(url, done) {
	request(host + url, function(error, res, body) {
		expect(res.headers['content-type']).to.match(/text\/html/);
		expect(res.statusCode).to.equal(200);
		done();
	});
};

var mockMethode = function() {
	nock('http://api.ft.com')
		.get('/content/items/v1/d0a14962-6e56-11e4-afe5-00144feabdc0?feature.blogposts=on')
		.reply(200, articleV1)
		.get('/enrichedcontent/d0a14962-6e56-11e4-afe5-00144feabdc0')
		.reply(200, articleV2);
};

describe('Smoke Tests: ', function() {

	before(function(done) {
		nock('http://ft-next-api-feature-flags.herokuapp.com')
			.get('/production')
			.reply(200, flags);
		require('../../server/app').listen;
		// wait for app to come up
		var timerId = setInterval(function() {
			request(host + '/__gtg', function(error, res, body) {
				if (!error) {
					clearInterval(timerId);
					done();
				}
			});
		}, 50);
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
			servesGoodHTML('/d0a14962-6e56-11e4-afe5-00144feabdc0', done);
		});

		it('should serve more on an article', function(done) {
			// set up 'more on' responses (gets story package's articles)
			nock('http://api.ft.com')
				.filteringPath(/^\/content\/.*$/, '/content/XXX')
				.get('/content/XXX')
				.times(5)
				.reply(200, articleV2);

			servesGoodHTML('/more-on/d0a14962-6e56-11e4-afe5-00144feabdc0', done);
		});

		it('should serve more on an article’s metadata', function(done) {
			nock('http://api.ft.com')
				.post('/content/search/v1')
				.reply(200, search)
				.filteringPath(/^\/content\/.*$/, '/content/XXX')
				.get('/content/XXX')
				.times(3)
				.reply(200, articleV2);

			servesGoodHTML('/more-on/primaryTheme/d0a14962-6e56-11e4-afe5-00144feabdc0', done);
		});

	});

	describe('Fast FT', function() {

		it('should redirect to article', function(done) {
			nock('http://clamo.ftdata.co.uk')
				.get('/api?request=%5B%7B%22action%22:%22getPost%22,%22arguments%22:%7B%22id%22:237332%7D%7D%5D')
				.reply(200, fastFtBody);

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
				.reply(200, fastFtErrorBody);

			request({
				url: host + '/fastft/237332/rocket-internet-has-12-proven-losers-1st-half'
			}, function(error, response, body) {
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
			request(host + '/d0a14962-6e56-11e4-afe5-00144feabdc0', function(error, response, body) {
				$(body).find('.article a').each(function(index, el) {
					var $link = $(el);
					expect($link.attr('data-trackable'), 'href="' + $link.attr('href') + '"').to.not.be.undefined;
				});
				done();
			});
		});

	});

	describe('More On', function() {

		it('should behave gracefully if there is no primaryTheme', function() {
			nock('http://api.ft.com')
				.filteringPath(/content\/items\/v1\/.*\?feature.blogposts=on$/, 'content/items/v1/XXX?feature.blogposts=on')
				.get('/content/items/v1/XXX?feature.blogposts=on')
				.reply(200, require('../fixtures/capiv1-article-no-primary-theme.json'));
			nock('http://api.ft.com')
				.filteringPath(/content\/.*$/, 'content/XXX')
				.get('/content/XXX')
				.times(5)
				.reply(200, require('../fixtures/capiv2-article.json'));

			return fetch(host + '/more-on/f2b13800-c70c-11e4-8e1f-00144feab7de')
				.then(function(response) {
					expect(response.ok).to.be.true;
				});
		});

	});
});
