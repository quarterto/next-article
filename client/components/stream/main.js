

(function () {

    var emit = function(name, data) {
        // console.log('emitting', name, data);
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
        if (data) {
            event.detail = data;
        }
        top.document.dispatchEvent(event);
    };

    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    function findAncestorByClassName (el, cls) {
        while ((el = el.parentNode) && !hasClass(el, cls)) {
            return el;    
        }
    }

    var $ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    };

    // Reload the stream when an index:open event is fired
    document.addEventListener('index:open', function (e) {
        location.href = '/stream/' + e.detail.stream;
    });

    document.addEventListener('index:capi', function (e) {
        window.location.hash = '#capi-' + e.detail.capi;
    });

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
        if (hasClass(el, name)) removeClass(el, name);
        else addClass(el, name);
    }

    /* Allow all articles to be opened inline */
    //TODO: this will interact with single-article toggle below;
    //needs a refactor when re-implemented
    $('.article-card__more.js-toggle').map(function (el) {
        el.addEventListener('click', function (evt) {
            toggleClass(el, 'js-active');
            el.textContent = hasClass(el, 'js-active') ? 'Close' : 'Open';
            var target = this.getAttribute('data-toggle');
            $(target).map(function (elm) {
                toggleClass(elm, 'js-show');
            });
        });
    });

    /* Allow single article to be opened inline */
    $('.article-card__expand.js-toggle').map(function (el) {
        el.addEventListener('click', function (evt) {
            evt.preventDefault();
            var target = this.getAttribute('data-toggle'),
                article = findAncestorByClassName(el, target),
                icon = el.querySelector('i')
                ;
            toggleClass(icon, 'icon-arrow-up');
            toggleClass(icon, 'icon-arrow-down');
            toggleClass(article.querySelector(target), 'js-show');
        });
    });
    
    var tracks = $('.article-card__headline');

    function isElementInViewport (el) {
        var rect = el.getBoundingClientRect();
        return (

            // FIXME is 25% from the top
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
            rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
            );
    }

    var readable = function() {
        // Return the ID of the uppermost headline in the viewport
        var inView = tracks.filter(function (el) {
            return isElementInViewport(el);
        }).map(function (el) {
            return el.parentNode.id;
        })[0];

        if (inView && inView.length > 0) {
            emit('stream:inview', { capi: inView  } );
        }
    };

    window.onscroll = debounce(readable, 5, false);

})();
