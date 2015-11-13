'use strict';

module.exports = function(article) {
	article.og = {
		title: article.title,
		description: article.summaries ? article.summaries[0] : '',
		image: article.mainImage && article.mainImage.url,
		url: `https://next.ft.com/content/${article.id}`
	};

	article.twitterCard = Object.assign({
		card: article.og.image ? 'summary_large_image' : 'summary'
	}, article.og);

	return article;
};
