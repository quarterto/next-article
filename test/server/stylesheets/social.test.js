/* global describe, it */
'use strict';

var transform = require('./transform-helper');
require('chai').should();

describe('Social', function () {

	it('should add share buttons above first paragraph', function () {
		return transform(
      '<body>' +
        '<p>This is the first paragraph</p>' +
        '<p>This is the second paragraph</p>' +
      '</body>',
      {
        renderSocial: 1
      }
    ).then(function(transformedXml) {
      transformedXml.indexOf('article__share').should.be.below(transformedXml.indexOf('first paragraph'));
    	transformedXml.should.include('<a target="_blank" href="https://twitter.com/intent/tweet?url=https://next.ft.com/content/article-uuid&amp;text=Article%20Title&amp;via=FT" data-trackable="twitter">');
    	transformedXml.should.include('data-shared-url="http://www.ft.com/article-uuid"');
    });
	});

});
