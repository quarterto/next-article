'use strict';

var Stream = require('../models/stream');
var clamo = require('../utils/api').clamo;
var Metrics = require('next-metrics');

/*
    Takes data from the clamo api and returns it in the required format
*/

module.exports = function(req, res, next) {

    Metrics.instrument(res, { as: 'express.http.res' });

    //
    clamo.getPost(req.params[0])
        .then(function(response) {
            var stream = new Stream();

            //consider refactoring 'stream' to push to a key of 'clamo' rather than 'fastft'
            //and alter those places which use this object?
            stream.push('fastft', response.post);
            require('../utils/cache-control')(res);
            res.render('layout', {
                mode: 'expand',
                isArticle: true,
                stream: { items: stream.items, meta: { facets: [] }}, // FIXME add facets back in, esult.meta.facets)
                isFollowable: true
            });

        }, function (err) {
            console.log(err);
            res.send(404);
        });
};
