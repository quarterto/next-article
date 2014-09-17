
var Poller = require('ft-poller'),
    ft = require('ft-api-client')(process.env.apikey),
    popular = [],
    _ = require('lodash');

var poller = new Poller({
    url: 'http://mostpopular.sp.ft-static.com/v1/mostPopular?source=nextArticle', 
    refreshInterval: 1000 * 60 * 5,
    parseData: function (data) {

        // Fetch to top 20 latest stories from the Content API

        ids = data.mostRead.pages.map(function (page) {
            var index = page.url.lastIndexOf("/");
            var id = page.url.substr(index+1).replace('.html', '');
            return id;
        }).slice(0, 5);

        console.log('popular', ids);

        if (!ids) return;
        ft
            .get(ids)
            .then(function (articles) {
                popular = articles; 
            }, function (err) {
                //console.log(err)
            })
    }
});

poller.on('error', function (err) {
    console.error(err)
})

module.exports = {
    
    get: function() {
        return popular;
    },

    init: function() {
        poller.start({initialRequest: true});
    },

  poller: poller
}
