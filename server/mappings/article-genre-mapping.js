'use strict';

//TODO Move into separate module so can be used by other apps

function getColumnist(metadata) {
  let columnist;
  if (metadata.find(tag =>
      tag.primary &&
      tag.taxonomy === 'authors' &&
      tag.attributes.find(attr => attr.key === 'isColumnist' && attr.value === true)) &&
    metadata.find(tag =>
      tag.primary &&
      tag.prefLabel === 'Columnists')
    ) {
    columnist = metadata.find(tag => tag.taxonomy === 'authors');
  }
  return columnist;
}

function getBrand(metadata) {
  return metadata.find(
		tag => tag.taxonomy === 'brand'
	);
}

module.exports = function(metadata) {
  let columnist = getColumnist(metadata);
  let brand = getBrand(metadata);
  let result = {};
  let dominantGenre;

  if (columnist) {
    result.genre = 'columnist';
    dominantGenre = columnist;
  } else if (brand) {
    result.genre = 'brand';
    dominantGenre = brand;
  } else {
    result.genre = 'default';
  }

  if (dominantObject) {
    result.title = dominantGenre.prefLabel;
    result.link = `/stream/${dominantGenre.taxonomy}Id/${dominantGenre.idV1}`;
  }

  if (result.genre === 'columnist') {
    result.headshot = `https://image.webservices.ft.com/v1/images/raw/fthead:${dominantGenre.prefLabel.toLowerCase().replace(' ', '-')}`;
  }

  return result;

};
