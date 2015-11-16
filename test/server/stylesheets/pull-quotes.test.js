/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Pull Quotes', function () {

	it('should turn capi v2 pull-quotes into n-quotes', function() {
		return transform(
				'<body>' +
					'<pull-quote>' +
						'<pull-quote-text>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</pull-quote-text>' +
						'<pull-quote-source>Dr. Seuss</pull-quote-source>' +
					'</pull-quote>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<blockquote class="ng-inline-element article__quote article__quote--pull-quote">' +
						'<div class="pull-quote__quote-marks"></div>' +
						'<p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p>' +
						'<cite class="article__quote-citation">Dr. Seuss</cite>' +
					'</blockquote>\n'
				);
			});
	});

	it('should not include citation if non available', function() {
		return transform(
				'<body>' +
					'<pull-quote>' +
						'<pull-quote-text>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</pull-quote-text>' +
						'<pull-quote-source></pull-quote-source>' +
					'</pull-quote>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<blockquote class="ng-inline-element article__quote article__quote--pull-quote">' +
						'<div class="pull-quote__quote-marks"></div>' +
						'<p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p>' +
					'</blockquote>\n'
				);
			});
	});

});
