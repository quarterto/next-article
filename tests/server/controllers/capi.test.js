/*global it, describe*/
'use strict';

var PORT = process.env.PORT || 3001;
var expect = require('chai').expect;
require('chai').should();
var nock = require('nock');
var request = require('request');
var $ = require('cheerio');

var articleV1Elastic = require('../../fixtures/capi-v1-elastic-search.json');
var articleV2 = require('../../fixtures/capi-v2.json');

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

module.exports = function () {

	describe('Capi', function() {

		it('should serve a methode article', function(done) {
			mockMethode();
			servesGoodHTML('/02cad03a-844f-11e4-bae9-00144feabdc0', done);
		});

		it('should add tracking to all article links', function(done) {
			mockMethode();
			request(host + '/02cad03a-844f-11e4-bae9-00144feabdc0', function(error, response, body) {
				$(body).find('.article a').each(function(index, el) {
					var $link = $(el);
					expect($link.attr('data-trackable'), 'href="' + $link.attr('href') + '"').to.not.be.undefined;
				});
				done();
			});
		});

		it('should work not using elastic search', function (done) {
			nock('http://api.ft.com')
				.get('/content/items/v1/0369dd4e-8513-11e1-2a93-978e959e1fd3?feature.blogposts=on')
				.reply(200, require('../../fixtures/capi-v1.json'));
			nock('http://api.ft.com')
				.get('/enrichedcontent/0369dd4e-8513-11e1-2a93-978e959e1fd3')
				.reply(200, articleV2);

			request({
				url: host + '/0369dd4e-8513-11e1-2a93-978e959e1fd3',
				headers: { Cookie: 'next-flags=elasticSearchItemGet:off' }
			}, function (error, response, body) {
				response.statusCode.should.equal(200);
				done();
			});
		});

	});

};
