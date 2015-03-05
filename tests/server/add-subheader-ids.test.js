/*global it*/
'use strict';

var cheerio = require('cheerio');
var expect = require('chai').expect;
var addSubheaderIds = require('../../server/transforms/add-subheader-ids');

it('should convert the element\'s text to an id', function() {
	var $ = cheerio.load('<h3 class="ft-subhead">Anxiety over the rally<h3>');
	$('.ft-subhead').attr('id', addSubheaderIds);
	expect($('.ft-subhead').attr('id')).to.equal('anxiety-over-the-rally');
});

it('should remove non-alphanumeric characters', function() {
	var $ = cheerio.load('<h3 class="ft-subhead">Anxiety over the rally\'s health<h3>');
	$('.ft-subhead').attr('id', addSubheaderIds);
	expect($('.ft-subhead').attr('id')).to.equal('anxiety-over-the-rallys-health');
});

it('should leading/trailing spaces', function() {
	var $ = cheerio.load('<h3 class="ft-subhead"> Anxiety over the rally <h3>');
	$('.ft-subhead').attr('id', addSubheaderIds);
	expect($('.ft-subhead').attr('id')).to.equal('anxiety-over-the-rally');
});
