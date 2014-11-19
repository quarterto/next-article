var flags = window.FT.flags;

require('next-wrapper')();
require('next-actions-component');
require('next-article-card-component');
require('./components/context');
if (flags.contentApiCalls.isSwitchedOn) {
    require('./components/more-on/main');
    require('./components/on-this-topic/main');
}

if (flags.marketData.isSwitchedOn) {
    require('./components/live-prices/main');
}

if (flags.video.isSwitchedOn) {
    require('./components/video');
}

