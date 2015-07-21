/*global describe, it*/
'use strict';

var cheerio = require('cheerio');
var externalImagesTransform = require('../../../server/transforms/external-images');
require('chai').should();

describe('External Images', function() {

  it('should decode %20 in src of external image urls back to spaces', function() {
    var $ = cheerio.load(
      '<body>' +
        '<p>test test test</p>' +
        '<figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">' +
        '<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://clamo.ftdata.co.uk/files/2015-07/21/FT%20Dow%20Stock%20Moves%20IBM%20UTX%207-21-15.png?source=next&fit=scale-down&width=710">' +
        '</figure>' +
      '</body>');
    $ = externalImagesTransform($);
		$.html().should.equal(
      '<body>' +
        '<p>test test test</p>' +
        '<figure class="article__image-wrapper article__inline-image ng-figure-reset ng-inline-element ng-pull-out">' +
        '<img alt="" src="https://next-geebee.ft.com/image/v1/images/raw/http://clamo.ftdata.co.uk/files/2015-07/21/FT Dow Stock Moves IBM UTX 7-21-15.png?source=next&amp;fit=scale-down&amp;width=710">' +
        '</figure>' +
      '</body>');
  	});

});
