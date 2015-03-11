"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	var text = el.find('pull-quote-text').text();
	var cite = el.find('pull-quote-source').text();
	return '<blockquote class="article__pull-quote g-pull-out o-quote o-quote--standard">' +
		'<p>' + text + '</p>' +
		(cite ? '<cite class="o-quote__cite">' + cite + '</cite>' : '') +
	'</blockquote>';
};
