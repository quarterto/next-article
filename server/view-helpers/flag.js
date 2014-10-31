'use strict';

var Flags = require('./utils/flags');

require('swig').setTag('flag', function (str, line, parser, types, options, swig) {
    var flags;
    parser.on('start', function () {
        flags = Flags.get();
    });
    parser.on(types.VAR, function (token) {
        var flag = token.match;
        var negate = false;
        
        if (flag.charAt(0) == '!') {
            negate = true;
            flag = flag.substr(1);
        }
        flag = flags[flag];

        var isOn = flag && flag.isSwitchedOn();
        this.out.push(negate ? !isOn : isOn);
    });
    return true;
}, function (compiler, args, content, parents, options, blockName) {
    if (args[0]) {
        return compiler(content, parents, options, blockName);
    } else {
        return ';';
    }
}, true, true);