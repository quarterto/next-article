'use strict';

//TODO Move into separate module so can be used by other apps

function getColumnist(metadata) {
  let matchedTag = metadata.find(tag =>
    tag.taxonomy === 'authors' &&
    tag.attributes.find(attribute => attribute.key === 'isColumnist' && attribute.value === true)
  );
  if (matchedTag) {
    return mapElements(matchedTag, 'columnist');
  }
}

function getBrand(metadata) {
  let matchedTag = metadata.find(tag =>
    tag.taxonomy === 'brand' && mapElements(tag, 'brand')
	);
  if (matchedTag) {
    return mapElements(matchedTag, 'brand');
  }
}

function mapElements(tag, genre) {
  let headshot;
  if (genre === 'columnist') {
    headshot = `https://image.webservices.ft.com/v1/images/raw/fthead:${tag.prefLabel.toLowerCase().replace(' ', '-')}`;
  }
  return {
    genre: genre,
    title: tag.prefLabel,
    url: tag.url,
    headshot: headshot
  }
}

module.exports = function(metadata) {
  let columnist = getColumnist(metadata);
  let brand = getBrand(metadata);
  let result;
  console.log('columnist ', columnist);
  console.log('brand ', brand);

  columnist ? result = columnist : brand ? result = brand : result = null;

  return result;
};
