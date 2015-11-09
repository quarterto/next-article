/*global it, describe, beforeEach*/
'use strict';

var nock = require('nock');
var sinon = require('sinon');
var expect = require('chai').expect;
var httpMocks = require('node-mocks-http');

var subject = require('../../../server/controllers/podcast');
var fixtureEsFound = require('../../fixtures/capi-v1-elastic-search-podcast');
var fixtureEsNoResults = require('../../fixtures/capi-v1-elastic-search-no-results');

describe('Podcast Controller', function() {

	var request;
	var response;
	var next;

	function createInstance(params, flags) {
		next = sinon.stub();
		request = httpMocks.createRequest(params);
		response = httpMocks.createResponse();
		response.locals = { flags: flags || {} };
		return subject(request, response, next, fixtureEsFound.docs[0]._source);
	}

	function matchRelatedPostBody(body) {
		var id1 = fixtureEsFound.docs[0]._source.item.metadata.primarySection.term.id;
		var id2 = body.query.filtered.filter.term['item.metadata.sections.term.id'];
		return id1 === id2;
	}

	describe('Business as usual', function() {

		beforeEach(function() {

			nock('https://next-elastic.ft.com')
				.post('/v1_api_v2/item/_search', matchRelatedPostBody)
				.reply(200, fixtureEsNoResults);

			return createInstance();
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
			expect(result.relatedContent).to.be.an('array');
		});

	});

	describe('Related content failure', function() {

		beforeEach(function() {

			nock('https://next-elastic.ft.com')
				.post('/v1_api_v2/item/_search', matchRelatedPostBody)
				.reply(500, 'This is broken');

			return createInstance();
		});

		it('returns a successful response', function() {
			expect(next.callCount).to.equal(0);
			expect(response.statusCode).to.equal(200);
		});

		it('adds related and further data', function() {
			var result = response._getRenderData();

			expect(result.relatedContent).to.be.an('array');
		});

	});

});
