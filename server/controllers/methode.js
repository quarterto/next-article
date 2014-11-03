'use strict';

var Stream = require('../models/stream');
var ft = require('../utils/api').ft;

module.exports = function(req, res, next) {

    ft
        .get([req.params[0]])
        .then(function (articles) {
            res.vary(['Accept-Encoding', 'Accept']);
    
            console.log(req.accepts(['html', 'json']));
            switch(req.accepts(['html', 'json'])) {
                    case 'html':
                        
                        var stream = new Stream();

                        articles.forEach(function (article) {
                            stream.push('methode', article);
                        });
                        require('../utils/cache-control')(res);
                        
                        res.render('layout', {
                            mode: 'expand',
                            isArticle: true,
                            stream: { items: stream.items, meta: { facets: [] }}, // FIXME add facets back in, esult.meta.facets)
                            isFollowable: true
                        });

                                
                        break;

                    case 'json':

                        var article = articles[0];
                        require('../utils/cache-control')(res);
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
};