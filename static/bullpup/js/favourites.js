
// THIS WHOLE THING IS A CAR CRASH AND NEEDS TO BE SORTED OUT

window.addEventListener('DOMContentLoaded', function (evt) {

    // "http://localhost:3001/search?q=authors:%22Richard%20McGregor%22"

    function setContext(path, display) {
        localStorage.setItem(contextKey, path);
        localStorage.setItem(contextTitleKey, display);
    }
    var onArticle = function (path) {
        return /^\/[a-f0-9]+-(.*)/.test(path); // '27a5e286-4314-11e4-8a43-00144feabdc0'; 
    };

    var $ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    };


    
    var contextKey = 'ft.stream.context.url';
    var contextTitleKey = 'ft.stream.context.display';
    var display, headline, context;

    /* 1. in stream mode store the context URL and content display name */
    if (!onArticle(location.pathname)) {
        // Every time you hit a new stream, you enter a new context
        context = location.pathname + location.search;
        display = document.getElementsByClassName('ft-header-context')[0].textContent.trim();
        setContext(context, display);
        localStorage.setItem(contextTitleKey, display);
    } else {
        context = localStorage.getItem(contextKey);
        display = localStorage.getItem(contextTitleKey);
        if(!context) { 
            //If they come directly to an article with no history, use the first theme for this article
            context = document.querySelector('.article-card__themes a').getAttribute('href');
            display = document.querySelector('.article-card__themes a').textContent.trim();
            setContext(context, display);
        }
    }

    /* 2. in article view render the context menu full mode */    
    if (onArticle(location.pathname) && context) {
        $('.ft-header-context').map(function (el) {
            el.innerHTML = localStorage.getItem(contextTitleKey);
        });

    }

    reqwest({
        url: '/context' + context, 
        crossOrigin: true, 
        success: function (res) {
            $('.context__container').map(function (el) {
                var myTag = document.createElement('div');
                myTag.innerHTML = res;
                el.appendChild(myTag); 
                //scripts wont execute, so grab them and append to head
                var scripts = myTag.querySelectorAll('script');
                [].slice.call(scripts).map(function(script) {
                    var s = document.createElement('script');
                    s.src = script.src;
                    document.head.appendChild(s);
                });

                document.documentElement.className += ' has-context';
            });
        }
    });

    /* Record each ARTICLE a user has looked at */

    var history = new Me('history');
    


    headline = document.getElementsByClassName('article-card__headline')[0];
    if(headline) {
        headline = headline.textContent.trim();
    }

    if (onArticle(location.pathname)) {
        history.add(location.pathname, headline);
    }

    /* Record each STREAM a user has looked at */

    var fav = new Me('favourites');

    $('.save__button').map(function (el) {
        el.addEventListener('click', function (evt) {
            fav.add(context, display);
            document.querySelector('[data-list-source="favourites"] .stream-list__content' ).innerHTML = fav.render();
        });
    });

});