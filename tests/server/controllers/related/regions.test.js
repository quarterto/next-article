/*global describe, it*/
'use strict';

require('chai').should();
var nock = require('nock');

var helpers = require('../../helpers');

module.exports = function() {

	describe('Related - Regions', function() {

		it('should be successful ', function() {
			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget')
				.reply(200, require('../../../fixtures/capi-v1-elastic-search.json'));

			return fetch(helpers.host + '/f2b13800-c70c-11e4-8e1f-00144feab7de/regions')
				.then(function (response) {
					response.status.should.equal(200);
					return response.text().then(function (text) {
						text.should.not.be.empty;
					});
				});
		});

		it('should return 404 if article doesn‘t exist', function () {
			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget')
				.times(4)
				.reply(404);

			return fetch(helpers.host + '/f2b13800-c70c-11e4-8e1f-00144feab7de/regions')
				.then(function (response) {
					response.status.should.equal(404);
				});
		});

		it('should return 200 and empty response if no related regions', function () {
			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget')
				.reply(200, require('../../../fixtures/capi-v1-elastic-search-no-meta.json'));

			return fetch(helpers.host + '/f2b13800-c70c-11e4-8e1f-00144feab7de/regions')
				.then(function (response) {
					response.status.should.equal(200);
					return response.text().then(function (text) {
						text.should.be.empty;
					});
				});
		});

	});

};
