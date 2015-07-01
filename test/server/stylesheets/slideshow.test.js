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

describe('Slideshow', function () {

	it('should understand slideshows', function() {
		return transform(
				'<body>' +
					'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"/>' +
					'</body>'
				);
			});
	});

	it('should only promote links to slideshows if <a> inner text is empty', function() {
		return transform(
				'<body>' +
					'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0">political turmoil</a>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<a data-trackable="link" href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0">political turmoil</a>' +
					'</body>'
				);
			});
	});

	it('should move slideshows out of containing <p> if it‘s the only thing in it', function() {
		return transform(
				'<body>' +
					'<p>' +
						'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>' +
					'</p>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"/>' +
					'</body>'
				);
			});
	});

});
