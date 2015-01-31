/*jshint laxbreak:true*/
"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	el.attr('href', el.attr('href').replace(/https?:\/\/(?:www\.)?ft\.com\/topics/, '/stream'));
	el.attr('href', el.attr('href').replace(/https?:\/\/(?:www\.)?ft\.com\/cms(?:\/s\/[0-9])?\/([a-zA-Z0-9-]+)\.html/, '/$1'));
	if (/^\/stream\//.test(el.attr('href'))) {
		el.attr('href', el.attr('href').replace(/_/g, ' '));
	}
	return el.clone();
};
