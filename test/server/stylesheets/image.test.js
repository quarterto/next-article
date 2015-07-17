/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Images', function () {

	it('should move images out of containing <p> if they\'re the only thing in it', function() {
		return transform(
				'<html>' +
					'<body>' +
						'<p>' +
							'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
						'</p>' +
					'</body>' +
				'</html>',
				{
					fullWidthMainImages: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<figure class="article__image-wrapper article__main-image ng-figure-reset ng-media-wrapper">' +
							'<img data-image-set-id="ab3c20e8-15fe-11e5-2032-978e959e1689" class="article__image ng-media" alt="">' +
						'</figure>' +
					'</body>\n'
				);
			});
	});

	it('should move images out of containing <p> if they\'re the only thing in it (ignoring whitespace)', function() {
		return transform(
				'<html>' +
					'<body>' +
						'<p>' +
							'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
						'			</p>' +
					'</body>' +
				'</html>',
				{
					fullWidthMainImages: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<figure class="article__image-wrapper article__main-image ng-figure-reset ng-media-wrapper">' +
							'<img data-image-set-id="ab3c20e8-15fe-11e5-2032-978e959e1689" class="article__image ng-media" alt="">' +
						'</figure>' +
					'</body>\n'
				);
			});
	});

	it('should not move images out of containing <p> if they\'re not the only thing in it', function() {
		return transform(
				'<html>' +
					'<body>' +
						'<p>' +
							'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
						'Some body text</p>' +
					'</body>' +
				'<html>',
				{
					fullWidthMainImages: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<p>' +
							'<img data-image-set-id="ab3c20e8-15fe-11e5-2032-978e959e1689" class="article__image ng-inline-element ng-pull-out" alt="">' +
						'Some body text</p>' +
					'</body>\n'
				);
			});
	});

	it('should handle external images', function () {
		return transform(
				'<html>' +
					'<body>' +
						'<p>test test test</p>' +
						'<p><img src="http://my-image/image.jpg"></img>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
					'</body>' +
				'</html>',
				{
					fullWidthMainImages: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<p>test test test</p>' +
						'<p>' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image ng-inline-element ng-pull-out">' +
							'Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.' +
						'</p>' +
					'</body>\n'
				);
			});
	});

	it('should make images at the beginning of the body full width', function () {
		return transform(
				'<html>' +
					'<body>' +
						'<p><img src="http://my-image/image.jpg"></img></p>' +
						'<p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
					'</body>' +
				'</html>\n',
				{
					fullWidthMainImages: 1
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<figure class="article__image-wrapper article__main-image ng-figure-reset">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image">' +
						'</figure>' +
						'<p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
					'</body>\n'
				);
			});
	});

	it('should not show main image if `fullWidthMainImages` flag is off', function() {
		return transform(
				'<html>' +
					'<body>' +
						'<p>' +
							'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
						'</p>' +
					'</body>' +
				'</html>',
				{
					fullWidthMainImages: 0
				}
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">' +
							'<img data-image-set-id="ab3c20e8-15fe-11e5-2032-978e959e1689" class="article__image" alt="">' +
						'</figure>' +
					'</body>\n'
				);
			});
	});

	it('should encode a ? in an external url', function() {
		return transform(
			'<html>' +
				'<body>' +
					'<p>test test test</p>' +
					'<p><img src="http://markets.ft.com/ChartBuilder?t=indices&p=eYjhj93245"></img>Chart from chart builder.</p>' +
				'</body>' +
			'</html>',
			{
				fullWidthMainImages: 0
			}
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<body>' +
					'<p>test test test</p>' +
					'<p>' +
						'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://markets.ft.com/ChartBuilder%3Ft=indices&amp;p=eYjhj93245?source=next&amp;fit=scale-down&amp;width=710" class="article__image ng-inline-element ng-pull-out">' +
						'Chart from chart builder.' +
					'</p>' +
				'</body>\n'
			);
		});
	});

});
