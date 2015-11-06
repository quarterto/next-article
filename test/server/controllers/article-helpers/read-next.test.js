/*global describe, it, before*/

'use strict';

require('chai').should();

const sinon = require('sinon');
const proxyquire = require('proxyquire');

const stubs = {
	content: null,
	search: null
};

const subject = proxyquire('../../../../server/controllers/article-helpers/read-next', {
	'next-ft-api-client': stubs,
	'../../mappings/article-pod-mapping-v3': (article) => article
});

describe('Read next', function() {

	let results;

	describe('Parent has a story package, but Topic article more recent than parent', function() {

		before(function() {
			stubs.content = sinon.stub().returns(
				Promise.resolve({
					id: '9a2b7608-5746-11e5-9846-de406ccb37f2',
					publishedDate: '2015-09-10T17:18:07.000Z'
				})
			);

			stubs.search = sinon.stub().returns(
				Promise.resolve([
					{
						id: '41129eec-5b9d-11e5-a28b-50226830d644',
						publishedDate: '2015-09-16T11:44:13.000Z'
					}
				])
			);

			return subject('', [ '' ], {}, '2015-09-10T18:32:34.000Z')
				.then(result => results = result);
		});

		it('read next should be based on topic as more recent', function() {
			results.id.should.equal('41129eec-5b9d-11e5-a28b-50226830d644');
			results.source.should.equal('topic');
		});

		it('should flag the read next article as more recent than the parent', function() {
			results.should.have.property('moreRecent');
			results.moreRecent.should.be.true;
		});

	});

	describe('Parent has a story package, Topic articles older than parent', function() {

		before(function() {
			stubs.content = sinon.stub().returns(
				Promise.resolve({
					id: 'a581b44e-5acb-11e5-a28b-50226830d644',
					publishedDate: '2015-09-14T14:26:37.000Z'
				})
			);

			stubs.search = sinon.stub().returns(
				Promise.resolve([
					{
						id: '921d8c8e-5c47-11e5-a28b-50226830d644',
						publishedDate: '2015-09-10T09:07:26.000Z'
					}
				])
			);

			return subject('', [ '' ], {}, '2015-09-14T10:35:49.000Z')
				.then(result => results = result);
		});

		it('read next should be based on story package as topic not more recent than parent', function() {
			results.id.should.equal('a581b44e-5acb-11e5-a28b-50226830d644');
			results.source.should.equal('package');
		});

		it('should not flag the read next article as more recent than the parent', function() {
			results.should.not.have.property('moreRecent');
		});

	});

	describe('Parent has no story package, Topic article more recent than parent', function() {

		before(function() {
			stubs.content = sinon.stub();

			stubs.search = sinon.stub().returns(
				Promise.resolve([
					{
						id: 'eaa2adf0-5bb4-11e5-9846-de406ccb37f2',
						publishedDate: '2015-09-16T11:58:53.000Z'
					}
				])
			);

			return subject('', [], {}, '2015-07-13T17:53:12.000Z')
				.then(result => results = result);
		});

		it('read next should be based on topic as no story package', function() {
			results.id.should.equal('eaa2adf0-5bb4-11e5-9846-de406ccb37f2');
			results.source.should.equal('topic');
		});

		it('should flag the read next article as more recent than the parent', function() {
			results.should.have.property('moreRecent');
			results.moreRecent.should.be.true;
		});

	});

	describe('Parent has no story package, Topic articles older than parent', function() {

		before(function() {
			stubs.content = sinon.stub();

			stubs.search = sinon.stub().returns(
				Promise.resolve([
					{
						id: '921d8c8e-5c47-11e5-a28b-50226830d644',
						publishedDate: '2015-09-10T09:07:26.000Z'
					}
				])
			);

			return subject('', [], {}, '2015-09-14T12:27:09.000Z')
				.then(result => results = result);
		});

		it('read next should be based on topic as no story package', function() {
			results.id.should.equal('921d8c8e-5c47-11e5-a28b-50226830d644');
			results.source.should.equal('topic');
		});

		it('should not flag the read next article as more recent than the parent', function() {
			results.should.not.have.property('moreRecent');
		});

	});

});
