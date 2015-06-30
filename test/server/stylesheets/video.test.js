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

describe('Video', function () {

	it('should transform videos', function() {
		return transform(
				'<body>' +
					'<a data-asset-type="video" data-embedded="true" href="http://video.ft.com/4084879507001"></a>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<div class="article__video-wrapper ng-media-wrapper" ' +
            				'data-n-component="n-video" ' +
            				'data-n-video-source="brightcove" ' +
            				'data-n-video-id="4084879507001"/>' +
					'</body>'
				);
			});
	});

	it('should not transform if link is not empty', function() {
		return transform(
				'<body>' +
					'<a href="http://video.ft.com/4080875696001/A-FTSE-landmark-that-matters/Markets" title="A FTSE landmark that matters - FT.com">' +
						'FTSE-All World index setting a record' +
					'</a>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<a data-trackable="link" href="http://video.ft.com/4080875696001/A-FTSE-landmark-that-matters/Markets" title="A FTSE landmark that matters - FT.com">' +
							'FTSE-All World index setting a record' +
						'</a>' +
					'</body>'
				);
			});
	});

});
