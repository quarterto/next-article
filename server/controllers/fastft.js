'use strict';

var Stream = require('../models/stream');
var fastft = require('../utils/api').fastft;

module.exports = function(req, res, next) {
    fastft.getPost(req.params[0])
        .then(function(response) {
            var stream = new Stream();
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