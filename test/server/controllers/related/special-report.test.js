/*global describe, context, it, beforeEach */

'use strict';

require('chai').should();

const sinon = require('sinon');
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const stubs = {search: null};
const subject = proxyquire('../../../../server/controllers/related/special-report', {
	'next-ft-api-client': stubs,
	'../../mappings/article-pod-mapping-v3': (article) => article
});

const articlesSpecialReport = [
	{id: '117bbe2c-9417-11e5-b190-291e94b77c8f', primaryTag: {idV1: '1', prefLabel: 'Special Report'}},
	{id: '79d6ce3a-93bd-11e5-bd82-c1fb87bef7af', mainImage: 'first'},
	{id: 'eecf7c4a-92d3-11e5-bd82-c1fb87bef7af', mainImage: 'second'},
	{id: '64492528-91d2-11e5-94e6-c5413829caa5', parent: true},
	{id: '6f8c134e-91d9-11e5-bd82-c1fb87bef7af'},
	{id: '5149fd6a-91fc-11e5-bd82-c1fb87bef7af'}
];

let options;
let request;
let response;
let result;

describe('Special Report', () => {

	function createInstance(options) {
		request = httpMocks.createRequest(options);
		response = httpMocks.createResponse();
		return subject(request, response);
	}

	describe('getting most recent articles in a special report', () => {

		before(() => {

			stubs.search = sinon.stub().returns(
				Promise.resolve(articlesSpecialReport)
			);
			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					tagId: 'TnN0ZWluX0dMX0FS-R0w=',
					count: '5'
				}
			};

			return createInstance(options).then(() => {
				result = response._getRenderData()
			});

		});

		it('should return a list of 5 articles', () => {
			result.articles.should.have.length(5);
		});

		it('should extract the image from the first article with an image', () => {
			result.image.should.equal('first');
		});

		it('should get the special report id and name from the first article', () => {
			result.id.should.eql(articlesSpecialReport[0].primaryTag.idV1);
			result.name.should.equal(articlesSpecialReport[0].primaryTag.prefLabel);
		});

		it('should not return the parent article in the list', () => {
			result.articles.filter(article => article.parent).should.have.length(0);
		});

	});

	describe('restricting the number of articles returned', () => {

		before(() => {

			stubs.search = sinon.stub().returns(
				Promise.resolve(articlesSpecialReport)
			);
			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					tagId: 'TnN0ZWluX0dMX0FS-R0w=',
					count: '3'
				}
			};

			return createInstance(options).then(() => {
				result = response._getRenderData()
			});

		});

		it('should return the specified number of articles', () => {
			result.articles.should.have.length(3);
		});
	});

	describe('not sending through a tag id', () => {

		before(() => {

			stubs.search = sinon.stub()

			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					count: '5'
				}
			};

			return createInstance(options);

		});

		it('should return a staus of 400', () => {
			response.statusCode.should.eql(400);
		});
	});

	describe('no articles returned', () => {

		before(() => {

			stubs.search = sinon.stub().returns(Promise.resolve([]));

			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					tagId: 'Arand0mTag',
					count: '5'
				}
			};

			return createInstance(options);

		});

		it('should return a status code of 200', () => {
			response.statusCode.should.eql(200);
		});

	});

});
