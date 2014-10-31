

/*

    A stream is a list of content of various types,

    [
      { type: 'methode,   item: { uuid: ... } },
      { type: 'fastft',   item: { uuid: ... } },
      { type: 'external', item: { uuid: ... } }
    ]

*/

function isPromoted(tone) {
	return ['comment', 'analysis'].indexOf(tone) >= 0;
}

function getVisualTone(item) {
	return item.type === 'fastft' ? 'fastft' : item.item.visualTone;
}
function getPublishDate(item) {
	return item.type === 'fastft' ? item.item._datePublished : item.item.lastUpdated;
}

var Stream = function () {
    this.items = [];
};

Stream.prototype.push = function (type, item) {
    this.items.push({ type: type, item: item });
};

//Puts greater emphasis on comment and analysis
// Latest news article first, followed by all comment and analysis, followed by rest of news
Stream.prototype.sortByToneAndLastPublished = function() {
	var latest = this.items.shift();
	this.items.sort(function(a, b) {
		if(isPromoted(getVisualTone(a)) && !isPromoted(getVisualTone(b))) {
			return -1;
		} else if (isPromoted(getVisualTone(a)) === isPromoted(getVisualTone(b))) {
			if(getPublishDate(a).getTime() > getPublishDate(b).getTime()) {
				return -1;
			} else if (getPublishDate(a).getTime() === getPublishDate(b).getTime()) {
				return 0;
			} else {
				return 1;
			}
		} else {
			return 1;
		}
	});

	this.items.unshift(latest);
};

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
