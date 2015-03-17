'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	return $('<figure></figure>')
		.addClass('article__inline-image ng-inline-element ng-pull-out')
		.append($(el).clone().addClass('article__image'));
};
