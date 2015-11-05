'use strict';

//TODO Move into separate module so can be used by other apps

module.exports = function (metadata) {
  // check for whether a brand tag exists
  let matchedTag = metadata.find(tag => tag.taxonomy === 'brand');
  // but Columnist trumps brand
  if (
    metadata.find(tag => tag.taxonomy === 'authors') &&
    metadata.find(tag =>
      tag.taxonomy === 'genre' &&
      tag.prefLabel === 'Comment'
    ) &&
    metadata.find(tag =>
      tag.taxonomy === 'sections' &&
      tag.prefLabel === 'Columnists')
  ) {
    matchedTag = metadata.find(tag => tag.taxonomy === 'authors');
  }
  // for Columnists, check whether there is a headshot and add the url
  if (matchedTag &&
      matchedTag.taxonomy === 'authors' &&
      // HACK this line to be deleted when we get a headshot of Larry Summers in the image service
      matchedTag.prefLabel !== 'Larry Summers' &&
      matchedTag.attributes &&
      matchedTag.attributes.find(attribute =>
  // this is the way it should be done - awaiting change to next-es-article
        // attribute.key === 'hasHeadshot' && attribute.value === true)
        attribute.key === 'isColumnist' && attribute.value === true)
  ) {
    matchedTag.headshot = `https://image.webservices.ft.com/v1/images/raw/fthead:${matchedTag.prefLabel.toLowerCase().replace(' ', '-')}`;
  }
  return matchedTag
};
