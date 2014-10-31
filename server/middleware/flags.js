var Flags = require('next-feature-flags-client');
var flagsNamespace = (process.env.FLAGS) ? process.env.FLAGS : 'production';
var flags = new Flags('http://ft-next-api-feature-flags.herokuapp.com/' + flagsNamespace);

module.exports = function (req, res, next) {
    if (res.ft.viewData) {
        res.ft.viewData.flags = flags.get();
    }
    next();
};