'use strict';

module.exports = function (article) {

	var exclude = article.item.metadata.primaryTheme && article.item.metadata.primaryTheme.term.id;

	return function (topic) {
		return topic.term.id !== exclude;
	};

};
