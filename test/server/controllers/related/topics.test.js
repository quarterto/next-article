/*global describe, it*/
'use strict';

require('chai').should();
var nock = require('nock');

var helpers = require('../../helpers');

module.exports = function() {

	describe('Related - Topics', function() {

		it('should return 200 and empty response if no related topics', function () {
			nock('https://ft-elastic-search.com')
				.post('/v1_api_v2/item/_mget')
				.reply(200, require('../../../fixtures/capi-v1-elastic-search-no-meta.json'));

			return fetch(helpers.host + '/article/f2b13800-c70c-11e4-8e1f-00144feab7de/topics')
				.then(function (response) {
					response.status.should.equal(200);
					return response.text().then(function (text) {
						text.should.be.empty;
					});
				});
		});

	});

};
