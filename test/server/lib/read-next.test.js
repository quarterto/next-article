/*global describe, it, before*/
'use strict';

var sinon = require('sinon');
require('chai').should();
var rewire = require('rewire');
var readNext = rewire('../../../server/lib/read-next');
var useElasticSearch = true;

var parentArticle1 = require('../../fixtures/readNext/parentArticle1');
var parentArticle2 = require('../../fixtures/readNext/parentArticle2');
var parentArticle3 = require('../../fixtures/readNext/parentArticle3');
var parentArticle4 = require('../../fixtures/readNext/parentArticle4');

var storyPackageId1 = '9a2b7608-5746-11e5-9846-de406ccb37f2';
var storyPackageId2 = 'a581b44e-5acb-11e5-a28b-50226830d644';

var storyPackageArticle1 = require('../../fixtures/readNext/storyPackageArticle1');
var storyPackageArticle2 = require('../../fixtures/readNext/storyPackageArticle2');

var topicArticles1 = require('../../fixtures/readNext/topicArticles1');
var topicArticles2 = require('../../fixtures/readNext/topicArticles2');
var topicArticles3 = require('../../fixtures/readNext/topicArticles3');
var topicArticles4 = require('../../fixtures/readNext/topicArticles4');

var readNextArticle1 = require('../../fixtures/readNext/readNextArticle1');
var readNextArticle2 = require('../../fixtures/readNext/readNextArticle2');
var readNextArticle3 = require('../../fixtures/readNext/readNextArticle3');
var readNextArticle4 = require('../../fixtures/readNext/readNextArticle4');

var topicQuery1 = 'organisationsId:"TnN0ZWluX09OX0ZvcnR1bmVDb21wYW55X0FBUEw=-T04="';
var topicQuery2 = 'topicsId:"NjM3ZTU3MDUtMmY1ZS00ZGExLThkNjYtYWY4YWUzY2U1YWVm-VG9waWNz"';
var topicQuery3 = 'topicsId:"ZmEzMmRmNDAtNDc0Zi00ODk3LWE2ZmQtZWFmYzJlZTRjZTVk-VG9waWNz"';
var topicQuery4 = 'authorsId:"Q0ItMDAwMDg4Ng==-QXV0aG9ycw=="';

describe('Suggested Read Model', function() {

	var stubContentLegacy, stubSearchLegacy, api, results;

	before(function() {
		api = readNext.__get__('api');
		stubContentLegacy = sinon.stub(api, "contentLegacy");
		stubSearchLegacy = sinon.stub(api, "searchLegacy");
	});

	describe('Parent has a story package, but Topic article more recent than parent', function() {

		before(function() {
			stubContentLegacy.withArgs({
				uuid: storyPackageId1,
				useElasticSearch: true,
				useElasticSearchOnAws: false
			}).returns(Promise.resolve(storyPackageArticle1));
			stubSearchLegacy.withArgs({
				query: topicQuery1,
				count: 2,
				fields: true,
				useElasticSearch: true
			}).returns(Promise.resolve(topicArticles1));

			return readNext(parentArticle1, useElasticSearch, false)
				.then(function(result) {
					results = result;
				});
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
			stubContentLegacy.withArgs({
				uuid: storyPackageId2,
				useElasticSearch: true,
				useElasticSearchOnAws: false
			}).returns(Promise.resolve(storyPackageArticle2));
			stubSearchLegacy.withArgs({
				query: topicQuery2,
				count: 2,
				fields: true,
				useElasticSearch: true
			}).returns(Promise.resolve(topicArticles2));

			return readNext(parentArticle2, useElasticSearch, false)
				.then(function(result) {
					results = result;
				});
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
			stubSearchLegacy.withArgs({
				query: topicQuery3,
				count: 2,
				fields: true,
				useElasticSearch: true
			}).returns(Promise.resolve(topicArticles3));

			return readNext(parentArticle3, useElasticSearch, false)
				.then(function(result) {
					results = result;
				});
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
			stubSearchLegacy.withArgs({
				query: topicQuery4,
				count: 2,
				fields: true,
				useElasticSearch: true
			}).returns(Promise.resolve(topicArticles4));

			return readNext(parentArticle4, useElasticSearch, false)
				.then(function(result) {
					results = result;
				});
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
