/*global describe, context, it, beforeEach */

'use strict';

require('chai').should();

const sinon = require('sinon');
const proxyquire = require('proxyquire');
const httpMocks = require('node-mocks-http');

const stubs = {search: null};
const subject = proxyquire('../../../../server/controllers/related/more-on', {
	'next-ft-api-client': stubs,
	'../../mappings/article-pod-mapping-v3': (article) => article
});

const articlesMoreOnOne = [
	{id: '117bbe2c-9417-11e5-b190-291e94b77c8f', mainImage: true},
	{id: '79d6ce3a-93bd-11e5-bd82-c1fb87bef7af', mainImage: true},
	{id: 'eecf7c4a-92d3-11e5-bd82-c1fb87bef7af'},
	{id: '64492528-91d2-11e5-94e6-c5413829caa5', parent: true},
	{id: '6f8c134e-91d9-11e5-bd82-c1fb87bef7af'},
	{id: '5149fd6a-91fc-11e5-bd82-c1fb87bef7af'}
];
const articlesMoreOnTwo = [
	{id: '34afedae-92f1-11e5-9e3e-eb48769cecab', moreOnTwo: true},
	{id: '42b8ab40-93cb-11e5-9e3e-eb48769cecab', mainImage: true, moreOnTwo: true},
	{id: '79d6ce3a-93bd-11e5-bd82-c1fb87bef7af', dupe: true, moreOnTwo: true},
	{id: '3f4f748a-9375-11e5-9e3e-eb48769cecab', moreOnTwo: true},
	{id: '64492528-91d2-11e5-94e6-c5413829caa5', parent: true, moreOnTwo: true},
	{id: 'cd24b80e-92c8-11e5-94e6-c5413829caa5', moreOnTwo: true},
	{id: '6f8c134e-91d9-11e5-bd82-c1fb87bef7af', dupe: true, moreOnTwo: true},
	{id: '5149fd6a-91fc-11e5-bd82-c1fb87bef7af', dupe: true, moreOnTwo: true},
	{id: 'c7baeed0-91f9-11e5-94e6-c5413829caa5', moreOnTwo: true},
	{id: '915fe6b6-91c6-11e5-bd82-c1fb87bef7af', moreOnTwo: true},
	{id: 'cd99c5f0-91b9-11e5-94e6-c5413829caa5', moreOnTwo: true}
];
const articlesMoreOnThree = [
	{id: '34afedae-92f1-11e5-9e3e-eb48769cecab', dupe: true, moreOnThree: true},
	{id: '42b8ab40-93cb-11e5-9e3e-eb48769aaaaa', mainImage: true, moreOnThree: true},
	{id: '79d6ce3a-93bd-11e5-bd82-c1fb87bef7af', dupe: true, moreOnThree: true},
	{id: '3f4f748a-9375-11e5-9e3e-eb48769cecab', dupe: true, moreOnThree: true},
	{id: '64492528-91d2-11e5-94e6-c5413829caa5', parent: true, moreOnThree: true},
	{id: 'cd24b80e-92c8-11e5-94e6-c5413829aaaa', moreOnThree: true},
	{id: '6f8c134e-91d9-11e5-bd82-c1fb87bef7af', dupe: true, moreOnThree: true},
	{id: '5149fd6a-91fc-11e5-bd82-c1fb87bef7af', dupe: true, moreOnThree: true},
	{id: 'c7baeed0-91f9-11e5-94e6-c5413829caa5', dupe: true, moreOnThree: true},
	{id: '915fe6b6-91c6-11e5-bd82-c1fb87beaaaa', moreOnThree: true},
	{id: 'cd99c5f0-91b9-11e5-94e6-c5413829aaaa', moreOnThree: true},
	{id: '117bbe2c-9417-11e5-b190-291e94b77c8f', dupe: true, moreOnThree: true},
	{id: '79d6ce3a-93bd-11e5-bd82-c1fb87beaaaa', moreOnThree: true},
	{id: 'eecf7c4a-92d3-11e5-bd82-c1fb87bef7af', dupe: true, moreOnThree: true},
	{id: '64492528-91d2-11e5-94e6-c5413829aaaa', moreOnThree: true},
	{id: '6f8c134e-91d9-11e5-bd82-c1fb87bef7af', dupe: true, moreOnThree: true},
	{id: '5149fd6a-91fc-11e5-bd82-c1fb87beaaaa', moreOnThree: true}
];

