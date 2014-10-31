var Flags = require('next-feature-flags-client');
var flagsNamespace = (process.env.FLAGS) ? process.env.FLAGS : 'production';
var flags = new Flags('http://ft-next-api-feature-flags.herokuapp.com/' + flagsNamespace);

exports.get = function () {
    return flags.get();
};