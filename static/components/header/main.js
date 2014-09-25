
(function () {
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

    // Attach the trigram to the context menu (to show/hide on mobile)
    $('.icon__trigram').map(function (el) {
        el.addEventListener('click', function (button) {
            $('.context__container').map(function (index) {
                toggleClass(index, 'show');
            })
        })
    })
    
    // Attach the splash/front to the Finacial Times logo
    $('.home__label').map(function (el) {
        el.addEventListener('click', function (button) {
            $('.splash__container').map(function (splash) {
                
                toggleClass(document.body, 'splash-on');
                toggleClass(splash, 'show');
                if (hasClass(splash, 'show')) {
                    setTimeout( function () { 
                        window.scrollTo(0, 0);
                    }, 100)
                }
            })
        })
    })

})()   
