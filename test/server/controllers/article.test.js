/*global beforeEach, afterEach, it, describe*/
'use strict';

var expect = require('chai').expect;
require('chai').should();
var request = require('request');
var $ = require('cheerio');
var mitm = require('mitm');

var helpers = require('../helpers');
var articleV2 = require('../../fixtures/capi-v2.json');

module.exports = function () {

	describe('Capi', function() {

		it('should serve a methode article', function(done) {
			helpers.mockMethode();
			helpers.servesGoodHTML('/02cad03a-844f-11e4-bae9-00144feabdc0', done);
		});

		it('should serve a fastft article', function(done) {
			helpers.mockMethode();
			helpers.servesGoodHTML('/b002e5ee-3096-3f51-9925-32b157740c98', done);
		});

		it('should add tracking to all article links', function(done) {
			helpers.mockMethode();
			request(helpers.host + '/02cad03a-844f-11e4-bae9-00144feabdc0', function(error, response, body) {
				$(body).find('.article a').each(function(index, el) {
					var $link = $(el);
					expect($link.attr('data-trackable'), 'href="' + $link.attr('href') + '"').to.not.be.undefined;
				});
				done();
			});
		});

		describe('elastic search', function () {

			beforeEach(function() {
				this.mitm = mitm();
			});

			afterEach(function() {
				this.mitm.disable();
			});

			it('should work not using elastic search', function (done) {

				this.mitm.on('request', function(req, res) {
					switch (req.url) {
						case '/0369dd4e-8513-11e1-2a93-978e959e1fd3':
							res.statusCode = 200;
							res.end();							
							break;
						case '/enrichedcontent/0369dd4e-8513-11e1-2a93-978e959e1fd3':
							res.statusCode = 200;
							res.end(articleV2);
							break;
						default:
							throw new Error('request not understood'); 
					}
				});
				
				request({
					url: helpers.host + '/0369dd4e-8513-11e1-2a93-978e959e1fd3',
					headers: { Cookie: 'next-flags=elasticSearchItemGet:off' }
				}, function (error, response, body) {
					response.statusCode.should.equal(200);
					done();
				});
	
			});
		});
	});

};
