"use strict";

var $ = require('cheerio');
module.exports = function(index, el) {
	el = $(el);
	var title = el.find('big-number-headline').text();
	var content = el.find('big-number-intro').text();
	return '<span class="g-pull-out g-inline-element o-big-number o-big-number--standard"><span class="o-big-number__title">'
		+ title
		+ '</span><span class="o-big-number__content">'
		+ content
		+ '</span></span>';
};
