
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

    var streamPath = localStorage.getItem(contextKey);
    var streamName = localStorage.getItem(contextTitleKey);




    reqwest({
        url: '/user-preferences', 
        crossOrigin: true
    }).then(function (res) {
        $('.js-user-preferences__container').map(function (el) {
            var myTag = document.createElement('div');
            myTag.innerHTML = res;
            el.appendChild(myTag); 
            //scripts wont execute, so grab them and append to head
            var scripts = myTag.querySelectorAll('script');
            [].slice.call(scripts).map(function(script) {
                var s = document.createElement('script');
                if(script.src) {
                    s.src = script.src;
                } else {
                    s.innerHTML = script.innerHTML;
                }
                document.head.appendChild(s);
            });

            document.documentElement.classList.add('has-user-preferences');
            document.documentElement.classList.add('has-context');
        });
    });


    function toggle(key, data, saveBtn) {
        var isSaved = (saveBtn.getAttribute('data-is-saved') === "true");
        if(isSaved) {
            emit(key + ':remove', data);
        } else {
            emit(key + ':add', data);
        }

        toggleButtonState(saveBtn);

    }

    function toggleButtonState(saveBtn) {
        var isSaved = (saveBtn.getAttribute('data-is-saved') === "true");
        var existingText = saveBtn.textContent.trim();
        saveBtn.textContent = saveBtn.getAttribute('data-toggle-text');
        saveBtn.setAttribute('data-toggle-text', existingText);
        saveBtn.setAttribute('data-is-saved', isSaved ? 'false' : 'true');

    }


    //On click of save buttons, trigger the add/remove event and update the UI of the button
    $('.js-save__button[data-save-target="favourites"]').map(function (el) {
        el.addEventListener('click', function (evt) {
            var data = { 'uuidv3': streamPath, 'displayText': streamName};
            toggle('favourites', data, el);
        });
    });

    $('.js-save__button[data-save-target="forlaters"]').map(function (el) {
        el.addEventListener('click', function (evt) {
            var headline = this.parentElement.getElementsByClassName('article-card__link')[0];
            var data = {'uuidv3': headline.getAttribute('href'), 'displayText': headline.textContent.trim()};
            toggle('forlaters', data, el);
        });
    });


    //On page load, just update the UI of the button
    document.addEventListener('favourites:load', function(evt) {
        $('.js-save__button[data-save-target="favourites"]').map(function (el) {
            var isSaved = evt.detail.exists(streamPath);
            if(isSaved) {
                toggleButtonState(el);
            }
        });
    });
    document.addEventListener('forlaters:load', function(evt) {
        $('.js-save__button[data-save-target="forlaters"]').map(function (el) {
            var headline = el.parentElement.getElementsByClassName('article-card__link')[0];
            var isSaved = evt.detail.exists(headline.getAttribute('href'));
            if(isSaved) {
                toggleButtonState(el);
            }
        });
    });
});


