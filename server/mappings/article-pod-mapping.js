'use strict';

var articleTopicMapping = require('../mappings/article-topic-mapping');

// NOTE: This mapping is for V1 items. We'll try to make them more V3-like.

module.exports = function(article, imageOptions) {
	imageOptions = imageOptions || {
		imageSrcset: {
			s: 200,
			default: 200
		},
		imageClass: '',
		imageAlt: ''
	};

	var articleModel = {
		id: article.item.id,
		title: article.item.title.title,
		url: '/content/' + article.item.id,
		publishedDate: article.item.lifecycle.lastPublishDateTime,
		subheading: article.item.editorial.subheading,
		primaryTag: articleTopicMapping(article.item.metadata)
	};

	if (!article.item.images) {
		return articleModel;
	}

	var images = {};

	article.item.images.forEach(function(img) {
		images[img.type] = img;
	});

	articleModel.mainImage = images['wide-format'] || images.article || images.primary;

	if (articleModel.mainImage) {
		articleModel.mainImage.srcset = imageOptions.imageSrcset;
		articleModel.mainImage.class = imageOptions.imageClass;
		articleModel.mainImage.alt = imageOptions.imageAlt;
	}

	return articleModel;
};
