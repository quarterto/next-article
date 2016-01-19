'use strict'

module.exports = (tag) => {
	let title;

	switch(tag.taxonomy) {
		case 'authors':
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
};
