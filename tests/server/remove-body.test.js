/*global it*/
'use strict';

var cheerio = require('cheerio');
var expect = require('chai').expect;
var removeBody = require('../../server/transforms/remove-body');

it('should remove potential wrapped body element', function() {
	var $ = cheerio.load('<body><h1>Anxiety over the rally</h1><p>The Obama administration accused the UK of</p></body>');
	$('body').replaceWith(removeBody);
	expect($.html()).to.equal('<h1>Anxiety over the rally</h1><p>The Obama administration accused the UK of</p>');
});
