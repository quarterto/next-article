'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	el = $(el);
	el.addClass('article__inline-image ng-inline-element ng-pull-out');
	return el.clone();
};
