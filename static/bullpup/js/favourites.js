
// THIS WHOLE THING IS A CAR CRASH AND NEEDS TO BE SORTED OUT

window.addEventListener('DOMContentLoaded', function (evt) {

    var $ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    };


    var emit = function(name, data) {
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
        if (data) {
            event.detail = data;
        }
        top.document.dispatchEvent(event);
    };


    var contextKey = 'ft.stream.context.url';
    var contextTitleKey = 'ft.stream.context.display';

    var path = localStorage.getItem(contextKey);
    var displayText = localStorage.getItem(contextTitleKey);

    reqwest({
        url: '/user-preferences', 
        crossOrigin: true
    }).then(function (res) {
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

            document.documentElement.classList.add('has-user-preferences');
            document.documentElement.classList.add('has-context');
        });
    });

    $('.save__button').map(function (el) {
        el.addEventListener('click', function (evt) {
            emit('favourite:add', { uuid: path, path: path, displayText: displayText});
        });
    });

});


