'use strict';

module.exports = function(metadata) {
	var tagToUse = metadata.primaryTheme || metadata.primarySection || null;

	if (!tagToUse || !tagToUse.term) {
		return;
	}

	tagToUse.term.url = '/stream/' +	tagToUse.term.taxonomy + 'Id/' + tagToUse.term.id;

	//if part of a special report return the primarySection also
	if (metadata.primarySection && metadata.primarySection.term.taxonomy === 'specialReports') {
		tagToUse.term.specialReport = metadata.primarySection.term;
	}

	return tagToUse.term;
};
