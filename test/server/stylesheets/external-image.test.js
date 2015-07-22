/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('External images', function () {

    it('should move images out of containing <p> if they\'re the only thing in it', function() {
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
            .then(function (transformedXml) {
                transformedXml.should.equal(
                    '<body>' +
                        '<figure class="article__image-wrapper article__main-image ng-figure-reset">' +
                            '<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image">' +
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
                            '<img src="http://my-image/image.jpg">' +
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
                            '<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://my-image/image.jpg?source=next&amp;fit=scale-down&amp;width=710" class="article__image ng-inline-element ng-pull-out">' +
                        'Some body text</p>' +
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
