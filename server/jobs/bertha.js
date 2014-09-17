
var Poller = require('ft-poller'),
    ft = require('ft-api-client')(process.env.apikey),
    bertha = [],
    _ = require('lodash');

var poller = new Poller({
    url: 'http://bertha.ig.ft.com/view/publish/gss/0AomooT6Jg2nGdGR1NUsxQzJpdWlPY1RBYk5oZ2R6SFE/HomePageArticles', 
    refreshInterval: 1000 * 60 * 5,
    parseData: function (data) {

        // Fetch to top 20 latest stories from the Content API
        var ids = _.pluck(data, 'uuid').slice(0, 5);
        
        console.log('bertha', ids)
        
        if (!ids) return;
        ft
            .get(ids)
            .then(function (articles) {
                bertha = articles;
            }, function (err) {
                console.log(err);
            })
    }
});

poller.on('error', function (err) {
    console.error(err)
})

module.exports = {
    
    get: function() {
        return bertha;
    },

    init: function() {
        poller.start({initialRequest: true});
    },

  poller: poller
}
