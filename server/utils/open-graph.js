
'use strict';

var extractUuid = require('./extract-uuid');

module.exports = function (article, articleV1, mainImage) {

	var og = {
		title: article.title,
		url: 'https://next.ft.com/' + extractUuid(article.id)
	};

	if (articleV1 && articleV1.item && articleV1.item.editorial) {
		og.description = articleV1.item.editorial.standFirst;
	}

	if (mainImage) {
		og.image = mainImage.binaryUrl;
	}

	return og;
};
