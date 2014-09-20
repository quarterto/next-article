  
var emit = function(name, data) {
    console.log('emitting', name)
    var event = document.createEvent('Event');
    event.initEvent(name, true, true);
    if (data) {
        event.detail = data;
    }
    top.document.dispatchEvent(event);
}
   
var $ = function (selector) {
    return [].slice.call(document.querySelectorAll(selector));
}

// Reload the stream when an index:open event is fired 
document.addEventListener('index:open', function (e) {
    location.href = '/stream/' + e.detail.stream;
});

document.addEventListener('index:capi', function (e) {
    window.location.hash = '#capi-' + e.detail.capi
});


emit('stream:loaded', { id: 123 });

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

$('.stream__container .js-toggle').map(function (el) {
    el.addEventListener('click', function (evt) {
        toggleClass(el, 'js-active');
        el.textContent = hasClass(el, 'js-active') ? 'Close' : 'Open';
        var target = this.getAttribute('data-toggle');
        $(target).map(function (elm) {
            toggleClass(elm, 'js-show');
        })
    });        
})
