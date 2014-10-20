
// THIS WHOLE THING IS A CAR CRASH AND NEEDS TO BE SORTED OUT

window.addEventListener('DOMContentLoaded', function (evt) {

    var $ = function (selector) {
        return [].slice.call(document.querySelectorAll(selector));
    };

    var onArticle = function (path) {
        return /^\/[a-f0-9]+-(.*)/.test(path); // '27a5e286-4314-11e4-8a43-00144feabdc0'; 
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

    function stripLeadingSlash(path) {
        return path.replace(/^\/|\/$/g, '');
    }

    //On click of save buttons, trigger the add/remove event and update the UI of the button
    $('.js-save__button[data-save-target="favourites"]').map(function (el) {
        el.addEventListener('click', function (evt) {
            var data = { 'uuidv3': streamPath, 'displayText': streamName, 'resourceType': 'stream'};
            toggle('favourites', data, el);
        });
    });

    $('.js-save__button[data-save-target="forlaters"]').map(function (el) {
        el.addEventListener('click', function (evt) {
            var headline = this.parentElement.getElementsByClassName('article-card__link')[0];
            var data = {
                'uuidv3': stripLeadingSlash(headline.getAttribute('href')), //remove leading slash 
                'displayText': headline.textContent.trim(), 
                'resourceType': 'article' //Fix to article for now
            };
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
            var isSaved = evt.detail.exists(stripLeadingSlash(headline.getAttribute('href')));
            if(isSaved) {
                toggleButtonState(el);
            }
        });
    });

    function saveHistory() {
        var data, headline;
        if(onArticle(location.pathname)) {
            headline = document.querySelector('.article-card__headline .article-card__link');
            data = {
                'uuidv3': stripLeadingSlash(headline.getAttribute('href')), //remove leading slash 
                'displayText': headline.textContent.trim(), 
                'resourceType': 'article' //Fix to article for now
            };
        } else {
            data = { 'uuidv3': streamPath, 'displayText': streamName, 'resourceType': 'stream'};
        }
        emit('history:add', data);
    }

    document.addEventListener('history:load', saveHistory);

});


