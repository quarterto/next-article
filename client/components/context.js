var reqwest = require('../vendor/reqwest.min');

// "http://localhost:3003/search?q=authors:%22Richard%20McGregor%22"

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

var emit = function(name, data) {
    console.log('emitting', name, data);
    var event = document.createEvent('Event');
    event.initEvent(name, true, true);
    if (data) {
        event.detail = data;
    }
    top.document.dispatchEvent(event);
};

function extractSearchTerm(queryString) {
    return queryString.match(/q=([^&]*)/)[1];
}

var contextKey = 'ft.stream.context.url';
var contextTitleKey = 'ft.stream.context.display';
var display, context;

/* 1. in stream mode store the context URL and content display name */
if (!onArticle(location.pathname)) {
    // Every time you hit a new stream, you enter a new context
    context = extractSearchTerm(location.search);
    display = document.getElementsByClassName('js-context')[0].textContent.trim();
    setContext(context, display);
    localStorage.setItem(contextTitleKey, display);
    emit('stream:open', {id: context});
} else {
    context = localStorage.getItem(contextKey);
    display = localStorage.getItem(contextTitleKey);
    if(!context) { 
        //If they come directly to an article with no history, use the first theme for this article
        context = extractSearchTerm(document.querySelector('.article-card__themes a').getAttribute('href'));
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
    url: '/context/search?q=' + context, 
    crossOrigin: true, 
    success: function (res) {
        $('.js-context__container').map(function (el) {
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

