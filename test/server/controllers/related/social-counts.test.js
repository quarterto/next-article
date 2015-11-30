/*global describe, context, it, before */

'use strict';

require('chai').should();

const httpMocks = require('node-mocks-http');
const nock = require('nock');
const subject = require('../../../../server/controllers/related/social-counts');
const articleUrl = 'http://www.ft.com/cms/s/0/3a9f8cd6-968b-11e5-95c7-d47aa298f769.html';


describe('Social Counts', () => {

	let request;
	let response;
	let options;

	function createInstance(options) {
		request = httpMocks.createRequest(options);
		response = httpMocks.createResponse();
		return subject(request, response);
	}

	describe('get the social counts for an article ', () => {

		before(() => {

			const apiResponse = {"http://www.ft.com/cms/s/0/3a9f8cd6-968b-11e5-95c7-d47aa298f769.html": 24};

			nock('https://ft-next-sharedcount-api.herokuapp.com')
				.get('/v1/getCounts')
				.query(true)
				.reply(200, apiResponse);

			options = {
				query: {
					url: articleUrl
				}
			};

			return createInstance(options);

		});

		it('should return an OK status code', () => {
			response.statusCode.should.equal(200);
		});

		it('should return the share count in a JSON object', () => {
			JSON.parse(response._getData()).shares.should.equal(24);
		});

	});

});
