
var extractUuid = require('./extract-uuid');

module.exports = function (article, articleV1, mainImage) {
	return {
		title: article.title,
		description: articleV1.editorial.standFirst,
		url: 'https://next.ft.com/' + extractUuid(article.id),
		id: article.id,
		image: mainImage.binaryUrl
	}
}
