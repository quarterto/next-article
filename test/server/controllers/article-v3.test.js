/*global describe, context, it, beforeEach */

'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const fixtureEsFound = require('../../fixtures/v3-elastic-article-found').docs[0]._source;

const subject = proxyquire('../../../server/controllers/article-v3', {
	'../transforms/article-xslt': (article) => Promise.resolve(article.bodyXML),
	'../transforms/body': (articleHtml) => { return { html: () => articleHtml } }
});

describe('Article V3 Controller', function() {

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

	beforeEach(function() {
		result = null;

		let flags = {
			openGraph: true,
			twitterCards: true
		};

		return createInstance(null, flags).then(() => {
			result = response._getRenderData()
		});
	});

	context('Business as usual', function() {

		it('returns a successful response', function() {
			expect(next.callCount).to.equal(0);
			expect(response.statusCode).to.equal(200);
		});

		it('maps data for compatibility with legacy templates', function() {
			expect(result.standFirst).to.not.be.undefined;
		});

		it('provides more on data for related content', function() {
			expect(result.moreOns.length).to.equal(2);

			result.moreOns.forEach(
				tag => expect(tag).to.include.keys('title', 'url')
			);
		});

		it('provides dehydrated metadata for related content', function() {
			expect(result.dehydratedMetadata).to.include.keys('moreOns', 'package');

			result.dehydratedMetadata.moreOns.forEach(
				tag => expect(tag).to.include.keys('id', 'name', 'taxonomy')
			);

			expect(result.dehydratedMetadata.moreOns[0].id).to.equal('M2Y3OGJkYjQtMzQ5OC00NTM2LTg0YzUtY2JmNzZiY2JhZDQz-VG9waWNz');
			expect(result.dehydratedMetadata.moreOns[1].id).to.equal('NTg=-U2VjdGlvbnM=');

			expect(result.dehydratedMetadata.package).to.be.an.instanceOf(Array);
		});

		it('provides DFP data from metadata', function() {
			expect(result.dfp).to.include.keys('dfpSite', 'dfpZone');
		});

		it('provides Open Graph data', function() {
			expect(result.og).to.include.keys('title', 'description', 'url', 'image');
			expect(result.og.image).to.equal(fixtureEsFound.mainImage.url);
			expect(result.og.title).to.equal(fixtureEsFound.title);
		});

		it('provides Twitter card data', function() {
			expect(result.twitterCard).to.include.keys('title', 'description', 'url', 'image', 'card');
			expect(result.twitterCard.image).to.equal(fixtureEsFound.mainImage.url);
			expect(result.twitterCard.title).to.equal(fixtureEsFound.title);
			expect(result.twitterCard.card).to.equal('summary_large_image');
		});

	});

});
