
'use strict';

module.exports.summary = function (article, articleV1, mainImage) {

	var card = {
		title: article.title,
		description: articleV1.editorial.standFirst,
	};

	if (mainImage) {
		card.card = "summary_large_image";
		card.image = mainImage.binaryUrl;
	} else {
		card.card = "summary";
	}

	return card;
};
