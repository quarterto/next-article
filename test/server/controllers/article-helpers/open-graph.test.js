/*global describe, context, it, beforeEach */

'use strict';

const expect = require('chai').expect;
const fixtureEsFound = require('../../../fixtures/v3-elastic-article-found').docs[0]._source;
const subject = require('../../../../server/controllers/article-helpers/open-graph');

describe('Open Graph Helper', () => {

	let result;
	let fixtureData;

	beforeEach(() => {
		// Subject modifies the data given to it so always start fresh
		fixtureData = JSON.parse(JSON.stringify(fixtureEsFound));
		result = subject(fixtureData);
	});

	it('provides Open Graph data', () => {
		expect(result.og).to.include.keys('title', 'description', 'url', 'image');
		expect(result.og.image).to.equal(fixtureEsFound.mainImage.url);
		expect(result.og.title).to.equal(fixtureEsFound.title);
	});

	it('provides Twitter card data', () => {
		expect(result.twitterCard).to.include.keys('title', 'description', 'url', 'image', 'card');
		expect(result.twitterCard.image).to.equal(fixtureEsFound.mainImage.url);
		expect(result.twitterCard.title).to.equal(fixtureEsFound.title);
		expect(result.twitterCard.card).to.equal('summary_large_image');
	});

});
