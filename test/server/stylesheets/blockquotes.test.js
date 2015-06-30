/* global describe, it */
'use strict';

var denodeify = require('denodeify');
var libxslt = require('bbc-xslt');
require('chai').should();

function transform(xml) {
	var parsedXml = libxslt.libxmljs.parseXml(xml);
	return denodeify(libxslt.parseFile)(__dirname + '/../../../server/stylesheets/main.xsl')
		.then(function (stylesheet) {
			return stylesheet.apply(parsedXml).get('.').toString();
		});
}

describe.only('Blockquotes', function () {

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
						'<blockquote class="article__block-quote o-quote o-quote--standard">' +
							'<p>Chart 13 plots a set of cumulative probabilities of official interest rates exceeding a set of interest rate thresholds – 2%</p>' +
						'</blockquote>' +
					'</body>'
				);
			});
	});

});
