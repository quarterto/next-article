'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	el = $(el);
	el.addClass('article__inline-image g-inline-element g-pull-out');
	return el.clone();
};
