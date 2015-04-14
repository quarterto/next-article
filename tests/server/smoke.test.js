/*global it, describe, before, afterEach*/
'use strict';

var expect = require('chai').expect;
var nock = require('nock');
var request = require('request');

var helpers = require('./helpers');

describe('Smoke Tests: ', function() {

	before(function() {
		nock('http://ft-next-api-feature-flags.herokuapp.com')
			.get('/__flags.json')
			.reply(200, require('../fixtures/flags'));
		return require('../../server/app').listen;
	});

	afterEach(function () {
		nock.cleanAll();
	});

	describe('Assets', function() {

		it('should serve a good to go page', function(done) {
			request(helpers.host + '/__gtg', function(error, res, body) {
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should serve a main.js file', function(done) {
			request(helpers.host + '/grumman/main.js', function(error, res, body) {
				expect(res.headers['content-type']).to.match(/application\/javascript/);
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

		it('should serve a main.css file', function(done) {
			request(helpers.host + '/grumman/main.css', function(error, res, body) {
				expect(res.headers['content-type']).to.match(/text\/css/);
				expect(res.statusCode).to.equal(200);
				done();
			});
		});

	});

	// specific controller tests
	require('./controllers/capi.test.js')();
	require('./controllers/more-on.test.js')();
	require('./controllers/more-on-topic.test.js')();
	require('./controllers/fastft.test.js')();
	require('./controllers/related/people.test.js')();

});
