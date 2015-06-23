/*global describe, it*/
'use strict';

var cheerio = require('cheerio');
var expect = require('chai').expect;
var subheadersTransform = require('../../../server/transforms/subheaders');

describe('Subheaders', function () {

	it('should update subheaders', function() {
		var $ = cheerio.load('<h3 class="ft-subhead">The new big earners</h3>');
		$ - subheadersTransform($);

		expect($.html()).to.equal(
			'<h3 class="ft-subhead article__subhead ng-pull-out" id="subhead-1">' +
				'<span class="article__subhead__title">The new big earners</span>' +
			'</h3>'
		);
	});

});
