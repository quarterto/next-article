/*global describe, it*/
'use strict';

require('chai').should();

var articlePodMapping = require('../../../server/mappings/article-pod-mapping');
var suggestedReadStoryPackageArticle = require('../../fixtures/articlePodMapping/suggestedReadStoryPackageArticle');
var articlePodMappingStoryPackage = require('../../fixtures/articlePodMapping/articlePodMappingStoryPackage');

describe('Map Article Pod Model', function() {

	it('should create an array of articles with necessary data from elastic search results', function() {
		articlePodMapping(suggestedReadStoryPackageArticle)
			.should.eql(articlePodMappingStoryPackage);
	});

});
