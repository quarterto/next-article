
var flags = window.FT.flags;
var Beacon = require('next-beacon-component');

require('next-wrapper')();
require('next-user-preferences');
require('next-article-card-component');

if (flags.contentApiCalls.isSwitchedOn) {
    require('./components/more-on/main');
}

if (flags.beacon.isSwitchedOn) {

    // fire a beacon after 5s of being on the page
    setTimeout(function () {
        Beacon.fire('click', {
            uuid: location.pathname.slice(1)
        });
    }, 5000);

}
