/*global  describe, it*/
'use strict';

var PORT = process.env.PORT || 3001;
var expect = require('chai').expect;
var nock = require('nock');
var request = require('request');

var host = 'http://localhost:' + PORT;

module.exports = function () {

	describe('Fast FT', function() {

		it('should redirect to article', function(done) {
			nock('http://clamo.ftdata.co.uk')
				.get('/api?request=%5B%7B%22action%22:%22getPost%22,%22arguments%22:%7B%22id%22:237332%7D%7D%5D')
				.reply(200, require('../../fixtures/fastft/rocket.json'));

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
				.reply(200, require('../../fixtures/fastft/not-found.json'));

			request(host + '/fastft/237332/rocket-internet-has-12-proven-losers-1st-half', function(error, response, body) {
				expect(response.statusCode).to.equal(404);
				done();
			});
		});

	});


};
