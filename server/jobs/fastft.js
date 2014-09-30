'use strict';

var Poller = require('ft-poller'),
    ft = require('ft-api-client')(process.env.apikey),
    latestNews,
    _ = require('lodash');

var poller = new Poller({
    url: 'http://newsfeed.ft.com/api/latestNews', 
    refreshInterval: 1000 * 60 * 5,
    parseData: function (data) {
        // Fetch to top 20 latest stories from the Content API
        var ids = _.pluck(data, 'id').slice(0, 20);
        if (!ids) return;
        ft
            .get(ids)
            .then(function (articles) {
                latestNews = articles; 
            });
    }
});

poller.on('error', function (err) {
    console.error(err);
});

module.exports = {
    
    get: function() {
        return latestNews;
    },

    init: function() {
        console.log(123);
        poller.start({initialRequest: true});
    },

  poller: poller
};
