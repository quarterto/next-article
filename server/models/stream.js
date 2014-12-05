

/*

    A stream is a list of content of various types,

    [
      { type: 'methode,   item: { uuid: ... } },
      { type: 'fastft',   item: { uuid: ... } },
      { type: 'external', item: { uuid: ... } }
    ]

*/

function getVisualTone(item) {
    return ['comment', 'analysis','feature'].indexOf(item.visualTone) >= 0 ? 'feature' : 'news';
}

function getPublishDate(item) {
    return item.type === 'fastft' ? item.item._datePublished : item.item.lastUpdated;
}

function isMediaCard(item, positionInStream) {
    if( (positionInStream % 3 === 0) || 
        (getVisualTone(item) === 'feature') ||
        (item.item.has_gallery) ||
        (item.item.largestImage && item.item.largestImage.alt && item.item.largestImage.alt.indexOf("Ingram Pinn") >= 0))    
    {
        return true;
    } else {
        return false;
    }
}

var Stream = function () {
    this.items = [];
};

Object.defineProperty(Stream.prototype, 'texturedItems', {
    get: function() {
        if(this.items.length) {
            return setPositionalAttributes(this.items);
        } else {
            return [];
        }
    }
});

Object.defineProperty(Stream.prototype, 'texturedAndSortedItems', {
    get: function() {
        if(this.items.length) {
            return setPositionalAttributes(sortByLastPublished(this.items));
        } else {
            return [];
        }
    }
});


Stream.prototype.push = function (type, item) {
    var isLead =  (this.items.length === 0);
    this.items.push({ 
        type: type === 'methode' ? getVisualTone(item) : type, 
        item: item
    });
};

function setPositionalAttributes(items) {
    return items.map(function(item, index) {
        item.isLead = (index === 0);
        item.showMedia = isMediaCard(item, index);
        return item;
    });
}

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
