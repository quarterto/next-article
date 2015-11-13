/*global describe, context, it, beforeEach */

'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const fixtureEsFound = require('../../fixtures/v3-elastic-podcast-found').docs[0]._source;

const subject = proxyquire('../../../server/controllers/podcast', {
	'./article-helpers/suggested': () => Promise.resolve()
});

describe('Podcast Controller', () => {

	let request;
	let response;
	let next;
	let result;

	function createInstance(params, flags) {
		next = sinon.stub();
		request = httpMocks.createRequest(params);
		response = httpMocks.createResponse();
		response.locals = { flags: flags || {} };
		return subject(request, response, next, fixtureEsFound);
	}

	beforeEach(() => {
		result = null;

		let flags = {
			openGraph: true
		};

		return createInstance(null, flags).then(() => {
			result = response._getRenderData()
		});
	});

	it('returns a successful response', () => {
		expect(next.callCount).to.equal(0);
		expect(response.statusCode).to.equal(200);
	});

	it('provides related data for podcasts', () => {
		let result = response._getRenderData();

		expect(result.externalLinks).to.be.an('object');
		expect(result.externalLinks).to.include.keys('itunes', 'stitcher', 'audioboom');

		expect(result.media).to.be.an('object');
		expect(result.media).to.include.keys('mediaType', 'url');
	});

	it('provides DFP data from metadata', () => {
		expect(result.dfp).to.include.keys('dfpSite', 'dfpZone');
	});

});
