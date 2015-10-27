/*global describe, context, beforeEach, afterEach, it*/

'use strict';

const nock = require('nock');
const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const fixtureInteractives = require('../../fixtures/interactive-graphics');
const fixturePodcastV1 = require('../../fixtures/capi-v1-elastic-search-podcast');
const fixtureArticleV1 = require('../../fixtures/capi-v1-elastic-search');
const fixtureArticleV2 = require('../../fixtures/capi-v2-elastic');
const fixtureV1NotFound = require('../../fixtures/capi-v1-elastic-search-not-found');
const fixtureV2NotFound = require('../../fixtures/capi-v2-elastic-search-not-found');

const dependencyStubs = {
	igPoller: { getData: () => fixtureInteractives },
	articleLegacy: sinon.spy(),
	podcastLegacy: sinon.spy(),
	interactive: sinon.spy()
};

const subject = proxyquire('../../../server/controllers/negotiation', {
	'../lib/ig-poller': dependencyStubs.igPoller,
	'./article-legacy': dependencyStubs.articleLegacy,
	'./podcast-legacy': dependencyStubs.podcastLegacy,
	'./interactive': dependencyStubs.interactive
});

describe('Negotiation Controller', function() {

	let request;
	let response;
	let next;

	function createInstance(params, flags) {
		next = sinon.stub();
		request = httpMocks.createRequest(params);
		response = httpMocks.createResponse();
		response.locals = { flags: flags || {} };
		return subject(request, response, next);
	}

	describe('when the requested ID maps to an interactive', function() {
		beforeEach(function() {
			return createInstance({
				params: {
					id: '012f81d6-2e2b-11e5-8873-775ba7c2ea3d'
				}
			});
		});

		afterEach(function() {
			dependencyStubs.interactive.reset();
		});

		it('defers to the interactive controller', function() {
			expect(dependencyStubs.interactive.callCount).to.equal(1);
			expect(response.statusCode).to.not.equal(404);
		});
	});

	describe('when the requested article is a podcast', function() {
		beforeEach(function() {

			nock('https://next-elastic.ft.com')
				.post('/v1_api_v2/item/_mget')
				.reply(200, fixturePodcastV1)

			nock('https://next-elastic.ft.com')
				.post('/v2_api_v2/item/_mget')
				.reply(200, fixtureV2NotFound);

			return createInstance({
				params: {
					id: '55ef024ec7a00b32cb5a5991'
				}
			}, { elasticSearchItemGet: true });

		});

		afterEach(function() {
			dependencyStubs.podcastLegacy.reset();
		});

		it('defers to the podcast legacy controller', function() {
			expect(dependencyStubs.podcastLegacy.callCount).to.equal(1);
			expect(response.statusCode).to.not.equal(404);
		});
	});

	describe('when dealing with an article', function() {
		context('and we have a V1 and V2 response', function() {
			beforeEach(function() {

				nock('https://next-elastic.ft.com')
					.post('/v1_api_v2/item/_mget')
					.reply(200, fixtureArticleV1)

				nock('https://next-elastic.ft.com')
					.post('/v2_api_v2/item/_mget')
					.reply(200, fixtureArticleV2);

				return createInstance({
					params: {
						id: 'a1fb6fee-93ae-359d-be8f-f215920b79ff'
					}
				}, { elasticSearchItemGet: true });

			});

			afterEach(function() {
				dependencyStubs.articleLegacy.reset();
			});

			it('defers to the article legacy controller', function() {
				expect(dependencyStubs.articleLegacy.callCount).to.equal(1);
				expect(response.statusCode).to.not.equal(404);
			});
		});

		context('and we have a V1 only response', function() {
			beforeEach(function() {

				nock('https://next-elastic.ft.com')
					.post('/v1_api_v2/item/_mget')
					.reply(200, fixtureArticleV1)

				nock('https://next-elastic.ft.com')
					.post('/v2_api_v2/item/_mget')
					.reply(200, fixtureV2NotFound);

				return createInstance({
					params: {
						id: '0e43fa9c-cbeb-11e0-9176-00144feabdc0'
					}
				}, { elasticSearchItemGet: true });

			});

			afterEach(function() {
				dependencyStubs.articleLegacy.reset();
			});

			it('redirects to ft.com', function() {
				expect(response.statusCode).to.equal(302);
			});
		});

		context('and we have a V2 only response', function() {
			beforeEach(function() {

				nock('https://next-elastic.ft.com')
					.post('/v1_api_v2/item/_mget')
					.reply(200, fixtureV1NotFound)

				nock('https://next-elastic.ft.com')
					.post('/v2_api_v2/item/_mget')
					.reply(200, fixtureArticleV2);

				return createInstance({
					params: {
						id: 'b002e5ee-3096-3f51-9925-32b157740c98'
					}
				}, { elasticSearchItemGet: true });

			});

			afterEach(function() {
				dependencyStubs.articleLegacy.reset();
			});

			it('defers to the article legacy controller', function() {
				expect(dependencyStubs.articleLegacy.callCount).to.equal(1);
				expect(response.statusCode).to.not.equal(404);
			});
		});

		context('and we have neither a V1 nor V2 response', function() {
			beforeEach(function() {

				nock('https://next-elastic.ft.com')
					.post('/v1_api_v2/item/_mget')
					.reply(200, fixtureV1NotFound)

				nock('https://next-elastic.ft.com')
					.post('/v2_api_v2/item/_mget')
					.reply(200, fixtureV2NotFound);

				return createInstance({
					params: {
						id: 'this-does-not-exist'
					}
				}, { elasticSearchItemGet: true });

			});

			afterEach(function() {
				dependencyStubs.articleLegacy.reset();
			});

			it('responds with a 404', function() {
				expect(dependencyStubs.articleLegacy.callCount).to.equal(0);
				expect(response.statusCode).to.equal(404);
			});
		});
	});


	describe('for live blogs', () => {
		it('should redirect back to FT.com', () => {
			nock('https://next-elastic.ft.com')
				.post('/v3_api_v2/item/_mget')
				.reply(200, {
					docs: [{
						found: true,
						_source: {
							webUrl: 'http://ftalphaville.ft.com/marketslive/2015-10-27/'
						}
					}]
				});

			return createInstance({
				params: { id: 'uuid' }
			}, { elasticV3: true })
				.then(() => {
					expect(response.statusCode).to.equal(302);
				});
		});
	})

});
