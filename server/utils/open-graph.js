
'use strict';

var extractUuid = require('./extract-uuid');

module.exports = function (article, articleV1, mainImage) {

	var og = {
		title: article.title,
		description: articleV1.editorial.standFirst,
		url: 'https://next.ft.com/' + extractUuid(article.id)
	};

	if (mainImage) {
		og.image = mainImage.binaryUrl;
	}

	return og;
};
