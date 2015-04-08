/*global describe, it*/
'use strict';

require('chai').should();
var nock = require('nock');

var helpers = require('../../helpers');

module.exports = function () {

	describe('Related - People', function () {

		it('should be successful ', function () {
			nock('https://ft-elastic-search.com')
				.get('/v1_api_v2/item/f2b13800-c70c-11e4-8e1f-00144feab7de')
				.reply(200, require('../../../fixtures/capi-v1-elastic-search.json'));
			nock('https://next-v1tov2-mapping-dev.herokuapp.com')
				.filteringPath(/^\/concordance_mapping_v1tov2\/people\/.*$/, '/concordance_mapping_v1tov2/people/XXX')
				.get('/concordance_mapping_v1tov2/people/XXX')
				.reply(200, require('../../../fixtures/mapping.json'));

			return fetch(helpers.host + '/f2b13800-c70c-11e4-8e1f-00144feab7de/people')
				.then(function (response) {
					response.status.should.equal(200);
					return response.text().then(function (text) {
						text.should.not.be.empty;
					});
				});
		});

		it('should return 404 if article doesn‘t exist', function () {
			nock('https://ft-elastic-search.com')
				.get('/v1_api_v2/item/f2b13800-c70c-11e4-8e1f-00144feab7de')
				.reply(404);

			return fetch(helpers.host + '/f2b13800-c70c-11e4-8e1f-00144feab7de/people')
				.then(function (response) {
					response.status.should.equal(404);
				});
		});

		it('should return 200 and empty response if no related people', function () {
			nock('https://ft-elastic-search.com')
				.get('/v1_api_v2/item/f2b13800-c70c-11e4-8e1f-00144feab7de')
				.reply(200, require('../../../fixtures/capi-v1-elastic-search-no-people.json'));

			return fetch(helpers.host + '/f2b13800-c70c-11e4-8e1f-00144feab7de/people')
				.then(function (response) {
					response.status.should.equal(200);
					return response.text().then(function (text) {
						text.should.be.empty;
					});
				});
		});

	});

};
