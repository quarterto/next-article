'use strict';

var ft = require('../utils/api').ft;

module.exports = function(req, res, next) {
    ft
        .get([req.params.id])
        .then(function (article) {

            // ...
            return ft
                .get(article[0].packages)
                .then(function (articles) {
                    if (articles.length > 0) {
                        require('../utils/cache-control')(res);
                        res.render('components/more-on', {
                            mode: 'expand',
                            stream: articles,
                            title: 'Related to this story'
                        });
                    } else {
                        res.status(404).send();
                    }
                }, function (err) {
                    console.error(err);
                });

        }, function (err) {
            console.error(err);
        })
	.end();
};
