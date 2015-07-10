/* global describe, it */
'use strict';

var denodeify = require('denodeify');
var articleXSLT = require('../../../server/transforms/article-xslt');
require('chai').should();

function transform(xml) {
	return articleXSLT(xml, 'main');
}

describe('Blockquotes', function () {

	it('should add classes to blockquotes', function () {
		return transform(
				'<body>' +
					'<blockquote>' +
						'<p>Chart 13 plots a set of cumulative probabilities of official interest rates exceeding a set of interest rate thresholds – 2%</p>' +
					'</blockquote>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<blockquote class="article__block-quote n-quote">' +
							'<p>Chart 13 plots a set of cumulative probabilities of official interest rates exceeding a set of interest rate thresholds – 2%</p>' +
						'</blockquote>' +
					'</body>\n'
				);
			});
	});

});
