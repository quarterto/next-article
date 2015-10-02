'use strict';

var getVisualCategory = require('ft-next-article-genre');
var articleTopicMapping = require('../mappings/article-topic-mapping');

module.exports = function(article, imageOptions) {
	imageOptions = imageOptions || {
		imageSrcset: {
			s: 100,
			m: 200
		},
		imageClass: '',
		imageAlt: ''
	};

	var articleModel = {
		id: article.item.id,
		headline: {
			text: article.item.title.title,
			url: '/content/' + article.item.id
		},
		lastUpdated: article.item.lifecycle.lastPublishDateTime,
		subheading: article.item.editorial.subheading,
		tag: articleTopicMapping(article.item.metadata),
		visualCategory: getVisualCategory(article.item.metadata)
	};
	if (!article.item.images) {
		return articleModel;
	}
	var images = {};
	article.item.images.forEach(function(img) {
		images[img.type] = img;
	});
	articleModel.image = images['wide-format'] || images.article || images.primary;
	if (articleModel.image) {
		articleModel.image.srcset = imageOptions.imageSrcset;
		articleModel.image.class = imageOptions.imageClass;
		articleModel.image.alt = imageOptions.imageAlt;
	}
	return articleModel;
};
