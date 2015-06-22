'use strict';

var cheerio = require('cheerio');

module.exports = function ($) {
	$('.ft-subhead')
		.attr('id', function(index) {
			return 'subhead-' + (index + 1);
		})
		.replaceWith(function(index, el) {
			var $el = cheerio(el);

			$el.addClass('article__subhead ng-pull-out')
				.html('<span class="article__subhead__title">' + $el.text() + '</span>');

			return $el.clone();
		});

	return $;
};
