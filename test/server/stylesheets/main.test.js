/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Main', function () {

    it('should not encode special chars', function () {
        return transform(
                '<body>' +
                    '<p>“Is man kind?” she asks. “Are we good?”</p>' +
                    '<p>“Go see — and find out just how kind the he’s and she’s of this mankind are.”</p>' +
                '</body>'
            )
            .then(function (transformedXml) {
                transformedXml.should.equal(
                    '<body>' +
                        '<p>“Is man kind?” she asks. “Are we good?”</p>' +
                        '<p>“Go see — and find out just how kind the he’s and she’s of this mankind are.”</p>' +
                    '</body>\n'
                );
            });
    });

});
