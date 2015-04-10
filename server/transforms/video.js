'use strict';

var $ = require('cheerio');

module.exports = function (index, el) {
	return $('<div></div>')
		.addClass('article__video-wrapper ng-media-wrapper')
		.append($(el).clone());
};
