/*global it, describe, before, afterEach*/
'use strict';

var expect = require('chai').expect;
var request = require('request');

var helpers = require('./helpers');

describe('Smoke Tests: ', function() {

	before(function() {
		return require('../../server/app').listen;
	});

	describe('Assets', function() {

		it('should serve a good to go page', function(done) {
			request(helpers.host + '/__gtg', function(error, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should serve a main.js file', function(done) {
			request(helpers.host + '/article/main.js', function(error, res, body) {
				expect(res.headers['content-type']).to.match(/application\/javascript/);
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should serve a main.css file', function(done) {
			request(helpers.host + '/article/main.css', function(error, res, body) {
				expect(res.headers['content-type']).to.match(/text\/css/);
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

	});

	// specific controller tests
	require('./controllers/capi.test.js')();
	require('./controllers/fastft.test.js')();
	require('./controllers/related/people.test.js')();
	require('./controllers/related/story-package.test.js')();
	require('./controllers/related/more-on.test.js')();

});
