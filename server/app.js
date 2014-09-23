
var express = require('express');
var router = express.Router();
var swig = require('swig');

var app = express();

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/../static');

// not for production
app.set('view cache', false);
swig.setDefaults({ cache: false });

app.use(express.static(__dirname + '/../static'));

var latest  = require('./jobs/latest');
var popular = require('./jobs/popular');
var bertha  = require('./jobs/bertha');
var ft      = require('ft-api-client')(process.env.apikey);

GLOBAL.Promise = require('es6-promise').Promise;

var templates = { }

var formatSection = function (s) {

        console.log('**', s);
        if (/(.*):(.*)/.test(s)) {
            var d = s.split(':').replace(/\"/g, '');
            console.log('**', d);
            return d;
        }

        return s;
}

/* Components */

app.get('/components', function(req, res, next) {
    res.render('components/list', { });
});

app.get('/components/context', function(req, res, next) {
    res.render('components/context/base', { 
        latest: latest.get(),
        popular: popular.get(),
        bertha: bertha.get()
    });
});

app.get('/components/splash', function(req, res, next) {
    res.render('components/splash/base', { });
});

app.get('/components/site-search', function(req, res, next) {
    res.render('components/site-search/base', { });
});

app.get('/components/header', function(req, res, next) {
    res.render('components/header/base', { });
});

app.get('/components/stream', function(req, res, next) {
    res.render('components/stream/base', {
        title: 'Most popular',
        mode: 'compact',
        stream: latest.get()
    });
});

/* UI */

app.get('/stream/popular', function(req, res, next) {
    res.render('components/layout/base', { 
        context: 'Most popular',
        mode: 'compact',
        latest: latest.get(),
        popular: popular.get(),
        bertha: bertha.get(),
        stream: popular.get(),
        page: { id: 'popular' }
    });
});

app.get('/stream/latest', function(req, res, next) {
    res.render('components/layout/base', { 
        context: 'Latest',
        mode: 'compact',
        latest: latest.get(),
        popular: popular.get(),
        bertha: bertha.get(),
        stream: latest.get(),
        page: { id: 'latest' }
    });
});

app.get('/stream/picks', function(req, res, next) {
    res.render('components/layout/base', { 
        context: 'Top Stories',
        mode: 'compact',
        latest: latest.get(),
        popular: popular.get(),
        bertha: bertha.get(),
        stream: bertha.get(),
        page: { id: 'picks' }
    });
});

app.get('/context/stream/popular', function (req, res, next) {
    res.set('Cache-Control', 'public, max-age:30'); 
    res.render('components/context/base', { 
        mode: 'compact',
        stream: popular.get(),
        context: 'Most popular',
        label: 'Most popular'
    });
})

app.get('/context/stream/latest', function (req, res, next) {
    res.set('Cache-Control', 'public, max-age:30'); 
    res.render('components/context/base', { 
        mode: 'compact',
        stream: latest.get(),
        context: 'Latest',
        label: 'Latest'
    });
})

app.get('/context/stream/picks', function (req, res, next) {
    res.set('Cache-Control', 'public, max-age:30'); 
    res.render('components/context/base', { 
        mode: 'compact',
        stream: bertha.get(),
        context: 'Top stories',
        label: 'Top stories'
    });
})

app.get('/context/search', function(req, res, next) {

    console.log('Searching for', req.query.q);

    if (req.query.mode === 'stream') {
        
        res.render('components/context/base', { 
            mode: 'compact',
            stream: [],
            label: decodeURI(req.query.q)
        })
    }        

    ft
        .search(decodeURI(req.query.q))
        .then(function (articles) {
                
            var ids = articles.map(function (article) {
                return article.id;
            })
            
            ft
                .get(ids)
                .then( function (articles) {
                    res.set('Cache-Control', 'public, max-age=30'); 
                    res.render('components/context/base', { 
                        mode: 'compact',
                        stream: articles,
                        label: decodeURI(req.query.q),
                        context: req.query.q
                    });
            }, function () {
                console.log(err);
                res.send(404);
            })
        });

})

//
app.get('/search', function(req, res, next) {
    ft
        .search(decodeURI(req.query.q))
        .then(function (articles) {
            
            var ids = articles.map(function (article) {
                return article.id;
            })

            ft
                .get(ids)
                .then( function (articles) {
                    res.render('components/layout/base', { 
                        mode: 'compact',
                        stream: articles,
                        context: req.query.q
                    });
                }, function () {
                    console.log(err);
                    res.send(404);
                })

        }, function (err) {
            console.log(err);
            res.send(404);
        })
    
});

// ft articles
app.get('/:id', function(req, res, next) {
    ft
        .get([req.params.id])
        .then(function (article) {
            res.render('components/layout/base', { 
                mode: 'expand',
                stream: article
            });
        }, function (err) {
            console.log(err);
        })
    
});

app.get('/', function(req, res, next) {
    res.send('<a href="/stream/popular">try here</a>, or <a href="/components">here</a>.');
});


// Start polling the data

latest.init();
popular.init();
bertha.init();

// 
var port = process.env.PORT || 3001;
app.listen(port, function() {
      console.log("Listening on " + port);
});
