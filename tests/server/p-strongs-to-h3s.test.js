/*global describe, it*/
'use strict';

var cheerio = require('cheerio');
require('chai').should();
var pStrongsToH3s = require('../../server/transforms/p-strongs-to-h3s');

describe('P Strong to H3s', function () {

	it('should convert `<p><strong>...</p></strong>` to `<h3>...</h3>`', function() {
		var $body = cheerio.load('<body><p><strong>London in a world of its own</strong></p></body>');

		$body('body > p').replaceWith(pStrongsToH3s);
		$body.html().should.equal('<body><h3 class="ft-subhead">London in a world of its own</h3></body>');
	});

	it('should convert multiple occurrences', function() {
		var $body = cheerio.load('<body><p><strong>London in a world of its own</strong></p><p><strong>Paying a heavy price</strong></p></body>');

		$body('body > p').replaceWith(pStrongsToH3s);
		$body.html().should.equal('<body><h3 class="ft-subhead">London in a world of its own</h3><h3 class="ft-subhead">Paying a heavy price</h3></body>');
	});

	it('should not convert if empty', function() {
		var $body = cheerio.load('<body><p><strong></strong>Paying a heavy price</p></body>');

		$body('body > p').replaceWith(pStrongsToH3s);
		$body.html().should.equal('<body><p><strong></strong>Paying a heavy price</p></body>');
	});

	it('should not convert if not a ‘top level’ p', function() {
		var $body = cheerio.load('<body><blockquote><p><strong>London in a world of its own</strong></p></blockquote></body>');

		$body('body > p').replaceWith(pStrongsToH3s);
		$body.html().should.equal('<body><blockquote><p><strong>London in a world of its own</strong></p></blockquote></body>');
	});

});
