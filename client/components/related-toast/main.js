'use strict';

var appendToast = (article, topic) => {
    var toastEl = document.createElement('div');
    toastEl.className = 'article__toast article__toast--hide';
    toastEl.innerHTML =
        `<div class="article__toast__inner o-grid-row">
            <div class="article__toast__header o-grid-remove-gutters" data-o-grid-colspan="1">
                <h2>Read next</h2>
            </div>
             <div class="article__toast__link o-grid-remove-gutters" data-o-grid-colspan="3">
                <a href="" class="article__toast__to-related" data-trackable="to-related">See more</a>
             </div>
         </div>`;
    var articleEl = document.createElement('div');
    articleEl.setAttribute('data-o-grid-colspan', 8);
    articleEl.innerHTML =
        `<a href="${article.link}" data-trackable="related">
            <h3>${topic}</h3>
            <p>${article.title}</p>
        </a>`;
    toastEl.querySelector('.article__toast__inner')
        .insertBefore(articleEl, toastEl.querySelector('.article__toast__link'));
    document.body.appendChild(toastEl);
    console.log(toastEl);
    return toastEl;
};

module.exports = {

    init: flags => {
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
                console.log('1');
                var relatedEl = document.createElement('div');
                console.log('2');
                relatedEl.innerHTML = relatedHtml;
                console.log('3');
                var topic = relatedEl.querySelector('.n-topic__name').textContent;
                console.log('4');
                var articleEl = relatedEl.querySelector('.more-on__article');
                console.log('5');
                var article = {
                    title: articleEl.querySelector('.n-card__headline').textContent,
                    link: articleEl.querySelector('.n-card__headline__link').getAttribute('href')
                };
                // append
                console.log('FOO');
                var toastEl = appendToast(article, topic);
                // get height of article
                var articleBodyEl = document.querySelector('.article__body');
                var articleBodyHalfwayPoint = articleBodyEl.offsetHeight / 2;
                window.addEventListener('scroll', ev => {
                    // display when half way down article
                    var pos = articleBodyEl.getBoundingClientRect().bottom - window.innerHeight;
                    if (pos < articleBodyHalfwayPoint && pos > 0) {
                        toastEl.classList.remove('article__toast--hide');
                    } else {
                        toastEl.classList.add('article__toast--hide');
                    }
                });
            })
            .catch(console.log);
    }

};
