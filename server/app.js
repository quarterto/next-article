'use strict';

var express = require('express');
var swig = require('swig');
var dateFormat = require('dateformat');
var request = require('request');
var SearchFilters = require('./searchFilters.js');

var app = module.exports = express();
if (process.env.NODE_ENV === 'production') {
	var raven = require('raven');
	app.use(raven.middleware.express(process.env.RAVEN_URL));
}

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


app.get('/search', function(req, res, next) {
        var count = (req.query.count && parseInt(req.query.count) < 30) ? req.query.count : 10;
        var searchFilters = new SearchFilters(req);

        var render = function render(articles, searchFilters, facets){
            res.set(responseHeaders);
            res.render('layout/base', {
                mode: 'compact',
                stream: articles,
                selectedFilters : searchFilters.filters,
                searchFilters : searchFilters.getSearchFilters(facets),
                title: formatSection(req.query.q)
            });
        };

        if (/^popular:most/i.test(req.query.q)) {
            
            res.render('layout/base', {
                mode: 'compact',
                stream: popular.get().slice(0, (count || 5)), 
                title: formatSection(req.query.q)
            });

            return;
        }
        var query = searchFilters.buildAPIQuery();
        console.log('Perform Search', query);
        ft.search(query, count)
            .then(function (result) {
                var articles = result.articles;

                if(!articles.length){
                    render(articles, searchFilters, result.meta.facets);
                    return;
                }

                var ids;
                if (articles[0] instanceof Object) {
                    ids = articles.map(function (article) {
                        return article.id;
                    });
                } else {
                    ids = articles;
                }

                ft.get(ids)
                    .then( function (articles) {
                        render(articles, searchFilters, result.meta.facets);
                    }, function(err) {
                        console.log(err);
                        res.send(404);
                    });

        }, function (err) {
            console.log(err);
            res.send(404);
        });
});

// ft articles
app.get(/^\/([a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+\-[a-f0-9]+)/, function(req, res, next) {
    ft
        .get([req.params[0]])
        .then(function (article) {
            res.set(responseHeaders);
	    res.vary(['Accept-Encoding', 'Accept']);
	    switch(req.accepts(['html', 'json'])) {
                case 'html':
                    res.render('layout/base', {
                        mode: 'expand',
                        isArticle: true,
                        stream: article
                    });
		    break;
                case 'json':
		    article = article[0];
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
                            stream: articles
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

// Start polling the data

latest.init();
popular.init();

//
var port = process.env.PORT || 3001;
app.listen(port, function() {
      console.log("Listening on " + port);
});
