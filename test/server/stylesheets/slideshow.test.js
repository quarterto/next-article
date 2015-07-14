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

	it('should retain any text in the same <p> tag as the slideshow in a separate <p>', function() {
		return transform(
				'<body>' +
					'<p>' +
						'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>' +
						'Some text in the same p tag as the slideshow' +
					'</p>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"/>' +
						'<p>Some text in the same p tag as the slideshow</p>' +
					'</body>'
				);
			});
	});

	it('should retain any <strong> tags in the text in the same <p> tag as the slideshow in a separate <p>', function() {
		return transform(
			'<body>' +
	      '<p>' +
	        '<a href="http://www.zz.com/abc/z/0/z3970z88-0475-11dz-8603-00144zeabdc1.html#slide0"></a>' +
	        'Some <strong>strong</strong> text' +
	      '</p>' +
	    '</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"/>' +
						'<p>Some <strong>strong</strong> text</p>' +
					'</body>'
				);
			});
	});

	it('should retain any <a> tags in the text in the same <p> tag as the slideshow in a separate <p>', function() {
		return transform(
			'<body>' +
	      '<p>' +
	        '<a href="http://www.zz.com/abc/z/0/z3970z88-0475-11dz-8603-00144zeabdc1.html#slide0"></a>' +
	        'Another <a href="/home">link</a> within the text' +
	      '</p>' +
	    '</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"/>' +
						'<p>Another <a href="/home">link</a> within the text' +
					'</body>'
				);
			});
	});

});
