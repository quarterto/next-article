var $ = require('cheerio');
module.exports = function(index, el) {
	var text = $(el).find('pull-quote-text').text();
	var cite = $(el).find('pull-quote-source').text();
	return $('<blockquote class="o-quote o-quote--standard"><p>'
		+ text
		+ '</p><cite class="o-quote__cite">'
		+ cite
		+ '</cite></blockquote>');
};
