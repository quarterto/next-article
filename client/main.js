var Raven = require('raven-js').Raven;

Raven.config('https://1430704766a840b4b36133662324f489@app.getsentry.com/32283', {
    whitelistUrls: ['next.ft.com/dobi/']
}).install();

require('./components/auth');
require('next-header');
require('./components/context');
require('./components/save-button/main');
require('./components/more-on/main');
require('./components/live-prices/main');
require('./components/video');
require('./components/stream/main');

