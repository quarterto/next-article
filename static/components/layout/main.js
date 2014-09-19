
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

    $('.icon__trigram').map(function (el) {
        el.addEventListener('click', function (button) {
            $('.context__container').map(function (index) {
                toggleClass(index, 'show');
            })
        })
    })
    
    $('.button-splash').map(function (el) {
        el.addEventListener('click', function (button) {
            $('.splash__container').map(function (splash) {
                toggleClass(splash, 'show');
            })
        })
    })
