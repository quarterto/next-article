"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	var text = el.find('pull-quote-text').text();
	var cite = el.find('pull-quote-source').text();
	return '<blockquote class="article__pull-quote--follows-image">' +
		'<p>' + text + '</p>' +
		(cite ? '<cite>' + cite + '</cite>' : '') +
	'</blockquote>';
};
