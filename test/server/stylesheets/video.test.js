/* global describe, it */
'use strict';

var denodeify = require('denodeify');
var articleXSLT = require('../../../server/transforms/article-xslt');
require('chai').should();

function transform(xml) {
	return articleXSLT(xml, 'main', { useBrightcovePlayer: 0 });
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
            				'data-n-video-id="4084879507001"></div>' +
					'</body>\n'
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
					'</body>\n'
				);
			});
	});

});
