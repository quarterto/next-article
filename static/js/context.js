
// // THIS WHOLE THING IS A CAR CRASH AND NEEDS TO BE SORTED OUT

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
        display = document.getElementsByClassName('js-context')[0].textContent.trim();
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
        $('.js-context').map(function (el) {
            el.innerHTML = localStorage.getItem(contextTitleKey);
        });

    }

    /* 3. request and render the context navigation */
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

                document.documentElement.classList.add('has-context');
            });
        }
    });

});