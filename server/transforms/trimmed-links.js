/*jshint laxbreak:true*/
"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	var trailingReg = /([ ,.;:] ?)$/;
	var trailing = '';
	var leadingReg = /^([ ,.;:] ?)/;
	var leading = '';
	var matches;
	var contents = el.html().replace("\n", " ");
	matches = trailingReg.exec(contents);
	if (matches) {
		contents = contents.replace(trailingReg, '');
		trailing = matches[0];
	}
	matches = leadingReg.exec(contents);
	if (matches) {
		contents = contents.replace(leadingReg, '');
		leading = matches[0];
	}
	el.html(contents);
	return (leading + $.html(el) + trailing);
};
