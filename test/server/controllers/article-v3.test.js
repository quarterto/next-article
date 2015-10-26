/*global describe, context, it beforeEach, afterEach, */

'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const fixtureEsFound = require('../../fixtures/v3-elastic-article-found');

const subject = proxyquire('../../../server/controllers/article-v3', {
	'../transforms/article-xslt': (article) => Promise.resolve(article.bodyXML),
	'../transforms/body': (articleHtml) => { return { html: () => articleHtml } }
});

describe('Article V3 Controller', function() {

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

		it('defines the primary tag and removes it from tags', function() {
			let result = response._getRenderData();

			expect(result.primaryTag).not.to.be.null;
			expect(result.primaryTag).to.include.keys('id', 'name', 'taxonomy');

			result.tags.forEach(
				tag => expect(tag.id).not.to.equal(result.primaryTag.id)
			);
		});

		it('provides more on data for related content', function() {
			let result = response._getRenderData();

			expect(result.moreOns.length).to.equal(2);

			result.moreOns.forEach(
				tag => expect(tag).to.include.keys('metadata', 'title')
			);

			expect(result.moreOns[result.moreOns.length - 1]).to.include.keys('class');
		});

		it('provides dehydrated metadata for related content', function() {
			let result = response._getRenderData();

			expect(result.dehydratedMetadata).to.include.keys('primaryTheme', 'primarySection', 'package');

			// TODO: this is for V1 and V2 compatibility and nesting should be removed
			expect(result.dehydratedMetadata.primaryTheme.term).to.include.keys('id', 'name', 'taxonomy');
			expect(result.dehydratedMetadata.primarySection.term).to.include.keys('id', 'name', 'taxonomy');

			expect(result.dehydratedMetadata.package).to.be.an.instanceOf(Array);
		});

		it('provides DFP data from metadata', function() {
			let result = response._getRenderData();

			expect(result.dfp).to.include.keys('dfpSite', 'dfpZone');
		});

	});

});
