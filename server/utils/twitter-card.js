
'use strict';

module.exports.summary = function (article, articleV1, mainImage) {

	var card = {
		title: article.title,
	};

	if (articleV1 && articleV1.item && articleV1.item.editorial) {
		card.description = articleV1.item.editorial.standFirst;
	}

	if (mainImage) {
		card.card = "summary_large_image";
		card.image = mainImage.binaryUrl;
	} else {
		card.card = "summary";
	}

	return card;
};
