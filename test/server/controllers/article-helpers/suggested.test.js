/*global describe, it, before*/

'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');

const stubs = {
	content: sinon.stub(),
	search: sinon.stub()
};

const subject = proxyquire('../../../../server/controllers/article-helpers/suggested', {
	'next-ft-api-client': stubs,
	'../../mappings/article-pod-mapping-v3': (article) => article
});

describe('Suggested reads', () => {

	let articleId = 'a581b44e-5acb-11e5-a28b-50226830d644';

	afterEach(() => {
		stubs.content.reset();
		stubs.search.reset();
	});

	describe('Parent has a story package', () => {

		let storyPackageIds = [
			'aff90924-5a01-11e5-9846-de406ccb37f2',
			'3186f3dc-5310-11e5-b029-b9d50a74fd14',
			'8dfcd43e-507b-11e5-b029-b9d50a74fd14',
			'e9b56844-4ece-11e5-b029-b9d50a74fd14',
			'066a5068-4d98-11e5-b558-8a9722977189'
		];

		beforeEach(() => subject(articleId, storyPackageIds, {}));

		it('doesn\'t attempt to fetch related articles by tag', () => {
			expect(stubs.search.called).to.be.false;
		});

		it('fetches articles for package of IDs', () => {
			let args = stubs.content.lastCall.args[0];
			expect(args.uuid.length).to.equal(5);
		});

	});

	describe('Parent has a story package but too small to populate suggested reads', () => {

		let storyPackageIds = [
			'aff90924-5a01-11e5-9846-de406ccb37f2',
			'3186f3dc-5310-11e5-b029-b9d50a74fd14',
			'8dfcd43e-507b-11e5-b029-b9d50a74fd14'
		];

		let searchResultIds = [
			'e9b56844-4ece-11e5-b029-b9d50a74fd14',
			'066a5068-4d98-11e5-b558-8a9722977189',
			'056f937a-8471-11e5-8095-ed1a37d1e096',
			'aebefd16-83a5-11e5-8095-ed1a37d1e096',
			storyPackageIds[0],
			articleId
		];

		beforeEach(() => {
			stubs.search.returns(
				Promise.resolve(searchResultIds.map(article => {
					return { id: article };
				}))
			);

			return subject(articleId, storyPackageIds, {});
		});

		it('attempts to fetch related articles by tag', () => {
			expect(stubs.search.called).to.be.true;
		});

		it('de-dupes and concatenates search results with package', () => {
			let args = stubs.content.lastCall.args[0];
			expect(args.uuid).not.to.contain(articleId);
			expect(args.uuid.filter(id => id === storyPackageIds[0]).length).to.equal(1);
		});

		it('fetches articles for package of IDs', () => {
			let args = stubs.content.lastCall.args[0];
			expect(args.uuid.length).to.equal(5);
		});

	});

	describe('Parent has no story package', () => {

		let searchResultIds = [
			'aff90924-5a01-11e5-9846-de406ccb37f2',
			'3186f3dc-5310-11e5-b029-b9d50a74fd14',
			'8dfcd43e-507b-11e5-b029-b9d50a74fd14',
			'e9b56844-4ece-11e5-b029-b9d50a74fd14',
			'066a5068-4d98-11e5-b558-8a9722977189',
			'056f937a-8471-11e5-8095-ed1a37d1e096',
			'aebefd16-83a5-11e5-8095-ed1a37d1e096',
			articleId
		];

		beforeEach(() => {
			stubs.search.returns(
				Promise.resolve(searchResultIds.map(article => {
					return { id: article };
				}))
			);

			return subject(articleId, [], {});
		});

		it('attempts to fetch related articles by tag', () => {
			expect(stubs.search.called).to.be.true;
		});

		it('de-dupes search results', () => {
			let args = stubs.content.lastCall.args[0];
			expect(args.uuid).not.to.contain(articleId);
		});

		it('fetches articles for package of IDs', () => {
			let args = stubs.content.lastCall.args[0];
			expect(args.uuid.length).to.equal(5);
		});

	});

});
