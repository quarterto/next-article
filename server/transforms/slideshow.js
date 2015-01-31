/*jshint laxbreak:true*/
"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	var uuid = el.attr('href').replace(/.*([a-zA-Z0-9-]{36}).*/, '$1');
	return '<ft-slideshow data-uuid="' + uuid + '"></ft-slideshow>';
};
