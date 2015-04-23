/*global describe, it*/
'use strict';

require('chai').should();
var extractUuid = require('../../../server/utils/extract-uuid');

describe('Extract UUID', function () {

	[{
		uri: 'http://www.ft.com/thing/7f473d26-be68-11e4-8036-00144feab7de',
		uuid: '7f473d26-be68-11e4-8036-00144feab7de'
	},
	{
		uri: 'http://api.ft.com/people/7f473d26-be68-11e4-8036-00144feab7de',
		uuid: '7f473d26-be68-11e4-8036-00144feab7de'
	},
	{
		uri: 'http://mapi.ft.com/organisations/7f473d26-be68-11e4-8036-00144feab7de',
		uuid: '7f473d26-be68-11e4-8036-00144feab7de'
	}].forEach(function (conf) {
		it('should extract correct uuid from ' + conf.uri, function () {
			extractUuid(conf.uri).should.equal(conf.uuid);
		});
	});

	it('should return uri if id cannot be extracted', function () {
		var badUri = 'http://www.not-ft.com/thing/7f473d26-be68-11e4-8036-00144feab7de';
		extractUuid(badUri).should.equal(badUri);
	});

});
