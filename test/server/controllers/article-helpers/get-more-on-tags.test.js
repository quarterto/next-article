/*global describe, context, it, beforeEach */

'use strict';

const getMoreOnTags = require('../../../../server/controllers/article-helpers/get-more-on-tags');

const authorTag = {taxonomy: 'authors'};
const brandTag = {taxonomy: 'brand'};
const sectionsTag = {taxonomy: 'sections'};
const genreTag = {taxonomy: 'genre'};
const randomTag = {taxonomy: 'random'};

describe('Getting the tags for More Ons', () => {

  it('should return the first two tags if three provided', () => {
    getMoreOnTags(authorTag, brandTag, sectionsTag).length.should.eql(2);
  });

  it('should only return one if only one is provided', () => {
    getMoreOnTags(undefined, genreTag, undefined).length.should.eql(1);
  });

  context('Getting the right title', () => {

    it('title should be from for authors', () => {
      getMoreOnTags(authorTag)[0].title.should.eql('from');
    });

    it('title should be from for brand', () => {
      getMoreOnTags(brandTag)[0].title.should.eql('from');
    });

    it('title should be in for sections', () => {
      getMoreOnTags(sectionsTag)[0].title.should.eql('in');
    });

    it('title should be blank for genre', () => {
      getMoreOnTags(genreTag)[0].title.should.eql('');
    });

    it('title should be on for anything else', () => {
      getMoreOnTags(randomTag)[0].title.should.eql('on');
    });

  });
});
