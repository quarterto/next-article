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
                        '<picture data-image-set-id="ab3c20e8-15fe-11e5-2032-978e959e1689" class="article__image ng-media n-image">' +
                        '<!--[if IE 9]><video style="display: none;"><![endif]-->' +
                        '<source data-image-size="690" media="(min-width: 420px)"></source>' +
                        '<!--[if IE 9]></video><![endif]-->' +
                        '<img data-image-type="src" data-image-size="400" class="n-image__img" alt="">' +
                        '</picture>' +
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
							'<picture data-image-set-id="ab3c20e8-15fe-11e5-2032-978e959e1689" class="article__image ng-inline-element ng-pull-out n-image">' +
								'<!--[if IE 9]><video style="display: none;"><![endif]-->' +
								'<source data-image-size="690" media="(min-width: 420px)"></source>' +
								'<!--[if IE 9]></video><![endif]-->' +
								'<img data-image-type="src" data-image-size="400" class="n-image__img" alt="">' +
							'</picture>' +
                        'Some body text</p>' +
                    '</body>\n'
                );
            });
    });

});
