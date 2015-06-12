'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	var $el = $(el);

	$el.addClass('article__subhead ng-pull-out')
		.html('<span class="article__subhead__title">' + $el.text() + '</span>');

	return $el.clone();
};
