var Raven = require('raven-js').Raven;

Raven.config('https://1430704766a840b4b36133662324f489@app.getsentry.com/32283', {
    whitelistUrls: ['next.ft.com/grumman/']
}).install();

// require('./components/auth');
require('es6-promise').polyfill();
require('next-header');
require('next-actions-component');
require('./components/context');
require('./components/more-on/main');
require('./components/live-prices/main');
require('./components/video');

