'use strict';

var cheerio = require('cheerio');

module.exports = function ($, flags) {
	$('.ft-subhead').each(function (index, subhead) {
		var $subhead = cheerio(subhead);
		var $newSubhead = cheerio('<h2 class="article__subhead">' + $subhead.text() + '</h2');
		var childEl = $subhead.children().get(0);
		if (childEl && childEl.tagName === 'strong') {
			$newSubhead.attr('id', 'crosshead-' + (index + 1));
			$newSubhead.addClass('article__subhead--crosshead ng-pull-out');
		} else {
			$newSubhead.addClass('article__subhead--standard');
		}
		$subhead.replaceWith($newSubhead);
	});

	return $;
};
