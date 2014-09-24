
    var emit = function(name, data) {
        console.log('emitting', name)
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
        if (data) {
            event.detail = data;
        }
        document.dispatchEvent(event);
    }

   var $ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    }

    function hasClass(el, name) {
        return new RegExp('(\\s|^)'+name+'(\\s|$)').test(el.className);
    }

    function addClass(el, name) {
        if (!hasClass(el, name)) { el.className += (el.className ? ' ' : '') +name; }
    }

    function removeClass(el, name) {
        if (hasClass(el, name)) {
            el.className=el.className.replace(new RegExp('(\\s|^)'+name+'(\\s|$)'),' ').replace(/^\s+|\s+$/g, '');
        }
    }
    
    function toggleClass(el, name) {
        (hasClass(el, name)) ? removeClass(el, name) : addClass(el, name);
    }
    
    document.addEventListener('stream:inview', function (e) {
        var f = '[data-capi-id="' + e.detail.capi.replace('capi-', '') + '"]'
        
        $('.stream-list__item').map(function (el) {
            removeClass(el, 'scrollspy-on')
        });

        $(f).map(function (el) {
            addClass(el, 'scrollspy-on')
        });
    });
 
    // Toggle the streams open and closed states
    $('.stream-list__label').map(function (el) {
        el.addEventListener('click', function (evt) {
            toggleClass(el, 'stream-list__label-active');
            
            var active = hasClass(el, 'stream-list__label-active') ? 'open' : 'close';
           
            if (hasClass(el, 'u-disabled')) return false;

            emit('index:' + active, {
               stream: el.getAttribute('data-stream')
            });
            
            var target = this.getAttribute('data-toggle');

            $(target).map(function (elm) {
                toggleClass(elm, 'u-show');
            })
        });        
    })
    
    // Listen for clicks to CAPI resources and emit event 
    $('.context').map(function (el) {
        el.addEventListener('click', function (item) {
            var hasId = !!item.target.getAttribute('data-capi-id');
            if (hasId) {
                emit('index:capi', { capi: item.target.getAttribute('data-capi-id') });
            }
        })

    });

window.addEventListener('DOMContentLoaded', function (evt) {

    // "http://localhost:3001/search?q=authors:%22Richard%20McGregor%22"

    var onArticle = function (path) {
        return /^\/[a-f0-9]+-(.*)/.test(path); // '27a5e286-4314-11e4-8a43-00144feabdc0'; 
    }
    
    var contextKey = 'ft.stream.context.url';
    var contextTitleKey = 'ft.stream.context.display';

    /* 1. in stream mode store the context URL and content display name */
    if (!onArticle(location.pathname)) {
        // Every time you hit a new stream, you enter a new context
        localStorage.setItem(contextKey, location.pathname + location.search);
        var display = document.getElementsByClassName('ft-header-context')[0]
        localStorage.setItem(contextTitleKey, display.innerText);
    }

    var context = localStorage.getItem(contextKey); 

    /* 2. in article view render the context menu full mode */    
    if (onArticle(location.pathname) && context) {
        
        $('.ft-header-context').map(function (el) {
            el.innerHTML = localStorage.getItem(contextTitleKey);
        })

        reqwest('/context' + context, function (res) {
            $('.contextual').map(function (el) {
                el.innerHTML = res;
            })
        })
    } else {
    
        /* 3. in stream view render the context menu in compact mode */
        reqwest('/context' + context + '&mode=stream', function (res) {
            $('.contextual').map(function (el) {
                el.innerHTML = res;
            })
        })
    }

    /* Record each steam a user has looked at */

    var history = new Me('history');
    
    if (!onArticle(location.pathname)) {
        var display = document.getElementsByClassName('ft-header-context')[0]
        history.add(location.pathname + location.search, display.textContent.trim());
    }

    document.getElementById('me-history').innerHTML = history.render();
    
    $('.clear__history').map(function (el) {
        el.addEventListener('click', function (evt) {
            history.reset();
            document.getElementById('me-history').innerHTML = history.render();
        });
    })

    /* */

    var fav = new Me('favourites');

    $('.save__button').map(function (el) {
        el.addEventListener('click', function (evt) {
            var display = document.getElementsByClassName('ft-header-context')[0]
            fav.add(location.pathname + location.search, display.textContent.trim());
            document.getElementById('me-fav').innerHTML = fav.render();
        })
    })
            
    $('.clear__fav').map(function (el) {
        el.addEventListener('click', function (evt) {
            fav.reset();
            document.getElementById('me-fav').innerHTML = fav.render();
        });
    })

    document.getElementById('me-fav').innerHTML = fav.render();

})

