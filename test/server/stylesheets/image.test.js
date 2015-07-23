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
					fullWidthMainImages: 1,
					reserveSpaceForMasterImage: 1
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
					fullWidthMainImages: 1,
					reserveSpaceForMasterImage: 1
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
					fullWidthMainImages: 1,
					reserveSpaceForMasterImage: 1
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
					fullWidthMainImages: 1,
					reserveSpaceForMasterImage: 1
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
					fullWidthMainImages: 1,
					reserveSpaceForMasterImage: 1
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

	it('should not add ng-inline-element or ng-pull-out to an image who\'s immediate parent is not a p tag, eg. promo-box or table', function() {
		return transform(
			'<html>' +
				'<body>' +
					'<promo-box>' +
						'<promo-image>' +
							'<ft-content type="http://www.ft.com/ontology/content/ImageSet" url="http://api.ft.com/content/ab3c20e8-15fe-11e5-2032-978e959e1689" data-embedded="true"></ft-content>' +
						'</promo-image>' +
					'</promo-box>' +
				'</body>' +
			'</html>',
			{
				fullWidthMainImages: 0,
				reserveSpaceForMasterImage: 1
			}
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<body>' +
					'<promo-box>' +
						'<promo-image>' +
							'<img data-image-set-id="ab3c20e8-15fe-11e5-2032-978e959e1689" class="article__image" alt="">' +
						'</promo-image>' +
					'</promo-box>' +
				'</body>\n'
			);
		});
	});

	it('should not add ng-inline-element or ng-pull-out to an external image which is in a <a> at the start of an article, eg photo diary', function() {
		return transform(
			'<html>' +
				'<body>' +
					'<a href="http://blogs.ft.com/photo-diary/files/2015/07/seal.jpg">' +
						'<img alt="A seal cools off at Belgrade Zoo during a heatwave on Tuesday. In Serbia where the meteoalarm has been raised to \'red\', extremely hot weather with temperatures up to 39 degrees Celsius is expected to continue over the next several days" height="1364" src="http://blogs.ft.com/photo-diary/files/2015/07/seal.jpg" width="2048"/>' +
					'</a>' +
					'<p>A seal cools off at Belgrade Zoo during a heatwave on Tuesday. In Serbia where the meteoalarm has been raised to ‘red’, extremely hot weather with temperatures up to 39 degrees Celsius</p>' +
					'</body>' +
			'</html>',
			{
				fullWidthMainImages: 0,
				reserveSpaceForMasterImage: 1
			}
		)
		.then(function (transformedXml) {
			transformedXml.should.equal(
				'<body>' +
					'<a data-trackable="link" href="http://blogs.ft.com/photo-diary/files/2015/07/seal.jpg">' +
						'<figure class="article__image-wrapper article__main-image ng-figure-reset">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://blogs.ft.com/photo-diary/files/2015/07/seal.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image">' +
						'</figure>' +
					'</a>' +
					'<p>A seal cools off at Belgrade Zoo during a heatwave on Tuesday. In Serbia where the meteoalarm has been raised to ‘red’, extremely hot weather with temperatures up to 39 degrees Celsius</p>' +
				'</body>\n'
			);
		});
	});

});
