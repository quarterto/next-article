'use strict';

var $ = require('cheerio');

module.exports = function(index, el) {
	el = $(el);
	el.attr('class', 'article__inline-image');
	return el.clone();
};
