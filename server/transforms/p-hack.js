/*jshint laxbreak:true*/
"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	var text = el.html();
	return '<ft-paragraph>' + text + '</ft-paragraph>';
};
