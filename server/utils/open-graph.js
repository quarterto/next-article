
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

	if(articleV1 && articleV1.item && articleV1.item.metadata &&
		articleV1.item.metadata.authors &&
		articleV1.item.metadata.authors.some(function(author) {
		return author && author.term && author.term.id === 'Q0ItMDAwMDc5Ng==-QXV0aG9ycw=='; //Hannah Kuchler
	})) {
		og.facebookAuthor = 'https://www.facebook.com/HKuchler';
	}

	return og;
};
