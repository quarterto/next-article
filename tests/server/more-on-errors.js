/*global it, describe, before*/
'use strict';

var PORT = process.env.PORT || 3001;
var expect = require('chai').expect;
var app = require('../../server/app');
var nock = require('nock');

describe('more-on', function () {

	before(function() {
		return app.listen;
	});

	it('should behave gracefully if there is no primaryTheme', function() {
		nock('http://api.ft.com')
			.filteringPath(/content\/items\/v1\/.*\?feature.blogposts=on$/, 'content/items/v1/XXX?feature.blogposts=on')
			.get('/content/items/v1/XXX?feature.blogposts=on')
			.reply(200, require('../fixtures/capiv1-article-no-primary-theme.json'));
		nock('http://api.ft.com')
			.filteringPath(/content\/.*\?sjl=WITH_RICH_CONTENT$/, 'content/XXX?sjl=WITH_RICH_CONTENT')
			.get('/content/XXX?sjl=WITH_RICH_CONTENT')
			.times(5)
			.reply(200, require('../fixtures/capiv2-article.json'));

		return fetch('http://localhost:'+PORT+'/more-on/f2b13800-c70c-11e4-8e1f-00144feab7de')
			.then(function(response) {
				expect(response.ok).to.be.true;
			});
	});

});
