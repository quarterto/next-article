/*global describe, it*/

'use strict';

const expect = require('chai').expect;
const _ = require('lodash');
const subject = require('../../../server/mappings/article-pod-mapping-v3');
const fixture = require('../../fixtures/v3-elastic-article-found').docs[0]._source;

describe('Article Pod Mapping V3', () => {

    let result = subject(fixture);

    it('decorates article with extras for pod presentation', () => {
        expect(result).to.include.keys('url', 'subheading', 'primaryTag');
        expect(fixture.summaries).to.contain(result.subheading);
    });

    it('selects the article primary tag', () => {
        expect(result.primaryTag).to.include.keys('url');
        expect(result.primaryTag.primary).to.equal('theme');
    });

    it('decorates the main image with options for n-image component', () => {
        expect(result.mainImage).to.include.keys('srcset', 'alt');
    });

    describe('article with no main image', () => {

        let fixtureNoMainImage = _.clone(fixture);
        fixtureNoMainImage.mainImage = {};
        let resultNoMainImage = subject(fixtureNoMainImage);

        it('does not decorate an empty main image with n-image component options', () => {
            expect(resultNoMainImage.mainImage).to.not.include.keys('srcset', 'alt');
        });

    });
});
