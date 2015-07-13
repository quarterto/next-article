'use strict';

module.exports = function(sections) {
	var attributes;

	// Try to find a section with site and zone
	// Slightly hacky but quite effective, this will keep going through
	// the array until it finds a tag with dfpSite and a dfpZone,
	// but if it only finds one with a dfpSite that will still be captured
	// and returned to the caller of main function in this file.
	// It relies on the fact that a tag with a dfpZone *needs*
	// to also have a dfpSite.
	sections.some(function(section) {
			var site = section.term.attributes.find(function(attribute) {
					return attribute.key === 'dfpSite';
				});
			var zone = section.term.attributes.find(function(attribute) {
					return attribute.key === 'dfpZone';
				});
			attributes = {
				dfpSite: site && site.value,
				dfpZone: zone && zone.value
			};
			return site && zone;
		});

	return attributes;
};
