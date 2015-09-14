'use strict';

module.exports = function(metadata) {
	var tagToUse = metadata.primaryTheme;
	if (!tagToUse) {
		tagToUse = metadata.primarySection;
	}
	if (!tagToUse) {
		return ;
	}
	tagToUse.term.url = '/stream/' +	tagToUse.term.taxonomy + 'Id/' + tagToUse.term.id;
	return tagToUse.term;
};
