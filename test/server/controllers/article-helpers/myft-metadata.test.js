/*global describe, context, it, beforeEach */

'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const fixtureEsFound = require('../../../fixtures/v3-elastic-article-found').docs[0]._source;

const subject = proxyquire('../../../../server/controllers/article', {
	'./article-helpers/suggested': () => Promise.resolve(),
	'../transforms/article-xslt': (article) => Promise.resolve(article.bodyXML),
	'../transforms/body': (articleHtml) => { return { html: () => articleHtml } }
});

describe('myFT metadata', () => {

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

		return createInstance({query: {
			myftTopics: 'NTc=-U2VjdGlvbnM=,NTQ=-U2VjdGlvbnM='
		}}, flags).then(() => {
			result = response._getRenderData();
		});
	});

	it('it should promote users myft tags to be displayed', () => {
		expect(result.tags.find(tag => tag.id === 'NTc=-U2VjdGlvbnM=')).to.exist;
		expect(result.tags.find(tag => tag.id === 'NTQ=-U2VjdGlvbnM=')).to.exist;
	});

});
