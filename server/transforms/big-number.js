"use strict";

var cheerio = require('cheerio');
module.exports = function ($, flags) {
	$('big-number').replaceWith(function(index, el) {
		el = cheerio(el);
		var title = el.find('big-number-headline').html();
		var content = el.find('big-number-intro').html();
		return '<span class="article__big-number ng-pull-out ng-inline-element o-big-number o-big-number--standard">' +
			'<span class="o-big-number__title">' +
				title +
			'</span>' +
			'<span class="o-big-number__content">' +
				content +
			'</span>' +
		'</span>';
	});

	return $;
};
