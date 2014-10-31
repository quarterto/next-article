'use strict';

var Stream = require('../models/stream');
var fastft = require('../utils/api').fastft;

module.exports = function(req, res, next) {
    fastft.getPost(req.params[0])
        .then(function(response) {
            var stream = new Stream();
            stream.push('fastft', response.post);
            res.ft.template = 'layout';
            res.ft.viewData =  {
                mode: 'expand',
                isArticle: true,
                stream: { items: stream.items, meta: { facets: [] }}, // FIXME add facets back in, esult.meta.facets)
                isFollowable: true,
            };
            next();
                     
        }, function (err) {
            console.log(err);
            res.send(404);
        });
};