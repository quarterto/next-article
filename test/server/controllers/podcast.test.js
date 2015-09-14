/*global it, describe, beforeEach, afterEach*/
'use strict';

var nock = require('nock');
var sinon = require('sinon');
var expect = require('chai').expect;
var httpMocks = require('node-mocks-http');

var subject = require('../../../server/controllers/podcast');
var fixtureEsFound = require('../../fixtures/capi-v1-elastic-search-podcast');
var fixtureEsNotFound = require('../../fixtures/capi-v1-elastic-search-not-found');

describe('Podcasts Controller', function() {

	var instance, request, response, next;

	function createInstance(params) {
		next = sinon.stub();
		request = httpMocks.createRequest(params);
		response = httpMocks.createResponse();
		return subject(request, response, next);
	}

	describe('Success', function() {

		beforeEach(function() {

			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget', { ids: ['podcast-exists'] })
				.reply(200, fixtureEsFound);

			return createInstance({
				params: {
					id: 'podcast-exists'
				}
			});
		});

		it('returns a successful response', function() {
			expect(next.callCount).to.equal(0);
			expect(response.statusCode).to.equal(200);
		});

		it('provides mapped podcast data to the template', function() {
			var result = response._getRenderData();
			var original = fixtureEsFound.docs[0]._source.item

			expect(result).to.be.an('object');
			expect(result.title).to.equal(original.title.title);
			expect(result.publishedDate).to.equal(original.lifecycle.lastPublishDateTime);
		});

	});

	describe('Failure', function() {

		beforeEach(function() {

			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget', { ids: ['podcast-does-not-exist'] })
				.reply(200, fixtureEsNotFound);

			return createInstance({
				params: {
					id: 'podcast-does-not-exist'
				}
			});
		});

		it('delegates errors back to next express', function() {
			expect(next.calledOnce).to.be.ok;
			expect(next.firstCall.args[0]).to.be.instanceof(Error);
		});

	});

});
