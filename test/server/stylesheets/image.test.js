/* global describe, it */
'use strict';

var denodeify = require('denodeify');
var libxslt = require('bbc-xslt');
require('chai').should();

function transform(xml) {
	var parsedXml = libxslt.libxmljs.parseXml(xml);
	return denodeify(libxslt.parseFile)(__dirname + '/../../../server/stylesheets/main.xsl')
		.then(function (stylesheet) {
			return stylesheet.apply(parsedXml, { renderSlideshows: 1 }).get('.').toString();
		});
}

describe('Images', function () {

	xit('should move images out of containing <p> if it‘s the only thing in it', function() {
		return transform(
				'<body>' +
					'<p>' +
						'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
					'</p>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"/>' +
					'</body>'
				);
			});
	});

});
