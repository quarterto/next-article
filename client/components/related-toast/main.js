'use strict';

var throttle = require('../../libs/throttle');

var appendToast = (article, topic) => {
    var toastTmplEl = document.createElement('div');
    toastTmplEl.classList.add('article__toast');
    toastTmplEl.innerHTML =
        `<div class="article__toast__inner o-grid-row">
            <div class="article__toast__header o-grid-remove-gutters" data-o-grid-colspan="1">
                <h2>Read next</h2>
            </div>
             <div class="article__toast__link o-grid-remove-gutters" data-o-grid-colspan="3">
                <a href="#related" class="article__toast__to-related js-to-related" data-trackable="to-related">See more</a>
             </div>
         </div>`;
    var articleEl = document.createElement('div');
    articleEl.setAttribute('data-o-grid-colspan', 8);
    articleEl.innerHTML =
        `<a href="${article.link}" data-trackable="related">
            <h3>${topic}</h3>
            <p>${article.title}</p>
        </a>`;
    toastTmplEl.querySelector('.article__toast__inner')
        .insertBefore(articleEl, toastTmplEl.querySelector('.article__toast__link'));

    // fixed toast
    var fixedToastEl = toastTmplEl.cloneNode(true);
    fixedToastEl.classList.add('article__toast--hide');
    fixedToastEl.classList.add('article__toast--fixed');
    document.body.appendChild(fixedToastEl);

    // in page toast
    var inPageToastEl = toastTmplEl.cloneNode(true);
    inPageToastEl.id = 'related';
    inPageToastEl.classList.add('article__toast--in-page');
    var moreOnEl = document.querySelector('.article-share').nextSibling;
    moreOnEl.parentNode.insertBefore(inPageToastEl, moreOnEl);
    return fixedToastEl;
};


var addToRelatedHandler = toastEl => {
    const duration = 1000;
    // https://gist.github.com/gre/1650294
    var easeFunction = t => 1 - (--t) * t * t * t;
    var handler = ev => {
        ev.preventDefault();
        ev.stopPropagation();

        var scrollFrom = document.body.scrollTop;
        var scrollDist = document.querySelector(ev.target.getAttribute('href')).getBoundingClientRect().top;
        var startTime = new Date();
        var interval = window.setInterval(() => {
            var elapsed = new Date() - startTime;
            document.body.scrollTop = scrollFrom + (easeFunction(elapsed / duration) * scrollDist);
        }, 15);

        window.setTimeout(() => {
            window.clearInterval(interval);
            window.location.hash = ev.target.getAttribute('href');
        }, duration);
    };

    toastEl.querySelector('.js-to-related').addEventListener('click', handler);
};

module.exports = {

    init: flags => {
        if (!flags.get('articleRelatedToast')) {
            return;
        }
        // get related articles
        var articleUuid = document.querySelector('#site-content').getAttribute('data-content-id');
        fetch(`/article/${articleUuid}/more-on?metadata-fields=primaryTheme&count=1`)
            .then(result => {
                if (!result.ok) {
                    throw new Error('Error getting related');
                }
                return result.text();
            })
            .then(relatedHtml => {
                var relatedEl = document.createElement('div');
                relatedEl.innerHTML = relatedHtml;
                var topic = relatedEl.querySelector('.n-topic__name').textContent;
                var articleEl = relatedEl.querySelector('.more-on__article');
                var article = {
                    title: articleEl.querySelector('.n-card__headline').textContent,
                    link: articleEl.querySelector('.n-card__headline__link').getAttribute('href')
                };
                // append
                var toastEl = appendToast(article, topic);
                // to related handler
                addToRelatedHandler(toastEl);
                // get height of article
                var articleBodyEl = document.querySelector('.article__body');
                var articleBodyHalfwayPoint = articleBodyEl.offsetHeight / 2;
                var seen = false;
                var throttledHandler = ev => {
                    // display when half way down article
                    var pos = articleBodyEl.getBoundingClientRect().bottom - window.innerHeight;
                    if (pos < articleBodyHalfwayPoint || seen) {
                        seen = true;
                        toastEl.classList.remove('article__toast--hide');
                    } else {
                        toastEl.classList.add('article__toast--hide');
                    }
                    var toastPos = Math.max(window.innerHeight - document.querySelector('.article__toast--in-page').getBoundingClientRect().bottom, 0);
                    toastEl.style.bottom = `${toastPos}px`;
                    if (toastPos > 0) {
                        toastEl.classList.add('article__toast--fixed-in-page');
                    } else {
                        toastEl.classList.remove('article__toast--fixed-in-page');
                    }
                };
                window.addEventListener('scroll', throttledHandler);
            })
            .catch(console.log);
    }

};
