/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

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

	it('should push external images through the image service', function () {
		return transform(
				'<body>' +
					'<p>test test test</p>' +
					'<p><img src="http://my-image/image.jpg"></img>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<p>test test test</p>' +
						'<p>' +
							'<img src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image" alt=""/>' +
							'Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.' +
						'</p>' +
					'</body>'
				);
			});
	});

	it('should make images at the beginning of the body full width', function () {
		return transform(
				'<body>' +
					'<p><img src="http://my-image/image.jpg"></img></p>' +
					'<p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
				'</body>'
			)
			.then(function (transformedXml) {
				transformedXml.should.equal(
					'<body>' +
						'<figure class="article__image-wrapper ng-figure-reset article__main-image">' +
							'<img src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image" alt=""/>' +
						'</figure>' +
						'<p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
					'</body>'
				);
			});
	});

});
