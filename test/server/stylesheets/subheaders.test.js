/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Subheaders', function () {

	it('should create subheaders', function () {
		return transform(
				'<body>' +
					'<h3 class="ft-subhead">The new big earners</h3>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<h2 class="article__subhead article__subhead--standard">' +
						'The new big earners' +
					'</h2>\n'
				);
			});
	});

	it('should create crossheads, if subhead contains a strong tag', function () {
		return transform(
				'<body>' +
					'<h3 class="ft-subhead"><strong>The new big earners</strong></h3>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<h2 id="crosshead-1" class="article__subhead article__subhead--crosshead">' +
						'The new big earners' +
					'</h2>\n'
				);
			});
	});

});
