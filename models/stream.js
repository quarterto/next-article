

/*

    A stream is a list of content of various types,

    [
      { type: 'methode,   item: { uuid: ... } },
      { type: 'fastft',   item: { uuid: ... } },
      { type: 'external', item: { uuid: ... } }
    ]

*/

function isPromoted(item) {
	var promote = ['comment', 'analysis'];

	if(promote.indexOf(item) >= 0) {
		return true;
	} else {
		return false;
	}
}

var Stream = function () {
    this.items = [];
}

Stream.prototype.push = function (type, item) {
    this.items.push({ type: type, item: item });
}

Stream.prototype.sortByLastPublished = function () { 
	this.items.sort(function(a, b) {
		if(a.item.lastUpdated.getTime() > b.item.lastUpdated.getTime()) {
			return -1
		} else if (a.item.lastUpdated.getTime() === b.item.lastUpdated.getTime()) {
			return 0;
		} else {
			return 1;
		}
	});
}


//Puts greater emphasis on comment and analysis
// Latest news article first, followed by all comment and analysis, followed by rest of news
Stream.prototype.sortByToneAndLastPublished = function() {
	var latest = this.items.shift();

	this.items.sort(function(a, b) {

		if(isPromoted(a.item.visualTone) && !isPromoted(b.item.visualTone)) {
			return -1;
		} else if (isPromoted(a.item.visualTone) === isPromoted(b.item.visualTone)) {
			if(a.item.lastUpdated.getTime() > b.item.lastUpdated.getTime()) {
				return -1
			} else if (a.item.lastUpdated.getTime() === b.item.lastUpdated.getTime()) {
				return 0;
			} else {
				return 1;
			}
		} else {
			return 1;
		}
	});

	this.items.unshift(latest);

}
module.exports = Stream;
