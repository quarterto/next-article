/* global describe, it */

'use strict';

const transform = require('./transform-helper');
const expect = require('chai').expect;

describe('External images', function() {

    it('moves images out of containing <p> if they\'re the only thing in it', function() {
        return transform(
                '<html>' +
                    '<body>' +
                        '<p>' +
                            '<img src="http://my-image/image.jpg">' +
                        '</p>' +
                    '</body>' +
                '</html>',
                {
                    fullWidthMainImages: 1
                }
            )
            .then(function(transformedXml) {
                expect(transformedXml).to.equal(
                    '<body>' +
                        '<figure class="article__image-wrapper article__main-image ng-figure-reset">' +
                            '<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image">' +
                        '</figure>' +
                    '</body>\n'
                );
            });
    });

    it('does not move images out of containing <p> if they\'re not the only thing in it', function() {
        return transform(
                '<html>' +
                    '<body>' +
                        '<p>' +
                            '<img src="http://my-image/image.jpg">' +
                            'Some body text' +
                        '</p>' +
                    '</body>' +
                '<html>',
                {
                    fullWidthMainImages: 1
                }
            )
            .then(function(transformedXml) {
                expect(transformedXml).to.equal(
                    '<body>' +
                        '<p>' +
                            '<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image ng-inline-element ng-pull-out">' +
                            'Some body text' +
                        '</p>' +
                    '</body>\n'
                );
            });
    });

	it('makes images at the beginning of the body full width', function() {
		return transform(
				'<html>' +
					'<body>' +
						'<p><img src="http://my-image/image.jpg"></p>' +
						'<p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
					'</body>' +
				'</html>\n',
				{
					fullWidthMainImages: 1
				}
			)
			.then(function(transformedXml) {
				expect(transformedXml).to.equal(
					'<body>' +
						'<figure class="article__image-wrapper article__main-image ng-figure-reset">' +
							'<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image">' +
						'</figure>' +
						'<p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
					'</body>\n'
				);
			});
	});

    it('adds caption when the longdesc attribute is present', function() {
        return transform(
                '<html>' +
                    '<body>' +
                        '<p><img src="http://my-image/image.jpg" longdesc="This is a long description"></p>' +
                        '<p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
                    '</body>' +
                '</html>\n',
                {
                    fullWidthMainImages: 1
                }
            )
            .then(function(transformedXml) {
                expect(transformedXml).to.equal(
                    '<body>' +
                        '<figure class="article__image-wrapper article__main-image ng-figure-reset">' +
                            '<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image">' +
                            '<figcaption class="article__image-caption ng-meta">This is a long description</figcaption>' +
                        '</figure>' +
                        '<p>Mr Dougan has been blamed by some leading shareholders for failing to grasp the extent of the change in the aftermath of the financial crisis.</p>' +
                    '</body>\n'
                );
            });
    });

});
