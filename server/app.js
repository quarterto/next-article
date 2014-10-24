'use strict';

var express = require('express');
var swig = require('swig');
var dateFormat = require('dateformat');
var request = require('request');
var SearchFilters = require('./searchFilters.js');
var Stream = require('../models/stream');
var Clamo = require('fastft-api-client');
var Flags = require('next-feature-flags-client');

var app = module.exports = express();

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/../static/components');

// not for production
app.set('view cache', false);
swig.setDefaults({ cache: false });
swig.setFilter('resize', function(input, width) {
  return 'http://image.webservices.ft.com/v1/images/raw/' + encodeURIComponent(input) + '?width=' + width + '&source=docs&fit=scale-down';
});

app.use('/dobi', express.static(__dirname + '/../static'));
app.use('/components', require('./components.js'));

var latest  = require('./jobs/latest');
var popular = require('./jobs/popular');
var ft      = require('ft-api-client')(process.env.apikey);

var flagsNamespace = (process.env.FLAGS) ? process.env.FLAGS : 'production';
var flags = new Flags('http://ft-next-api-feature-flags.herokuapp.com/' + flagsNamespace);
var featureFlags = {};

setInterval(function () {
    featureFlags = flags.get();
}, 3000);

// Appended to all successful responses
var responseHeaders = {
    'Cache-Control': 'max-age=120, public'
};

require('es6-promise').polyfill();

var templates = { };

var formatSection = function (s) {
    if(/(.*):(.*)/.test(s)) {
        var a = s.split(':')[1].replace(/"/g, '');
        return a;
    }
    return s;
};

/*
    FIXME - make a new route for this
*/
    
app.get('/search/fastft', function(req, res, next) {

    var searchFilters = new SearchFilters(req);
    
    Clamo.config('host', 'http://clamo.ftdata.co.uk/api');
    Clamo.config('timeout', 4000);
    Clamo.search(req.query.q, {     // Eg, 'location:Japan'
        limit: 10,
        offset: 1
        }).then(function (data) {
            
            var stream = new Stream();
            
            data.posts.forEach(function (post) {
                stream.push('fastft', post)
            });
    });
});

app.get('/favourites', function(req,res,next) {
    var userId = req.query.user;
    var query = '';
    var streams = [];
    if(!userId) {
        res.status(404).send();
    }
    var list = request.get({
        url: 'http://ft-next-api-user-prefs.herokuapp.com/user/favourites',
        headers: {
            'X-FT-UID': userId
        }
    }, function(err, resp) {
        if(resp.body) {
            streams = JSON.parse(resp.body);
            query = streams.map(function(el) {
                return el.uuidv3;
            }).join(' OR ');
        }
        req.url = '/search';
        req.query = {
            q: query,
            friendly: 'favourites',
            isFollowable: false
        };
        next('route');

        // res.redirect('/search?friendly=favourites&q=' + query);
    });
});

app.get('/search', function(req, res, next) {
    
    if (!req.query.q) {
        res.redirect('/');
        return;
    }
        
    var count = (req.query.count && parseInt(req.query.count) < 30) ? req.query.count : 10;
    var searchFilters = new SearchFilters(req);
    var query = searchFilters.buildAPIQuery();
    
    ft.search(query, count)
        .then(function (result) {
            var articles = result.articles;

            if (!articles.length){
                res.send(404);
                return;
            }

            if (articles[0] instanceof Object) {
                var ids = articles.map(function (article) {
                    return article.id;
                });
            } else {
                var ids = articles; // FIXME when is this ever not a Object?
            }

            if (/^popular:most/i.test(req.query.q)) {
                
                var stream = new Stream();

                articles.forEach(function (article) {
                    stream.push('methode', article)
                });
                
                res.render('layout/base', {
                    mode: 'compact',
                    stream: { items: popular.get().slice(0, (count || 5)), meta: { facets: [] } },
                    title: formatSection(req.query.q),
                    isFollowable: req.query.isFollowable !== false,
                    flags: featureFlags
                });
                return;
            }

            ft.get(ids)
                .then( function (articles) {
                    var stream = new Stream();

                    articles.forEach(function (article) {
                        stream.push('methode', article)
                    });
                  
                    res.render('layout/base', {
                        mode: 'compact',
                        stream: { items: stream.items, meta: { facets: (result.meta) ? result.meta.facets : [] }},
                        selectedFilters : searchFilters.filters,
                        searchFilters : searchFilters.getSearchFilters([]),
                        title: formatSection(req.query.q),
                        isFollowable: req.query.isFollowable !== false,
                        flags: featureFlags
                    });

                }, function(err) {
                    console.log(err);
                    res.send(404);
                });

    }, function (err) { console.log('ERR', err) })

})


// ft articles
app.get(/^\/([a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+)/, function(req, res, next) {
    ft
        .get([req.params[0]])
        .then(function (articles) {
            res.set(responseHeaders);
            res.vary(['Accept-Encoding', 'Accept']);
    
            console.log(req.accepts(['html', 'json']));
            switch(req.accepts(['html', 'json'])) {
                    case 'html':
                        
                        var stream = new Stream();

                        articles.forEach(function (article) {
                            stream.push('methode', article)
                        });

                        res.render('layout/base', {
                            mode: 'expand',
                            isArticle: true,
                            stream: { items: stream.items, meta: { facets: [] }}, // FIXME add facets back in, esult.meta.facets)
                            isFollowable: true,
                            flags: featureFlags
                        });
                
                        break;

                    case 'json':

                        var article = articles[0];
                        res.json({
                            id: article.id,	    
                            headline: article.headline,	    
                            largestImage: article.largestImage,	    
                            body: [
                                    article.paragraphs(0, 2, { removeImages: false }).toString(),
                                    article.paragraphs(2, 100, { removeImages: false }).toString()
                                ]
                            });
                        break;
                    default:
                        
                        res.status(406).end();
                        break;
                }

        }, function (err) {
            console.log(err);
        });
});



// More-on
app.get('/more-on/:id', function(req, res, next) {
    ft
        .get([req.params.id])
        .then(function (article) {

            // ...
            ft
                .get(article[0].packages)
                .then(function (articles) {
		    if (articles.length > 0) {
                        res.set(responseHeaders);
                        res.render('more-on/base', {
                            mode: 'expand',
                            stream: articles,
                            flags: featureFlags
                        });
		    } else {
			res.status(404).send();
		    }
                }, function (err) {
                    console.error(err);
                });

        }, function (err) {
            console.error(err);
        });
});

// Uber-nav
app.get('/uber-nav', function(req, res, next) {
  request({
    url: 'http://next-companies-et-al.herokuapp.com/v1/ubernav.json',
    json: true
  }, function (err, response, body) {
     res.set(responseHeaders);
     res.render('uber/base', body);
  });
});

// __gtg
app.get('/__gtg', function(req, res, next) {
  res.status(200).end();
});

app.get('/', function(req, res) {
	res.redirect('/search?q=page:Front%20page');
});

if (process.env.NODE_ENV === 'production') {
	var raven = require('raven');
	app.use(raven.middleware.express(process.env.RAVEN_URL));
}

// Start polling the data

latest.init();
popular.init();

//
var port = process.env.PORT || 3001;
app.listen(port, function() {
      console.log("Listening on " + port);
});
