/*global it*/
'use strict';

var expect = require('chai').expect;
var pStrongsToH3s = require('../../server/transforms/p-strongs-to-h3s');

describe('P Strong to H3s', function () {

	it('should convert `<p><strong>...</p></strong>` to `<h3>...</h3>`', function() {
		var transformed = pStrongsToH3s('<p><strong>London in a world of its own</strong></p>');
		expect(transformed).to.equal('<h3 class="ft-subhead">London in a world of its own</h3>');
	});

	it('should convert multiple occurrences', function() {
		var transformed = pStrongsToH3s('<p><strong>London in a world of its own</strong></p><p><strong>Paying a heavy price</strong></p>');
		expect(transformed).to.equal('<h3 class="ft-subhead">London in a world of its own</h3><h3 class="ft-subhead">Paying a heavy price</h3>');
	});

	it('should not convert if empty', function() {
		var transformed = pStrongsToH3s('<p><strong></strong>Paying a heavy price</p>');
		expect(transformed).to.equal('<p><strong></strong>Paying a heavy price</p>');
	});

});
