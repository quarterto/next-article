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
  let result = columnist ? columnist : brand ? brand : {};

  if (columnist) {
    result = columnist;
    result.genre = 'columnist';
  } else if (brand) {
    result = brand;
    result.genre = 'brand';
  } else {
    result.genre = 'default';
  }

  if (result.genre === 'columnist') {
    result.headshot = `https://image.webservices.ft.com/v1/images/raw/fthead:${result.prefLabel.toLowerCase().replace(' ', '-')}`;
  }

  return result;

};
