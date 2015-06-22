"use strict";

var cheerio = require('cheerio');

module.exports = function ($) {
	$('pull-quote').replaceWith(function(index, el) {
		el = cheerio(el);
		var text = el.find('pull-quote-text').text();
		var cite = el.find('pull-quote-source').text();
		return '<blockquote class="article__pull-quote ng-pull-out o-quote o-quote--standard">' +
			'<p>' + text + '</p>' +
			(cite ? '<cite class="o-quote__cite">' + cite + '</cite>' : '') +
		'</blockquote>';
	});

	return $;
}
