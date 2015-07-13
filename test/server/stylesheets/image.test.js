/* global describe, it */
'use strict';

var articleXSLT = require('../../../server/transforms/article-xslt');
require('chai').should();

function transform(xml) {
	return articleXSLT(xml, 'main', { renderSlideshows: 1 });
}

describe('Images', function () {

	it('should move images out of containing <p> if they\'re the only thing in it', function() {
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
						'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
					'</body>\n'
				);
			});
	});

	it('should move images out of containing <p> if they\'re the only thing in it (ignoring whitespace)', function() {
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
						'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
					'</body>\n'
				);
			});
	});

	it('should not move images out of containing <p> if they\'re not the only thing in it', function() {
		return transform(
				'<body>' +
					'<p>' +
						'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
					'Some body text</p>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<p>' +
							'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
						'Some body text</p>' +
					'</body>\n'
				);
			});
	});

});
