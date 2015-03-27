/*global it*/
'use strict';

var cheerio = require('cheerio');
var expect = require('chai').expect;
var addSubheaderIds = require('../../server/transforms/add-subheader-ids');

describe('Add Subheader ID', function () {

	it('should create incremented subhead id', function() {
		var $ = cheerio.load('<h3 class="ft-subhead">Anxiety over the rally</h3><h3 class="ft-subhead">What are the perks?</h3>');
		$('.ft-subhead').attr('id', addSubheaderIds);
		expect($.html()).to.equal('<h3 class="ft-subhead" id="subhead-1">Anxiety over the rally</h3><h3 class="ft-subhead" id="subhead-2">What are the perks?</h3>');
	});

});
