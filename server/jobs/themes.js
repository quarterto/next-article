'use strict';

var ft = require('ft-api-client')(process.env.apikey),
    themes = ['SCOTTISH INDEPENDENCE', 'FALLING UK INFLATION', 'THE WAR AGAINST ISIS', 'EUROPEAN CENTRAL BANK RATES', 'EPA CARBON RULING', 'THE CRISIS IN UKRAINE'],
    _ = require('lodash');



    var themes_article = [];

function processArticle(theme) {
  return function (articles) {
    theme.articles = articles;
  };
}
function processError(err) {
  console.log(err);
}

module.exports = {

    get: function() {
        return themes_article;
    },

    init: function() {


      for (var i = 0, l = themes.length; i < l; i += 1) {
        var theme = themes[i];
        // console.log('theme: ', theme);

        var index = themes_article.push({
          name: theme
        });

        ft
        .search(decodeURI(theme), 3)
        .then(processArticle(themes_article[index-1]), processError);
      }
    }
};
