'use strict';

function apply(feedNames) {
	return {
		itunes: feedNames[0] ? 'https://itunes.apple.com/gb/podcast/' + feedNames[0] : null,
		stitcher: feedNames[1] ? 'http://www.stitcher.com/podcast/financial-times/' + feedNames[1] : null,
		audioboom: feedNames[2] ? 'http://audioboom.com/channel/' + feedNames[2] : null,
		soundcloud: feedNames[3] ? 'https://soundcloud.com/ft-analysis' + feedNames[3] : null
	};
}

module.exports = function externalPodcastLinks(show) {
	var data;

	switch(show) {
		case 'http://rss.acast.com/ft-copenhagen-summit':
			break;
		case 'http://rss.acast.com/ft-alphachat':
			data = ['id448302257', 'ft-alphachat', 'ftalphachat', 'ft-alphachat'];
			break;
		case 'http://rss.acast.com/ft-arts':
			data = ['id402479253', 'ft-arts', 'FTarts', 'ft-arts'];
			break;
		case 'http://rss.acast.com/ft-banking-weekly':
			data = ['id374270310', 'banking-weekly', 'bankingweekly', 'ft-banking-weekly'];
			break;
		case 'http://rss.acast.com/ft-big-read':
			data = ['id878656889', '', 'ftbigread', ''];
			break;
		case 'http://rss.acast.com/ft-connected-business':
			data = ['id497374200', 'ft-connected-business', '', ''];
			break;
		case 'http://rss.acast.com/ft-digital-business-mi':
			break;
		case 'http://rss.acast.com/ft-digital-business':
			break;
		case 'http://rss.acast.com/ft-emerging-markets-weekly':
			break;
		case 'http://rss.acast.com/ft-energy-weekly':
			break;
		case 'http://rss.acast.com/ft-hard-currency':
			data = ['id527135392', 'hard-currency', 'hardcurrency', 'ft-hard-currency'];
			break;
		case 'http://rss.acast.com/ft-house-and-home':
			break;
		case 'http://rss.acast.com/ft-investigations':
			data = ['id1012901367', 'ft-investigations', 'ftinvestigations', 'ft-investigations'];
			break;
		case 'http://rss.acast.com/ft-management':
			break;
		case 'http://rss.acast.com/ft-money-show':
			data = ['id287031335', 'ft-money-show-5974', 'ftmoneyshow', 'ft-money-show'];
			break;
		case 'http://rss.acast.com/ft-news':
			data = ['id379613801', 'ft-news', 'ftnews', 'ft-news'];
			break;
		case 'http://rss.acast.com/ft-science':
			break;
		case 'http://rss.acast.com/ft-uk-general-election-2010':
			break;
		case 'http://rss.acast.com/ft-uk-general-election-2015':
			data = ['', 'UK-election-2015', 'ftukgeneralelection2015', ''];
			break;
		case 'http://rss.acast.com/ft-world-weekly':
			data = ['id377218713', 'world-weekly-with-gideon-rachman', 'worldweeklywithgideonrachman', 'ft-world-weeky'];
			break;
		case 'http://rss.acast.com/ft-lucy-kellaway':
			data = ['id201455746', 'listen-to-lucy', 'listentolucy', 'ft-listen-to-lucy-kellaway'];
			break;
		case 'http://rss.acast.com/ft-martin-wolf':
			break;
		case 'http://rss.acast.com/ft-robin-robertson':
			break;
		case 'http://rss.acast.com/ft-stephen-fry-lady-gaga':
			break;
	}

	return data && apply(data);
};
