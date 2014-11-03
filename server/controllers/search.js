'use strict';

var Stream = require('../models/stream');
var SearchFilters = require('../utils/searchFilters.js');
var ft = require('../utils/api').ft;
var fastft = require('../utils/api').fastft;
var popular = require('../jobs/popular');

var formatSection = function (s) {
    if(/(.*):(.*)/.test(s)) {
        var a = s.split(':')[1].replace(/"/g, '');
        return a;
    }
    return s;
};

var mapQueryToClamo = function(q) {
    return q.replace('sections:', 'sector:')
        .replace('organisations:', 'company:')
        .replace('regions:', 'location:')
        .replace('topics:', 'topic:');
};

module.exports = function(req, res, next) {
    
    if (!req.query.q) {
        res.redirect('/');
        return;
    }
        
    var count = (req.query.count && parseInt(req.query.count) < 30) ? req.query.count : 10;
    var searchFilters = new SearchFilters(req);
    var query = searchFilters.buildAPIQuery();
    
    var fastftPromise = fastft.search(mapQueryToClamo(req.query.q), {     // Eg, 'location:Japan'
        limit: 5,
        offset: 0
    });

    var methodePromise = ft.search(query, count);

    Promise.all([fastftPromise, methodePromise])
        .then(function (results) {
            var fastFTPosts = results[0] ? results[0].posts : [];
            var articles = results[1] ? results[1].articles : [];
            var ids;
            if (!articles.length && !fastFTPosts.length){
                res.send(404);
                return;
            }
            if (articles[0] instanceof Object) {
                ids = articles.map(function (article) {
                    return article.id;
                });
            } else {
                ids = articles; // FIXME when is this ever not a Object?
            }

            if (/^popular:most/i.test(req.query.q)) {
                
                var stream = new Stream();

                articles.forEach(function (article) {
                    stream.push('methode', article);
                });
                require('../utils/cache-control')(res);
                res.render('layout', {
                    mode: 'compact',
                    stream: { items: popular.get().slice(0, (count || 5)), meta: { facets: [] } },
                    title: formatSection(req.query.q),
                    isFollowable: req.query.isFollowable !== false
                });
                return;
            }

            ft.get(ids)
                .then( function (articles) {
                    var stream = new Stream();

                    articles.forEach(function (article) {
                        stream.push('methode', article);
                    });
                    fastFTPosts.forEach(function(post) {
                        stream.push('fastft', post);
                    });

                    stream.sortByToneAndLastPublished();
                    require('../utils/cache-control')(res);
                    res.render('layout', {
                        mode: 'compact',
                        stream: { related: stream.related, items: stream.items, meta: { facets: (results[1].meta) ? results[1].meta.facets : [] }}, // TODO: Add back meta stuff
                        selectedFilters : searchFilters.filters,
                        searchFilters : searchFilters.getSearchFilters([]),
                        title: formatSection(req.query.q),
                        isFollowable: req.query.isFollowable !== false
                    });

                }, function(err) {
                    console.log(err);
                    res.send(404);
                });

    }, function (err) { console.log('ERR', err); });

};