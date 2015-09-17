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
		case 'Copenhagen Summit podcast':
			break;
		case 'FT Alphachat':
			data = ['id448302257', 'ft-alphachat', 'ftalphachat', 'ft-alphachat'];
			break;
		case 'FT Arts podcast':
			data = ['id402479253', 'ft-arts', 'FTarts', 'ft-arts'];
			break;
		case 'Banking Weekly podcast':
			data = ['id374270310', 'banking-weekly', 'bankingweekly', 'ft-banking-weekly'];
			break;
		case 'FT Big Read podcast':
			data = ['id878656889', '', 'ftbigread', ''];
			break;
		case 'FT Connected Business podcast':
			data = ['id497374200', 'ft-connected-business', '', ''];
			break;
		case 'FT Digital Business: Managing Intelligence':
			break;
		case 'FT Digital Business with Peter Whitehead':
			break;
		case 'FT Emerging Markets Weekly podcast':
			break;
		case 'FT Energy Weekly podcast':
			break;
		case 'Hard Currency podcast':
			data = ['id527135392', 'hard-currency', 'hardcurrency', 'ft-hard-currency'];
			break;
		case 'FT House and Home podcast':
			break;
		case 'FT Investigations podcast':
			data = ['id1012901367', 'ft-investigations', 'ftinvestigations', 'ft-investigations'];
			break;
		case 'FT Management podcast':
			break;
		case 'FT Money Show':
			data = ['id287031335', 'ft-money-show-5974', 'ftmoneyshow', 'ft-money-show'];
			break;
		case 'FT News podcast':
			data = ['id379613801', 'ft-news', 'ftnews', 'ft-news'];
			break;
		case 'FT Science podcast':
			break;
		case 'FT UK General Election 2010 podcast':
			break;
		case 'FT UK General Election 2015 podcast':
			data = ['', 'UK-election-2015', 'ftukgeneralelection2015', ''];
			break;
		case 'FT World Weekly podcast':
			data = ['id377218713', 'world-weekly-with-gideon-rachman', 'worldweeklywithgideonrachman', 'ft-world-weeky'];
			break;
		case 'Listen to Lucy':
			data = ['id201455746', 'listen-to-lucy', 'listentolucy', 'ft-listen-to-lucy-kellaway'];
			break;
		case 'Martin Wolf podcast':
			break;
		case 'Robin Robertson podcast':
			break;
		case 'Stephen Fry and Lady Gaga podcast':
			break;
	}

	return data && apply(data);
};
