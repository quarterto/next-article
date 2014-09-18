


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

var latest = require('./jobs/latest');
var popular = require('./jobs/popular');
var bertha = require('./jobs/bertha');

GLOBAL.Promise = require('es6-promise').Promise;

var templates = { }

app.get('/latest', function(req, res, next) {
    res.send(latest.get()); 
});

app.get('/popular', function(req, res, next) {
    res.send(popular.get()); 
});

app.get('/bertha', function(req, res, next) {
    res.send(bertha.get()); 
});

app.get('/index', function(req, res, next) {
    res.render('components/index/base', { 
        latest: latest.get(),
        popular: popular.get(),
        bertha: bertha.get()
    });
});

app.get('/stream/popular', function(req, res, next) {
    res.render('components/stream/base', { 
        title: 'Most popular',
        stream: popular.get()
    });
});

app.get('/stream/latest', function(req, res, next) {
    res.render('components/stream/base', { 
        title: 'Latest',
        stream: latest.get()
    });
});

app.get('/stream/picks', function(req, res, next) {
    res.render('components/stream/base', { 
        title: 'Editor\'s picks',
        stream: bertha.get()
    });
});

app.get('/', function(req, res, next) {
    res.render('components/layout/base', { });
});


// Start polling the data

latest.init();
popular.init();
bertha.init();

// 
app.listen(3001);
