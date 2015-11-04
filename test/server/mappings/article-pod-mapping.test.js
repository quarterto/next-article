/*global describe, it*/

'use strict';

const expect = require('chai').expect;
const subject = require('../../../server/mappings/article-pod-mapping');
const fixture = require('../../fixtures/articlePodMapping/suggestedReadStoryPackageArticle');

describe('Article Pod Mapping', () => {

    let result = subject(fixture);

    it('maps V1 to V3-ish structure', () => {
        expect(result).to.include.keys('id', 'url', 'title', 'subheading', 'primaryTag', 'mainImage');
    });

});
