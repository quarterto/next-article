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

describe('Pull Quotes', function () {

	it('should turn capi v2 pull-quotes into o-quotes', function() {
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
					'<body>' +
						'<blockquote class="article__pull-quote ng-pull-out o-quote o-quote--standard">' +
							'<p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p>' +
							'<cite class="o-quote__cite">Dr. Seuss</cite>' +
						'</blockquote>' +
					'</body>'
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
					'<body>' +
						'<blockquote class="article__pull-quote ng-pull-out o-quote o-quote--standard">' +
							'<p>Think left and think right and think low and think high. Oh, the thinks you can think up if only you try!</p>' +
						'</blockquote>' +
					'</body>'
				);
			});
	});

});
