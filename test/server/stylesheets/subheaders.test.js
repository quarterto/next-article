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

describe('Subheaders', function () {

	it('should create subheaders', function () {
		return transform(
				'<body>' +
					'<h3 class="ft-subhead">The new big earners</h3>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<h2 class="article__subhead article__subhead--standard">' +
							'The new big earners' +
						'</h2>' +
					'</body>'
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
					'<body>' +
						'<h2 id="crosshead-1" class="article__subhead article__subhead--crosshead ng-pull-out">' +
							'The new big earners' +
						'</h2>' +
					'</body>'
				);
			});
	});

});
