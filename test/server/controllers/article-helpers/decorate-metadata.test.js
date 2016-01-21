/*global describe, context, it, beforeEach */

'use strict';

const expect = require('chai').expect;
const fixtureEsFound = require('../../../fixtures/v3-elastic-article-found').docs[0]._source;
const subject = require('../../../../server/controllers/article-helpers/decorate-metadata');

describe('Metadata', () => {

	let result;
	let fixtureData;

	context('for an article with a primary theme and primary section', () => {

		beforeEach(() => {
			// Subject modifies the data given to it so always start fresh
			fixtureData = JSON.parse(JSON.stringify(fixtureEsFound));
			result = subject(fixtureData);
		});

		it('fills the metadata with CAPI V1 compatible properties', () => {
			result.metadata.forEach(
				tag => expect(tag).to.include.keys('id', 'name', 'taxonomy', 'url')
			);
		});

		it('decorates the given article with primary theme, section and brand', () => {
			expect(result.primaryTheme.prefLabel).to.equal('Cyber Security');
			expect(result.primarySection.prefLabel).to.equal('Banks');
			expect(result.primaryBrand.prefLabel).to.equal('Lex');
		});

		it('selects the primary tag with themes taking precendence over sections', () => {
			expect(result.primaryTag.prefLabel).to.equal('Cyber Security');
		});

		it('selects tags for display', () => {
			result.tags.forEach(tag => {
				expect(tag.id).not.to.equal(result.primaryTag.id);
				expect([ 'iptc', 'icb' ]).not.to.contain(tag.taxonomy);
			});
		});

	});

	context('for an article with a primary section that takes precedence over primary theme', () => {

		beforeEach(() => {
			// Subject modifies the data given to it so always start fresh
			fixtureData = JSON.parse(JSON.stringify(fixtureEsFound));

			fixtureData.metadata.unshift({
				prefLabel: 'My super important tag',
				taxonomy: 'specialReports',
				primary: 'section',
				id: '123'
			});

			result = subject(fixtureData);
		});

		it('selects the primary section as the primary tag', () => {
			expect(result.primaryTag.prefLabel).to.equal('My super important tag');
		});

	});

	context('when passed a query string with a topic to follow', () => {
	
		beforeEach(() => {
			// Subject modifies the data given to it so always start fresh
			fixtureData = JSON.parse(JSON.stringify(fixtureEsFound));

			fixtureData.tagToFollow = 'Q0ItMDAwMDcyMw==-QXV0aG9ycw==';

			result = subject(fixtureData);
		});

		it('selects the primary section as the primary tag', () => {
			expect(result.tagToFollow.prefLabel).to.equal('Martin Arnold');
		});
	});

});
