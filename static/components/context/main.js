
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
   
    // Toggle the streams open and closed states
    $('.stream-list__label').map(function (el) {
        el.addEventListener('click', function (evt) {
            toggleClass(el, 'stream-list__label-active');
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

    // List for clicks to streams and emit event
    $('.stream-list__label').map(function (el) {
        el.addEventListener('click', function (e) {
            emit('index:open', {
               stream: e.target.getAttribute('data-stream')
            });
        })
    });


    });

