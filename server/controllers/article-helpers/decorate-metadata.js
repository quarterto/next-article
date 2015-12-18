'use strict';

function fillProperties(article) {
	article.metadata = article.metadata.map(tag => {
		let v1 = {
			id: tag.idV1,
			name: tag.prefLabel,
			url: `/stream/${tag.taxonomy}Id/${tag.idV1}`
		};

		return Object.assign(v1, tag);
	});
}

function selectPrimaryTheme(article) {
	article.primaryTheme = article.metadata.find(tag => tag.primary === 'theme');
}

function selectPrimarySection(article) {
	article.primarySection = article.metadata.find(tag => tag.primary === 'section');
}

function selectPrimaryBrand(article) {
	article.primarySection = article.metadata.find(tag => tag.primary === 'brand');
}

function selectPrimaryTag(article) {
	let precedence = [ 'specialReports' ];
	let primaryTag;

	if (article.primarySection && precedence.indexOf(article.primarySection.taxonomy) > -1) {
		primaryTag = article.primarySection;
	} else {
		primaryTag = article.primaryTheme || article.primarySection || null;
	}

	article.primaryTag = primaryTag;
}

function selectTagsForDisplay(article) {
	let ignore = [ 'genre', 'mediaType', 'iptc', 'icb' ];

	article.tags = article.metadata
		.filter(
			tag => !ignore.find(taxonomy => taxonomy === tag.taxonomy)
				&& (!article.primaryTag || article.primaryTag.id !== tag.id)
		)
		.slice(0, 5);
}

module.exports = function(article) {
	fillProperties(article);
	selectPrimaryTheme(article);
	selectPrimarySection(article);
	selectPrimaryBrand(article);
	selectPrimaryTag(article);
	selectTagsForDisplay(article);

	return article;
};
