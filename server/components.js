
var express = require('express');

/* Components - TODO - move to another router */

var popular = require('./jobs/popular');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('list', { });
});

router.get('/splash', function(req, res, next) {
    res.render('splash/base', { });
});

router.get('/sections', function(req, res, next) {
    res.render('sections/base', { });
});

router.get('/site-search', function(req, res, next) {
    res.render('site-search/base', { });
});

router.get('/header', function(req, res, next) {
    res.render('header/base', { });
});

router.get('/stream', function(req, res, next) {
    res.render('stream/base', {
        mode: 'compact',
        stream: popular.get()
    });
});

module.exports = router;
