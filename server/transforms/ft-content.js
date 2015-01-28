/*jshint laxbreak:true*/
"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	var text = el.html();
	var url = el.attr('url');
	url = url.replace('http://api.ft.com/content/', '/');
	return '<a href="' + url + '">' + text + '</a>';
};
