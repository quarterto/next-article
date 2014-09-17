var Poller = require('ft-poller'),
    _ = require('lodash'),
    mostPopular;

var poller = new Poller({
    url: 'http://mostpopular.sp.ft-static.com/v1/mostPopular?source=nextArticle', 
    refreshInterval: 1000 * 60 * 5,
    parseData: function (data) {
      var url, contentType, index, fileName;
        
        for(var contentType in data) {
          
          if(data[contentType].pages) {
            data[contentType].pages.forEach(function(link) {
              url = link.url;
              index = url.lastIndexOf("/");
              id = url.substr(index+1).replace('.html', '');
              link = _.extend(link, {id: id})
            })
          }
        }
        mostPopular = data;
    }
});

// poller.on('error', function (err) {
//     console.error(err)
// })

module.exports = {
 	get: function() {
        return mostPopular;
    },

    init: function() {
      poller.start({initialRequest: true});
  },

  poller: poller
}
