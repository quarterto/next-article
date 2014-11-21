var flags = window.FT.flags;

require('next-wrapper')();
require('next-user-preferences');
require('next-article-card-component');
if (flags.contentApiCalls.isSwitchedOn) {
    require('./components/more-on/main');
}