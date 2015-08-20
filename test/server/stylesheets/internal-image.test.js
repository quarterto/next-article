/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Internal images', function () {

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

});
