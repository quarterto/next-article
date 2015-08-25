/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Slideshow', function () {

	it('should understand slideshows', function() {
		return transform(
				'<body>' +
					'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>' +
				'</body>',
				{
					renderSlideshows: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"></ft-slideshow>' +
					'</body>\n'
				);
			});
	});

	it('should only promote links to slideshows if <a> inner text is empty', function() {
		return transform(
				'<body>' +
					'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0">political turmoil</a>' +
				'</body>',
				{
					renderSlideshows: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0" data-trackable="link" class="article__body__link">political turmoil</a>' +
					'</body>\n'
				);
			});
	});

	it('should move slideshows out of containing <p> if it‘s the only thing in it', function() {
		return transform(
				'<body>' +
					'<p>' +
						'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>' +
					'</p>' +
				'</body>',
				{
					renderSlideshows: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"></ft-slideshow>' +
					'</body>\n'
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
				'</body>',
				{
					renderSlideshows: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"></ft-slideshow>' +
						'<p>Some text in the same p tag as the slideshow</p>' +
					'</body>\n'
				);
			});
	});

	it('should retain any <strong> tags in the text in the same <p> tag as the slideshow in a separate <p>', function() {
		return transform(
				'<body>' +
					'<p>' +
						'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>' +
						'Some <strong>strong</strong> text' +
					'</p>' +
				'</body>',
				{
					renderSlideshows: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"></ft-slideshow>' +
						'<p>Some <strong>strong</strong> text</p>' +
					'</body>\n'
				);
			});
	});

	it('should retain any <a> tags in the text in the same <p> tag as the slideshow in a separate <p>', function() {
		return transform(
				'<body>' +
					'<p>' +
						'<a href="http://www.ft.com/cms/s/0/f3970f88-0475-11df-8603-00144feabdc0.html#slide0"></a>' +
						'Another <a href="/home">link</a> within the text' +
					'</p>' +
				'</body>',
				{
					renderSlideshows: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<ft-slideshow data-uuid="f3970f88-0475-11df-8603-00144feabdc0"></ft-slideshow>' +
						'<p>Another <a href="/home">link</a> within the text</p>' +
					'</body>\n'
				);
			});
	});

});