describe('More Ons', () => {

	let request;
	let response;
	let result;
	let options;

	function createInstance(options, flags) {
		request = httpMocks.createRequest(options);
		response = httpMocks.createResponse();
		response.locals = { flags: flags || {} };
		return subject(request, response);
	}

	describe('first more on', () => {

		before(() => {

			stubs.search = sinon.stub().returns(
				Promise.resolve(articlesMoreOnOne)
			);
			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					tagIds: 'TnN0ZWluX0dMX0FS-R0w=,MjY=-U2VjdGlvbnM=',
					count: '5',
					index: '0'
				}
			};

			return createInstance(options).then(() => {
				result = response._getRenderData()
			});

		});

		it('call makes one call to ES', () => {
			stubs.search.callCount.should.eql(1);
		});

		it('return 5 articles per more-on', () => {
			result.articles.length.should.equal(5);
		});

		it('should not contain the parent article', () => {
			result.articles.filter(article => article.parent).should.have.length(0);
		});

		it('removes main image from all except the first article', () => {
			result.articles[0].mainImage.should.be.true;
			result.articles.filter(article => article.mainImage).should.have.length(1);
		});

	});

	describe('second more-on', () => {

		before(() => {

			let options;

			stubs.search = sinon.stub();
			stubs.search.onCall(0).returns(Promise.resolve(articlesMoreOnOne));
			stubs.search.onCall(1).returns(Promise.resolve(articlesMoreOnTwo));

			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					tagIds: 'TnN0ZWluX0dMX0FS-R0w=,MjY=-U2VjdGlvbnM=',
					count: '5',
					index: '1'
				}
			};

			return createInstance(options).then(() => {
				result = response._getRenderData()
			});

		});

		it('call makes two calls to ES', () => {
			stubs.search.callCount.should.eql(2);
		});

		it('return 5 articles per more-on', () => {
			result.articles.should.have.length(5);
		});

		it('it should not contain the parent article', () => {
			result.articles.filter(article => article.parent).should.have.length(0);
		});

		it('it should dedupe articles between more-ons', () => {
			result.articles.filter(article => article.dupe).should.have.length(0);
		});

		it('it should only return articles appropriate to the tag ID', () => {
			result.articles.filter(article => article.moreOnTwo).should.have.length(5);
		});

	});

	describe('third more-on', () => {

		before(() => {

			let options;

			stubs.search = sinon.stub();
			stubs.search.onCall(0).returns(Promise.resolve(articlesMoreOnOne));
			stubs.search.onCall(1).returns(Promise.resolve(articlesMoreOnTwo));
			stubs.search.onCall(2).returns(Promise.resolve(articlesMoreOnThree));

			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					tagIds: 'TnN0ZWluX0dMX0FS-R0w=,MjY=-U2VjdGlvbnM=,Th1rdM0re0n1D=',
					count: '5',
					index: '2'
				}
			};

			return createInstance(options).then(() => {
				result = response._getRenderData()
			});

		});

		it('call makes three calls to ES', () => {
			stubs.search.callCount.should.eql(3);
		});

		it('return 5 articles per more-on', () => {
			result.articles.should.have.length(5);
		});

		it('should not contain the parent article', () => {
			result.articles.filter(article => article.parent).should.have.length(0);
		});

		it('should dedupe articles between more-ons', () => {
			result.articles.filter(article => article.dupe).should.have.length(0);
		});

		it('should only return articles appropriate to the tag ID', () => {
			result.articles.filter(article => article.moreOnThree).should.have.length(5);
		});

	});

	describe('limiting the number of more-ons that can be requested', () => {

		before(() => {

			let options;

			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					tagIds: 'F1r5t,S3c0nd,Th1rd,F0urth,F1fth,S1xth',
					count: '5',
					index: '5'
				}
			};

			return createInstance(options);

		});

		it('should return an error if an index higher than 4 is requested', () => {
			response.statusCode.should.equal(400);
		});

	});

	describe('limiting the number of articles per more on', () => {

		let expectedSearchArgs = {
			filter: [ 'metadata.idV1', 'TnN0ZWluX0dMX0FS-R0w=' ],
			count: 11,
			fields: ['id','title','metadata','summaries','mainImage','publishedDate']
		};

		before(() => {

			stubs.search = sinon.stub().returns(Promise.resolve(articlesMoreOnOne));

			options = {
				params: {id: '64492528-91d2-11e5-94e6-c5413829caa5'},
				query: {
					tagIds: 'TnN0ZWluX0dMX0FS-R0w=',
					count: '11',
					index: '0'
				}
			};

			return createInstance(options);
		});

		it('should limit the request if more than 10 articles per more on are requested', () => {
			stubs.search.calledWithExactly(expectedSearchArgs).should.be.true;
		});

	});


});
