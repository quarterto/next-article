var flags = window.FT.flags;

require('next-wrapper')();
require('next-user-preferences');
require('next-article-card-component');
require('./components/context');
if (flags.contentApiCalls.isSwitchedOn) {
    require('./components/more-on/main');
}