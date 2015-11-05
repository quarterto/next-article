/*global describe, it*/
'use strict';

//TODO to be deleted when move to n-article-branding

require('chai').should();
var expect = require('chai').expect;

const articleGenreMapping = require('../../../server/mappings/article-genre-mapping');
const columnistMetadata = require('../../fixtures/articleGenreMapping/columnistMetadata');
const brandMetadata = require('../../fixtures/articleGenreMapping/brandMetadata');
const defaultMetadata = require('../../fixtures/articleGenreMapping/defaultMetadata');
const columnistGenre = require('../../fixtures/articleGenreMapping/columnistGenre');
const brandGenre = require('../../fixtures/articleGenreMapping/brandGenre');

describe('Map Article Genre Model', function() {

	it('should recognise a Columnist article', function() {
		articleGenreMapping(columnistMetadata)
			.should.eql(columnistGenre);
	});

	it('should recognise a Brand article', function() {
		articleGenreMapping(brandMetadata)
			.should.eql(brandGenre);
	});

	it('should return null for all others', function() {
		expect(articleGenreMapping(defaultMetadata)).to.be.null;
	});

});
