'use strict';

module.exports = function (primaryTheme, primarySection, primaryBrand) {
	let moreOnTags = [];

	primaryTheme && moreOnTags.push(primaryTheme);
	primarySection && moreOnTags.push(primarySection);
	primaryBrand && moreOnTags.push(primaryBrand);

	if (!moreOnTags.length) {
		return;
	}

	return moreOnTags.slice(0, 2).map(tag => {
		let title;

		switch (tag.taxonomy) {
			case 'authors':
				title = 'from';
				break;
			case 'brand':
				title = 'from';
				break;
			case 'sections':
				title = 'in';
				break;
			case 'genre':
				title = '';
				break;
			default:
				title = 'on';
		}

		tag.title = title;

		return tag;
	});
};
