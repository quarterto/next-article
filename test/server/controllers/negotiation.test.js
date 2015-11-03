/*global describe, context, beforeEach, afterEach, it*/

'use strict';

const nock = require('nock');
const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const fixtureInteractives = require('../../fixtures/interactive-graphics');
// const fixturePodcast = require('../../fixtures/v3-elastic-podcast-found');
const fixtureArticle = require('../../fixtures/v3-elastic-article-found');
const fixtureNotFound = require('../../fixtures/v3-elastic-not-found');

const dependencyStubs = {
	igPoller: { getData: () => fixtureInteractives },
	// podcastV3: sinon.spy(),
	articleV3: sinon.spy(),
	interactive: sinon.spy()
};

const subject = proxyquire('../../../server/controllers/negotiation', {
	'../lib/ig-poller': dependencyStubs.igPoller,
	// './podcast-v3': dependencyStubs.podcastV3,
	'./article-v3': dependencyStubs.articleV3,
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

	// TODO: re-implement podcasts
	xdescribe('when the requested article is a podcast', function() {
		beforeEach(function() {

			nock('https://next-elastic.ft.com')
				.post('/v3_api_v2/item/_mget')
				.reply(200, null);

			return createInstance({
				params: {
					id: '55ef024ec7a00b32cb5a5991'
				}
			});

		});

		afterEach(function() {
			dependencyStubs.podcastV3.reset();
		});

		it('defers to the podcast legacy controller', function() {
			expect(dependencyStubs.podcastV3.callCount).to.equal(1);
			expect(response.statusCode).to.not.equal(404);
		});
	});

	describe('when dealing with an article', function() {
		context('and it is found', function() {
			beforeEach(function() {

				nock('https://next-elastic.ft.com')
					.post('/v3_api_v2/item/_mget')
					.reply(200, fixtureArticle);

				return createInstance({
					params: {
						id: '352210c4-7b17-11e5-a1fe-567b37f80b64'
					}
				});

			});

			afterEach(function() {
				dependencyStubs.articleV3.reset();
			});

			it('defers to the article controller', function() {
				expect(dependencyStubs.articleV3.callCount).to.equal(1);
				expect(response.statusCode).to.not.equal(404);
			});
		});

		context('when it exists on ft.com', function() {
			beforeEach(function() {

				nock('https://next-elastic.ft.com')
					.post('/v3_api_v2/item/_mget')
					.reply(200, fixtureNotFound)

				return createInstance({
					params: {
						id: '8f88c930-d00a-11da-80fb-0000779e2340'
					}
				});

			});

			afterEach(function() {
				dependencyStubs.articleV3.reset();
			});

			it('redirects to ft.com', function() {
				expect(dependencyStubs.articleV3.callCount).to.equal(0);
				expect(response.statusCode).to.equal(302);
			});
		});

		context('when it does not exist', function() {
			beforeEach(function() {

				nock('https://next-elastic.ft.com')
					.post('/v3_api_v2/item/_mget')
					.reply(200, fixtureNotFound)

				return createInstance({
					params: {
						id: '00000000-0000-0000-0000-000000000000'
					}
				});

			});

			afterEach(function() {
				dependencyStubs.articleV3.reset();
			});

			it('responds with a 404', function() {
				expect(dependencyStubs.articleV3.callCount).to.equal(0);
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
			})
				.then(() => {
					expect(response.statusCode).to.equal(302);
				});
		});
	})

});
