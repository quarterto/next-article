/*global describe, context, it beforeEach, afterEach, */

'use strict';

const nock = require('nock');
const sinon = require('sinon');
const expect = require('chai').expect;
const httpMocks = require('node-mocks-http');

const subject = require('../../../server/controllers/article-v3');
const fixtureEsFound = require('../../fixtures/v3-elastic-article-found');

describe.only('Article V3 Controller', function() {

	let request;
	let response;
	let next;

	function createInstance(params, flags) {
		next = sinon.stub();
		request = httpMocks.createRequest(params);
		response = httpMocks.createResponse();
		response.locals = { flags: flags || {} };
		return subject(request, response, next, fixtureEsFound);
	}

	beforeEach(function() {
		return createInstance();
	});

	context('Business as usual', function() {

		it('returns a successful response', function() {
			expect(next.callCount).to.equal(0);
			expect(response.statusCode).to.equal(200);
		});

		it('maps data for compatibility with legacy templates', function() {
			let result = response._getRenderData();

			expect(result.standFirst).to.not.be.undefined;
		});

		it('maps the metadata to legacy template compatible format', function() {
			let result = response._getRenderData();

			expect(result.tags.length).to.equal(5);

			result.tags.forEach(
				tag => expect(tag).to.include.keys('id', 'name', 'url')
			);
		});

		it('defines the primary tag and remove it from tags', function() {
			let result = response._getRenderData();

			expect(result.primaryTag).not.to.be.null;
			expect(result.primaryTag).to.include.keys('id', 'name', 'taxonomy');

			result.tags.forEach(
				tag => expect(tag.id).not.to.equal(result.primaryTag.id)
			);
		});

	});

});
