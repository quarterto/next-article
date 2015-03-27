/*global it*/
"use strict";
var cheerio = require('cheerio');
var expect = require('chai').expect;
var pHackTransform = require('../../server/transforms/p-hack');

describe('P Hack', function () {

	it('should turn capi v2 ft-content links into a tags', function() {
		var $ = cheerio.load('<body><p>Text<blockquote>test</blockquote></p><p>Text</p></body>');
		$('p').replaceWith(pHackTransform);
		expect($.html()).to.equal('<body><ft-paragraph>Text<blockquote>test</blockquote></ft-paragraph><ft-paragraph>Text</ft-paragraph></body>');
	});

});
