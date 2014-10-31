'use strict';

var express = require('express');

/* Components - TODO - move to another router */

var popular = require('./jobs/popular');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.ft.template = 'list';
    next();
});

router.get('/splash', function(req, res, next) {
    res.ft.template = 'splash/base';
    next();
});

router.get('/sections', function(req, res, next) {
    res.ft.template = 'sections/base';
    next();
});

router.get('/site-search', function(req, res, next) {
    res.ft.template = 'site-search/base';
    next();
});

router.get('/header', function(req, res, next) {
    res.ft.template = 'header/base';
    next();
});

router.get('/stream', function(req, res, next) {
    res.ft.template = 'stream/base';
    res.ft.viewData = {
        mode: 'compact',
        stream: popular.get()
    };
    next();
});

module.exports = router;
