/*global describe, it, before*/

'use strict';

require('chai').should();

const sinon = require('sinon');

const proxyquire = require('proxyquire');

const parentArticle1 = require('../../fixtures/readNext/parentArticle1');
const parentArticle2 = require('../../fixtures/readNext/parentArticle2');
const parentArticle3 = require('../../fixtures/readNext/parentArticle3');
const parentArticle4 = require('../../fixtures/readNext/parentArticle4');

const storyPackageId1 = '9a2b7608-5746-11e5-9846-de406ccb37f2';
const storyPackageId2 = 'a581b44e-5acb-11e5-a28b-50226830d644';

const storyPackageArticle1 = require('../../fixtures/readNext/storyPackageArticle1');
const storyPackageArticle2 = require('../../fixtures/readNext/storyPackageArticle2');

const topicArticles1 = require('../../fixtures/readNext/topicArticles1');
const topicArticles2 = require('../../fixtures/readNext/topicArticles2');
const topicArticles3 = require('../../fixtures/readNext/topicArticles3');
const topicArticles4 = require('../../fixtures/readNext/topicArticles4');

const readNextArticle1 = require('../../fixtures/readNext/readNextArticle1');
const readNextArticle2 = require('../../fixtures/readNext/readNextArticle2');
const readNextArticle3 = require('../../fixtures/readNext/readNextArticle3');
const readNextArticle4 = require('../../fixtures/readNext/readNextArticle4');

const topicQuery1 = 'organisationsId:"TnN0ZWluX09OX0ZvcnR1bmVDb21wYW55X0FBUEw=-T04="';
const topicQuery2 = 'topicsId:"NjM3ZTU3MDUtMmY1ZS00ZGExLThkNjYtYWY4YWUzY2U1YWVm-VG9waWNz"';
const topicQuery3 = 'topicsId:"ZmEzMmRmNDAtNDc0Zi00ODk3LWE2ZmQtZWFmYzJlZTRjZTVk-VG9waWNz"';
const topicQuery4 = 'authorsId:"Q0ItMDAwMDg4Ng==-QXV0aG9ycw=="';

const stubs = {
	contentLegacy: null,
	searchLegacy: null
};

const subject = proxyquire('../../../server/lib/read-next', {
	'next-ft-api-client': stubs
});

describe('Suggested Read Model', function() {

	let results;

	describe('Parent has a story package, but Topic article more recent than parent', function() {

		before(function() {
			stubs.contentLegacy = sinon
				.stub()
				.withArgs({
					uuid: storyPackageId1,
					useElasticSearch: true
				})
				.returns(Promise.resolve(storyPackageArticle1));

			stubs.searchLegacy = sinon
				.stub()
				.withArgs({
					query: topicQuery1,
					count: 2,
					fields: true,
					useElasticSearch: true
				})
				.returns(Promise.resolve(topicArticles1));

			return subject(
					parentArticle1.item.package.map(story => story.id),
					parentArticle1.item.id,
					parentArticle1.item.metadata.primaryTheme.term,
					parentArticle1.item.lifecycle.lastPublishDateTime
				)
				.then(result => results = result);
		});

		it('read next should be based on topic as more recent', function() {
			JSON.stringify(results).should.equal(JSON.stringify(readNextArticle1));
			results.source.should.equal('topic');
		});

		it('should flag the read next article as more recent than the parent', function() {
			results.should.have.property('moreRecent');
			results.moreRecent.should.be.true;
		});

	});

	describe('Parent has a story package, Topic articles older than parent', function() {

		before(function() {
			stubs.contentLegacy = sinon
				.stub()
				.withArgs({
					uuid: storyPackageId2,
					useElasticSearch: true
				})
				.returns(Promise.resolve(storyPackageArticle2));

			stubs.searchLegacy = sinon
				.stub()
				.withArgs({
					query: topicQuery2,
					count: 2,
					fields: true,
					useElasticSearch: true
				})
				.returns(Promise.resolve(topicArticles2));

			return subject(
					parentArticle2.item.package.map(story => story.id),
					parentArticle2.item.id,
					parentArticle2.item.metadata.primaryTheme.term,
					parentArticle2.item.lifecycle.lastPublishDateTime
				)
				.then(result => results = result);
		});

		it('read next should be based on story package as topic not more recent than parent', function() {
			JSON.stringify(results).should.equal(JSON.stringify(readNextArticle2));
			results.source.should.equal('package');
		});

		it('should not flag the read next article as more recent than the parent', function() {
			results.should.not.have.property('moreRecent');
		});

	});

	describe('Parent has no story package, Topic article more recent than parent', function() {

		before(function() {
			stubs.contentLegacy = sinon.stub();

			stubs.searchLegacy = sinon
				.stub()
				.withArgs({
					query: topicQuery3,
					count: 2,
					fields: true,
					useElasticSearch: true
				})
				.returns(Promise.resolve(topicArticles3));

			return subject(
					parentArticle3.item.package.map(story => story.id),
					parentArticle3.item.id,
					parentArticle3.item.metadata.primaryTheme.term,
					parentArticle3.item.lifecycle.lastPublishDateTime
				)
				.then(result => results = result);
		});

		it('read next should be based on topic as no story package', function() {
			JSON.stringify(results).should.equal(JSON.stringify(readNextArticle3));
			results.source.should.equal('topic');
		});

		it('should flag the read next article as more recent than the parent', function() {
			results.should.have.property('moreRecent');
			results.moreRecent.should.be.true;
		});

	});

	describe('Parent has no story package, Topic articles older than parent', function() {

		before(function() {
			stubs.contentLegacy = sinon.stub();

			stubs.searchLegacy = sinon
				.stub()
				.withArgs({
					query: topicQuery4,
					count: 2,
					fields: true,
					useElasticSearch: true
				})
				.returns(Promise.resolve(topicArticles4));

			return subject(
					parentArticle4.item.package.map(story => story.id),
					parentArticle4.item.id,
					parentArticle4.item.metadata.primarySection.term,
					parentArticle4.item.lifecycle.lastPublishDateTime
				)
				.then(result => results = result);
		});

		it('read next should be based on topic as no story package', function() {
			JSON.stringify(results).should.equal(JSON.stringify(readNextArticle4));
			results.source.should.equal('topic');
		});

		it('should not flag the read next article as more recent than the parent', function() {
			results.should.not.have.property('moreRecent');
		});

	});

});
