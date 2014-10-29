

/*

    A stream is a list of content of various types,

    [
      { type: 'methode,   item: { uuid: ... } },
      { type: 'fastft',   item: { uuid: ... } },
      { type: 'external', item: { uuid: ... } }
    ]

*/

var Stream = function () {
    this.items = [];
};

Stream.prototype.push = function (type, item) {
    this.items.push({ type: type, item: item });
};

Stream.prototype.sortByDate = function () { };

module.exports = Stream;
