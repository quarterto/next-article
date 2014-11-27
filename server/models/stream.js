

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
    return ['comment', 'analysis','feature'].indexOf(item.visualTone) >= 0 ? 'feature' : 'news';
}

function getPublishDate(item) {
    return item.type === 'fastft' ? item.item._datePublished : item.item.lastUpdated;
}

function isMediaCard(item, positionInStream) {
    if(positionInStream % 3 === 0) {
        return true;
    } else if (getVisualTone(item) === 'feature') {
        return true;
    } else if (item.largestImage && item.largestImage.alt && item.largestImage.alt.indexOf("Ingram Pinn") >= 0) {
        return true;
    } else {
        return false;
    }
}

var Stream = function () {
    this.items = [];
};

Stream.prototype.push = function (type, item) {
    var isLead =  (this.items.length === 0);
    this.items.push({ 
        type: getVisualTone(item), 
        item: item, 
        isLead: isLead, 
        showMedia: isMediaCard(item, this.items.length)
    });
};

//Puts greater emphasis on comment and analysis
// Latest news article first, followed by all comment and analysis, followed by rest of news
Stream.prototype.sortByLastPublished = function() {
    var latest = this.items.shift();
    this.items.sort(function(a, b) {
        if(getPublishDate(a).getTime() > getPublishDate(b).getTime()) {
            return -1;
        } else if (getPublishDate(a).getTime() === getPublishDate(b).getTime()) {
            return 0;
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
