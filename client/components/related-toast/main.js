'use strict';

var appendToast = () => {
    var toastEl = document.createElement('div');
    toastEl.className = 'article__toast article__toast--hide';
    toastEl.innerHTML =
        `<div class="o-grid-row">
            <div class="o-grid-remove-gutters" data-o-grid-colspan="1">
                <h2>Read next</h2>
            </div>
            <div data-o-grid-colspan="8">
                <ol class="o-grid-row">
                    <li data-o-grid-colspan="5">
                        <a href="" data-trackable="related">
                            <h3>Wall Street</h3>
                            <img src="https://next-geebee.ft.com/image/v1/images/raw/ftcms%3A64375be4-4b0b-11e5-b558-8a9722977189?source=next&fit=scale-down&width=131" />
                            <p>Kerry wins opposition presence at Syria talks</p>
                        </a>
                    </li>
                    <li data-o-grid-colspan="5 offset1">
                        <a href="" data-trackable="related">
                            <h3>NYSE</h3>
                            <img src="https://next-geebee.ft.com/image/v1/images/raw/ftcms%3A64375be4-4b0b-11e5-b558-8a9722977189?source=next&fit=scale-down&width=131" />
                            <p>Kerry wins opposition presence at Syria talks</p>
                        </a>
                    </li>
                 </ol>
             </div>
             <div class="o-grid-remove-gutters" data-o-grid-colspan="3">
                <a href="" class="article__toast__to-related" data-trackable="to-related">See more</a>
             </div>
         </div>`;
    document.body.appendChild(toastEl);
    return toastEl;
};

module.exports = {

    init: flags => {
        // append
        var toastEl = appendToast();
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
    }

};
