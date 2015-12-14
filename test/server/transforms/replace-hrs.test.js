/*global describe, it*/
"use strict";

const replaceHrsTransform = require('../../../server/transforms/replace-hrs');

describe('Replace hrs', () => {

  it('should replace <p>---</p> with an <hr> element', () => {
    replaceHrsTransform('<p>---</p>').should.equal('<hr />');
  });

  it('should replace multiple <p>---</p> with <hr> elememnts', () => {
    const body = '<p>Some text</p><p>---</p><p>Some more text</p><p>---</p><p>The end</p>';
    const result = '<p>Some text</p><hr /><p>Some more text</p><hr /><p>The end</p>'
    replaceHrsTransform(body).should.equal(result);
  });

});
