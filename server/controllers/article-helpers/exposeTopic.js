'use strict';

module.exports = function exposeTopic(metadata) {
	if (!metadata) { return undefined; }
	var topic = ['primaryTheme', 'primarySection']
		.filter(function(prop) {
			return metadata[prop] && metadata[prop].term;
		})
		.map(function(prop) {
			return {
				topicName: metadata[prop].term.name,
				topicLink: '/stream/' + metadata[prop].term.taxonomy + 'Id/' + metadata[prop].term.id,
				metadata: metadata[prop]
			};
		})
		.find(function(prop) {
			return (prop.metadata.term && prop.metadata.term.id);
		});

	return topic;
};
