/*global it, describe, beforeEach*/
'use strict';

var nock = require('nock');
var sinon = require('sinon');
var expect = require('chai').expect;
var httpMocks = require('node-mocks-http');

var subject = require('../../../server/controllers/podcast');
var fixtureEsFound = require('../../fixtures/capi-v1-elastic-search-podcast');
var fixtureEsNotFound = require('../../fixtures/capi-v1-elastic-search-not-found');
var fixtureEsNoResults = require('../../fixtures/capi-v1-elastic-search-no-results');

describe('Podcasts Controller', function() {

	var request, response, next;

	function createInstance(params, flags) {
		next = sinon.stub();
		request = httpMocks.createRequest(params);
		response = httpMocks.createResponse();
		response.locals = { flags: flags || {} };
		return subject(request, response, next);
	}

	describe('Success', function() {

		beforeEach(function() {

			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget', { ids: ['podcast-exists'] })
				.reply(200, fixtureEsFound);

			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_search', function(postBody) {
					var id1 = fixtureEsFound.docs[0]._source.item.metadata.primarySection.term.id;
					var id2 = postBody.query.filtered.filter.term['item.metadata.sections.term.id'];
					return id1 === id2;
				})
				.reply(200, fixtureEsNoResults);

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
			var original = fixtureEsFound.docs[0]._source.item;

			expect(result).to.be.an('object');
			expect(result.title).to.equal(original.title.title);
			expect(result.publishedDate).to.equal(original.lifecycle.lastPublishDateTime);
		});

		it('adds related and further data', function() {
			var result = response._getRenderData();

			expect(result.dfp).to.be.an('object');
			expect(result.externalLinks).to.be.an('object');
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
