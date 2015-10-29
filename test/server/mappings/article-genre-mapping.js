/*global describe, it*/
'use strict';

require('chai').should();

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

	it('should return default genere for all others', function() {
		articleGenreMapping(defaultMetadata)
			.should.eql({genre: 'default'});
	});

});
