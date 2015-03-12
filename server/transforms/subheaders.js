'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	var $el = $(el);

	$el.addClass('article__subhead ng-pull-out')
		.html('<span class="ft-subhead__title">' + $el.text() + '</span>')
		.append('<a class="back-top-top" href="#top" data-trackable="back-to-top"><span class="back-top-top__text">Back to top</span><span class="back-top-top__icon" /></a>');

	return $el.clone();
};
