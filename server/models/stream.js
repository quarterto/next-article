'use strict';

var cardViewModel = require('next-article-card-component/node/view-model');

/*

	A stream is a list of content of various types,

	[
	  { type: 'methode,   item: { uuid: ... } },
	  { type: 'fastft',   item: { uuid: ... } },
	  { type: 'external', item: { uuid: ... } }
	]

*/

function getVisualTone(item) {
	return item.visualTone && ['comment', 'analysis','feature'].indexOf(item.visualTone) >= 0 ? 'feature' : 'news';
}

function getPublishDate(item) {
	return item.type === 'fastft' ? item.item._datePublished : item.item.lastUpdated;
}

function isMediaCard(item, positionInStream) {
	if( (positionInStream % 3 === 0) ||
		(getVisualTone(item) === 'feature') ||
		(item.item.has_gallery) ||
		(item.item.largestImage && item.item.largestImage.alt && (typeof item.item.largestImage.alt === "string") && item.item.largestImage.alt.indexOf("Ingram Pinn") >= 0))
	{
		return true;
	} else {
		return false;
	}
}

var Stream = function () {
	this.items = [];
};

Stream.merge = function () {
	var stream = new Stream();
	[].forEach.call(arguments, function (str) {
		stream.items = stream.items.concat(str.items);
	});
	stream.items = sortByLastPublished(stream.items);
	return stream;
};

Stream.prototype.setViewConf = function (obj) {
	this.viewConf = obj;
};

Object.defineProperty(Stream.prototype, 'texturedItems', {
	get: function() {
		if(this.items.length) {
			return this.getItemsForView();
		} else {
			return [];
		}
	}
});

Object.defineProperty(Stream.prototype, 'texturedAndSortedItems', {
	get: function() {
		if(this.items.length) {
			return this.getItemsForView(sortByLastPublished(this.items));
		} else {
			return [];
		}
	}
});


Stream.prototype.push = function (type, item) {
	this.items.push({
		type: type === 'methode' ? getVisualTone(item) : type,
		isFeature: (type === 'methode' ? getVisualTone(item) : type) === 'feature' ? true : false,
		item: item
	});
};

Stream.prototype.getItemsForView = function (items) {
	items = items || this.items;
	return items.map(function(item, index) {

		var conf = {
			type: item.type,
			isLead: (index === 0),
			dataFormat: item.type === 'fastft' ? 'fastft' : 'methode',
			showMedia: isMediaCard(item, index)
		};
		if (this.viewConf) {
			Object.keys(this.viewConf).forEach(function (key) {
				conf[key] = this.viewConf[key];
			}.bind(this));
		}
		return cardViewModel(item.item, conf);
	}.bind(this));
};

// REVIEW:MA This is view logic.
Stream.prototype.getTiled = function (rows, cols) {
	var layout = [];
	// column divided into 6 vertically as divisible by 2 or 3
	var columnFullness = 0;
	var layoutFullness = 0;
	var rowFullness = 0;
	var row = [];
	var column = [];

	this.items.some(function(item, index) {
		if (columnFullness === 6) {
			columnFullness = 0;
			row.push(column);
			rowFullness++;
			column = [];
			if (rowFullness === cols) {
				layout.push(row);
				layoutFullness++;
				rowFullness = 0;
				row = [];
				if (layoutFullness === rows) {
					return true;
				}
			}
		}

		var spaceLeft = 6 - columnFullness;
		var wantsLead = (index < 2);
		var wantsMedia = isMediaCard(item, index);
		var getsLead = false;
		var getsMedia = false;

		switch (spaceLeft) {
			case 2:
				getsLead = false;
				getsMedia = false;
				break;
			case 3:
				getsLead = false;
				getsMedia = true;
				break;
			case 4:
				if (wantsLead) {
					getsLead = true;
					getsMedia = false;
				} else {
					getsLead = false;
					getsMedia = false;
				}
				break;
			default:
				getsLead = wantsLead;
				getsMedia = wantsMedia;
		}

		var conf = {
			type: item.type,
			isLead: getsLead,
			dataFormat: item.type === 'fastft' ? 'fastft' : 'methode',
			showMedia: getsMedia,
			isTile: true
		};

		if (this.viewConf) {
			Object.keys(this.viewConf).forEach(function (key) {
				conf[key] = this.viewConf[key];
			}.bind(this));
		}

		if (conf.showMedia && conf.isLead) {
			columnFullness += 6;
		} else if (conf.showMedia && !conf.isLead) {
			columnFullness += 3;
		} else if (!conf.showMedia && conf.isLead) {
			columnFullness += 4;
		} else if (!conf.showMedia && !conf.isLead) {
			columnFullness += 2;
		}

		column.push(cardViewModel(item.item, conf));
	}.bind(this));

	if (column.length) {
		row.push(column);
	}
	if (row.length) {
		layout.push(row);
	}
	return layout;
};






//Puts greater emphasis on comment and analysis
// Latest news article first, followed by all comment and analysis, followed by rest of news
function sortByLastPublished(items) {
	return items.sort(function(a, b) {
		if(getPublishDate(a).getTime() > getPublishDate(b).getTime()) {
			return -1;
		} else if (getPublishDate(a).getTime() === getPublishDate(b).getTime()) {
			return 0;
		} else {
			return 1;
		}
	});
}

Object.defineProperty(Stream.prototype, 'related', {
	get: function () {
			var distinct = {};
			var topics = this.items.map(function(item) {
				return item.item.topics || [];
			}).reduce(function(a, b) {
				return a.concat(b);
			}).filter(function(current, index, self) {
				if(!distinct[current.searchString]) {
					distinct[current.searchString] = true;
					return true;
				}
				return false;
			});
		return topics;
	}
});


module.exports = Stream;
