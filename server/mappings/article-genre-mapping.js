'use strict';

//TODO Delete and replace with n-article-branding

// HACK until hasHeadshot attribute is propogated through ES, back-up of isColumnist
let headshotAttributes = ['isColumnist', 'hasHeadshot'];

function isABrand(metadata) {
	return metadata.find(tag => tag.taxonomy === 'brand');
}

function isAnAuthor(metadata) {
	return metadata.find(tag => tag.taxonomy === 'authors');
}

function isGenreComment(metadata) {
	return metadata.find(tag =>
		tag.taxonomy === 'genre' &&
		tag.prefLabel === 'Comment'
	);
}

function headshotUrl(tag) {
	return `https://image.webservices.ft.com/v1/images/raw/fthead:${tag.prefLabel.toLowerCase().replace(' ', '-')}`;
}

module.exports = function (metadata) {
	let matchedTag = isABrand(metadata);
	if (
		!matchedTag &&
		isAnAuthor(metadata) &&
		isGenreComment(metadata)
	) {
		matchedTag = isAnAuthor(metadata);
	}
	if (matchedTag &&
			matchedTag.taxonomy === 'authors' &&
	// HACK to be deleted when we get a headshot of Larry Summers in image service
			matchedTag.prefLabel !== 'Larry Summers' &&
			matchedTag.attributes &&
			matchedTag.attributes.find(attribute => headshotAttributes.indexOf(attribute.key) > -1)
	) {
		matchedTag.headshot = headshotUrl(matchedTag);
	}
	return matchedTag || null;
};
