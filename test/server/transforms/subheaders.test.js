/*global describe, it*/
'use strict';

var cheerio = require('cheerio');
var expect = require('chai').expect;
var subheadersTransform = require('../../../server/transforms/subheaders');

describe('Subheaders', function () {

	it('should update subheaders', function() {
		var $ = cheerio.load('<h3 class="ft-subhead">The new big earners</h3>');
		$ - subheadersTransform($, {});

		expect($.html()).to.equal(
			'<h2 class="article__subhead article__subhead--crosshead ng-pull-out" id="crosshead-1">' +
				'The new big earners' +
			'</h2>'
		);
	});

	it('should create subheaders (if flag is on)', function() {
		var $ = cheerio.load('<h3 class="ft-subhead">The new big earners</h3>');
		$ - subheadersTransform($, { articleCrossheads: true });

		expect($.html()).to.equal(
			'<h2 class="article__subhead article__subhead--standard">' +
				'The new big earners' +
			'</h2>'
		);
	});

	it('should create crossheads (if flag is on)', function() {
		var $ = cheerio.load('<h3 class="ft-subhead"><strong>The new big earners</strong></h3>');
		$ - subheadersTransform($, { articleCrossheads: true });

		expect($.html()).to.equal(
			'<h2 class="article__subhead article__subhead--crosshead ng-pull-out" id="crosshead-1">' +
				'The new big earners' +
			'</h2>'
		);
	});

});
