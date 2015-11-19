'use strict';

module.exports = function articlePodMapping(article) {
	let nImageOptions = {
		srcset: {
			s: 200,
			default: 200
		},
		class: ''
	};

	let decoration = {
		url: `/content/${article.id}`,
		subheading: Array.isArray(article.summaries) ? article.summaries[0] : null,
	};

	if (Object.keys(article.mainImage).length > 0) {
		Object.assign(article.mainImage, nImageOptions, { alt: article.mainImage.description });
	}

	let primarySection = article.metadata.find(tag => tag.primary === 'section');
	let primaryTheme = article.metadata.find(tag => tag.primary === 'theme');

	decoration.primaryTag = primaryTheme || primarySection || null;

	if (primarySection && primarySection.taxonomy === 'specialReports') {
		decoration.primaryTag = primarySection;
	}

	if (decoration.primaryTag) {
		Object.assign(decoration.primaryTag, {
			url: `/stream/${decoration.primaryTag.taxonomy}Id/${decoration.primaryTag.idV1}`
		});
	}

	return Object.assign(article, decoration);
};
