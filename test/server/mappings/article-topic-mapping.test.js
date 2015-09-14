/*global describe, it*/
"use strict";

var expect = require('chai').expect;

var articleTopicMapping = require('../../../server/mappings/article-topic-mapping');
var metadataHasPrimaryTheme = require('../../fixtures/articleTopicMapping/metadata-has-primary-theme');
var metadataHasPrimarySection = require('../../fixtures/articleTopicMapping/metadata-has-primary-section');
var metadataHasNoPrimaries = require('../../fixtures/articleTopicMapping/metadata-has-no-primaries');


describe('Article Topic Mapping', function() {

	it('should return topic based on Primary Theme if available', function() {
		articleTopicMapping(metadataHasPrimaryTheme).name.should.equal("US presidential election");
	});

	it('should return topic based on Primary Section if no Primary Theme', function() {
		articleTopicMapping(metadataHasPrimarySection).name.should.equal("US Politics & Policy");
	});

	it('should return nothing if no Primary Section or Theme', function() {
		expect(articleTopicMapping(metadataHasNoPrimaries)).to.be.undefined;
	});

	it('should add a url to the topic', function() {
		articleTopicMapping(metadataHasPrimaryTheme).url.should.exist;
	});

});
