'use strict';

var userAuthLevels = {
    ANONYMOUS: {
        code: 1,
        articleViews: 0,
        countdown: -1
    },
    EMAIL: {
        code: 2,
        articleViews: -1,
        countdown: 5 * 60 * 1000
    },
    REGISTERED: {
        code: 3,
        articleViews: 8,
        articelViewsResetInterval: 7 * 24 * 60 * 60 * 1000,
        countdown: -1
    },
    SUBSCRIBED: {
        code: 4,
        articleViews: -1,
        countdown: -1
    }
};

var pageAuthLevels = {
    'DENIED': 0,
    'ANONYMOUS_ALLOWED': 1,
    'EMAIL_ALLOWED': 2,
    'REGISTERED_ALLOWED': 3,
    'ALLOWED': -1
};

var pageAuthLevel = (location.search.match(/(\?|\&)authorization\=([A-Z]+)/) || [null, null])[1];
var userAuthLevel = localStorage.getItem('ft.next.user.auth.level') || 'SUBSCRIBED';


function addAuthToLinks () {

}    


function redirect() {
    // if (userAuthLevel !== 'SUBSCRIBED' && !pageAuthLevel) {
    //     location.href = location.origin + location.pathname + (location.search ? location.search + '&' : '?') + 'auth-level=' ;
    // }
}

if (userAuthLevel !== 'SUBSCRIBED') {

    document.querySelector('html').setAttribute('data-user-auth-level', userAuthLevel);


}


redirect();