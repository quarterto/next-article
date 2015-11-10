/*global describe, context, beforeEach, afterEach, it*/

'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const stubs = {
	linksFor: sinon.stub()
};

const subject = proxyquire('../../../server/utils/external-podcast-links', {
	'n-podcast-mapping': stubs
});

describe('External podcast links', () => {

	let url;
	let result;

	afterEach(() => {
		stubs.linksFor.reset();
	});

	context('given a known feed URL', () => {

		beforeEach(() => {
			url = 'http://rss.acast.com/ft-known';

			stubs.linksFor.withArgs('ft-known').returns([
				'https://itunes.apple.com/gb/podcast/id448302257',
				'http://www.stitcher.com/podcast/financial-times/ft-alphachat',
				'http://audioboom.com/channel/ftalphachat'
			]);

			result = subject(url);
		});

		it('returns a map of links', () => {
			expect(result).to.include.keys('itunes', 'stitcher', 'audioboom');
		});

		it('includes the original feed', () => {
			expect(result.rss).to.equal(url);
		});

	});

	context('given an unknown feed URL', () => {

		beforeEach(() => {
			url = 'http://rss.acast.com/ft-unknown';

			stubs.linksFor.withArgs('ft-unknown').returns([]);

			result = subject(url);
		});

		it('returns a map of links', () => {
			expect(result).to.be.an.object;
		});

		it('includes the original feed', () => {
			expect(result.rss).to.equal(url);
		});

	});

});
