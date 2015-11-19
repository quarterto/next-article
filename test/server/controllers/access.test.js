/*global describe, it, before */

'use strict';

const nock = require('nock');
const sinon = require('sinon');
const expect = require('chai').expect;
const httpMocks = require('node-mocks-http');

const subject = require('../../../server/controllers/access');

const WEB_URLS = [
	{
		id: '459ef70a-4a43-11e5-b558-8a9722977189',
		name: 'Free article',
		header: 'unconditional',
		webUrl: 'http://www.ft.com/cms/s/2/459ef70a-4a43-11e5-b558-8a9722977189.html'
	},
	{
		id: 'b30c8de4-4754-11e5-af2f-4d6e0e5eda22',
		name: 'Standard article',
		header: 'conditional_standard',
		webUrl: 'http://www.ft.com/cms/s/0/b30c8de4-4754-11e5-af2f-4d6e0e5eda22.html'
	},
	{
		id: 'fe857b82-4add-11e5-9b5d-89a026fda5c9',
		name: 'Premium article',
		header: 'conditional_premium',
		webUrl: 'http://www.ft.com/cms/s/3/fe857b82-4add-11e5-9b5d-89a026fda5c9.html'
	},
	{
		id: '06d867f9-37d0-3ea8-965e-34043575e607',
		name: 'Alphaville',
		header: 'conditional_registered',
		webUrl: 'http://ftalphaville.ft.com/2015/08/25/2138457/why-chinas-stock-market-implosion-might-not-be-very-meaningful/'
	},
	{
		id: 'b002e5ee-3096-3f51-9925-32b157740c98',
		name: 'FastFT',
		header: 'conditional_standard',
		webUrl: 'http://www.ft.com/fastft?post=305103'
	},
	{
		id: 'a0c29efb-09a5-3ab4-a624-518d16c54c4b',
		name: 'Blog for registered users',
		header: 'conditional_registered',
		webUrl: 'http://blogs.ft.com/tech-blog/2015/07/oneplus-2-equals-hype-and-high-hopes-for-chinese-smartphone-start-up/'
	},
	{
		id: '4b3f14b6-344e-11e5-bdbb-35e55cbae175',
		name: 'Blog for subscribers',
		header: 'conditional_standard',
		webUrl: 'http://www.ft.com/cms/s/0/4b3f14b6-344e-11e5-bdbb-35e55cbae175.html'
	}
];

describe('Access Controller', () => {

	let request;
	let response;
	let next;

	function createInstance(params) {
		next = sinon.stub();
		request = httpMocks.createRequest(params);
		response = httpMocks.createResponse();

		// Vary method is not a thing in node-mocks-http module ATM
		response.vary = sinon.stub();

		return subject(request, response, next);
	}

	WEB_URLS.forEach(item => {

		describe(`for ${item.name}`, () => {

			before(() => {
				nock('https://next-elastic.ft.com')
					.post('/v3_api_v2/item/_mget')
					.reply(200, {
						docs: [
							{
								found: true,
								_source: {
									webUrl: item.webUrl
								}
							}
						]
					});

				return createInstance({
					params: {
						id: item.id
					},
					headers: {
						'X-FT-Access-Metadata': 'remote_headers'
					}
				});
			});

			it('returns a successful response', () => {
				expect(next.callCount).to.equal(0);
				expect(response.statusCode).to.equal(200);
			});

			it('returns the correct access header for different types of content', () => {
				expect(response.getHeader('X-FT-UID')).to.equal(item.id);
				expect(response.getHeader('X-FT-Content-Classification')).to.equal(item.header);
			});

		});

	});


});
