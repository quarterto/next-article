/*global describe, it*/
'use strict';

var cheerio = require('cheerio');
require('chai').should();
var subheadersTransform = require('../../../server/transforms/subheaders');

describe('Subheaders', function () {

	it('should create subheaders', function() {
		var $ = cheerio.load('<h3 class="ft-subhead">The new big earners</h3>');
		$ - subheadersTransform($, { articleCrossheads: true });

		$.html().should.equal(
			'<h2 class="article__subhead article__subhead--standard">' +
				'The new big earners' +
			'</h2>'
		);
	});

	it('should create crossheads, if subhead contains a strong tag', function() {
		var $ = cheerio.load('<h3 class="ft-subhead"><strong>The new big earners</strong></h3>');
		$ - subheadersTransform($, { articleCrossheads: true });

		$.html().should.equal(
			'<h2 class="article__subhead article__subhead--crosshead ng-pull-out" id="crosshead-1">' +
				'The new big earners' +
			'</h2>'
		);
	});

});
