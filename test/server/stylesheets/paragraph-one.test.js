/* global describe, it */
"use strict";

var transform = require('./transform-helper');
require('chai').should();

describe('Paragraph One', function() {

  it('should have the standfirst before the first paragraph if suggested read is on', function() {
    return transform(
      '<body>' +
        '<p>This is the first paragraph</p>' +
        '<p>This is the second paragraph</p>' +
      '</body>',
      {
        suggestedRead: 1,
        standFirst: "This is an example standfirst"
      }
    ).then(function(transformedXml) {
      transformedXml.should.equal(
        '<body>' +
          '<p class="article__standfirst">This is an example standfirst</p>' +
          '<p>This is the first paragraph</p>' +
          '<p>This is the second paragraph</p>' +
        '</body>\n'
      );
    });
  });

  it('should not have the standfirst before the first paragraph if suggested read is off', function() {
    return transform(
      '<body>' +
        '<p>This is the first paragraph</p>' +
        '<p>This is the second paragraph</p>' +
      '</body>',
      {
        suggestedRead: 0,
        standFirst: "This is an example standfirst"
      }
    ).then(function(transformedXml) {
      transformedXml.should.equal(
        '<body>' +
          '<p>This is the first paragraph</p>' +
          '<p>This is the second paragraph</p>' +
        '</body>\n'
      );
    });
  });

});
