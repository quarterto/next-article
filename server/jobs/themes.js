'use strict';

var ft = require('ft-api-client')(process.env.apikey),
    themes = ['SCOTTISH INDEPENDENCE', 'FALLING UK INFLATION', 'THE WAR AGAINST ISIS', 'EUROPEAN CENTRAL BANK RATES', 'EPA CARBON RULING', 'THE CRISIS IN UKRAINE'],
    _ = require('lodash');



    var themes_article = [];



        // ft
        // .search(decodeURI(req.query.q), count)
        // .then(function (articles) {

        //     var ids = articles.map(function (article) {
        //         return article.id;
        //     });

        //     ft
        //         .get(ids)
        //         .then( function (articles) {
        //             res.render('layout/base', {
        //                 mode: 'compact',
        //                 stream: articles,
        //                 context: formatSection(req.query.q)
        //             });
        //         }, function(err) {
        //             console.log(err);
        //             res.send(404);
        //         });

        // }, function (err) {
        //     console.log(err);
        //     res.send(404);
        // });


module.exports = {

    get: function() {
        return themes_article;
    },

    init: function() {
      // console.log('themes init: ');
        //       ft
        // .search('SCOTTISH INDEPENDENCE', 10)
        // .then(function (articles) {
        //   console.log('article: ', articles);
        //   // themes_article.push({
        //   //   name: theme,
        //   //   articles: articles
        //   // });

        // }, function (err) {
        //   console.log(err);
        // });

      for (var i = 0, l = themes.length; i < l; i += 1) {
        var theme = themes[i];
        // console.log('theme: ', theme);


        var index = themes_article.push({
          name: theme
        });

        ft
        .search(decodeURI(theme), 3)
        .then((function(theme){
          return function (articles) {
          // console.log('article: ', articles);
          theme.articles = articles;

        }
        })(themes_article[index-1]), function (err) {
          console.log(err);
        });
      }
    }
};
