/*global describe, context, it, before */

'use strict';

require('chai').should();

const sinon = require('sinon');
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const stubs = {content: null};
const subject = proxyquire('../../../../server/controllers/related/story-package', {
	'next-ft-api-client': stubs,
	'../../mappings/article-pod-mapping-v3': (article) => article
});

const articleIds = ['117bbe2c-9417-11e5-b190-291e94b77c8f',
'79d6ce3a-93bd-11e5-bd82-c1fb87bef7af',
'eecf7c4a-92d3-11e5-bd82-c1fb87bef7af',
'64492528-91d2-11e5-94e6-c5413829caa5',
'6f8c134e-91d9-11e5-bd82-c1fb87bef7af'].join(',');

const articlesStoryPackage = [
	{id: '117bbe2c-9417-11e5-b190-291e94b77c8f', mainImage: true},
	{id: '79d6ce3a-93bd-11e5-bd82-c1fb87bef7af', mainImage: true},
	{id: 'eecf7c4a-92d3-11e5-bd82-c1fb87bef7af', mainImage: true},
	{id: '64492528-91d2-11e5-94e6-c5413829caa5', mainImage: true},
	{id: '6f8c134e-91d9-11e5-bd82-c1fb87bef7af', mainImage: true}
];


describe('Story Package', () => {

	let request;
	let response;
	let result;
	let options;

	function createInstance(options) {
		request = httpMocks.createRequest(options);
		response = httpMocks.createResponse();
		return subject(request, response);
	}

	describe('processing a valid story package ', () => {

		before(() => {


			stubs.content = sinon.stub().returns(
				Promise.resolve(articlesStoryPackage)
			);
			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					articleIds: articleIds,
					count: '5'
				}
			};

			return createInstance(options).then(() => {
				result = response._getRenderData()
			});

		});

		it('makes one call to ES', () => {
			stubs.content.callCount.should.eql(1);
		});

		it('should return an OK status code', () => {
			response.statusCode.should.equal(200);
		});

		it('removes main image from all except the first article', () => {
			result.articles[0].mainImage.should.be.true;
			result.articles.filter(article => article.mainImage).should.have.length(1);
		});

		it('should add the header text of Related Stories', () => {
			result.headerText.should.equal('Related stories');
		});

	});

	describe('no article ids provided', () => {

		before(() => {

			let options;

			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					count: '5'
				}
			};

			return createInstance(options);

		});

		it('should return a 400 status code', () => {
			response.statusCode.should.eql(400);
		});

	});

	describe('count set to fewer than number of articles', () => {

		const expectedContentArgs = {
			index: 'v3_api_v2',
			uuid: ['117bbe2c-9417-11e5-b190-291e94b77c8f',
			'79d6ce3a-93bd-11e5-bd82-c1fb87bef7af']
		}

		before(() => {

			let options;


			stubs.content = sinon.stub().returns(
				Promise.resolve(articlesStoryPackage)
			);

			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					articleIds: articleIds,
					count: '2'
				}
			};

			return createInstance(options);

		});

		it('it sends the right number of articles to ES', () => {
			stubs.content.calledWithExactly(expectedContentArgs).should.be.true;
		});

	});

});
