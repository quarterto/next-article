'use strict';

var Flags = require('../utils/flags');

require('swig').setTag('flag', function (str, line, parser, types, options, swig) {
    var flags;
    parser.on('start', function () {
        flags = Flags.get();
    });
    parser.on(types.NOT, function (token) {
        this.out.push(token.match);
    });
    parser.on(types.VAR, function (token) {
        this.out.push(token.match);
        this.out.push(flags);
    });
    return true;
}, function (compiler, args, content, parents, options, blockName) {
    
    var negate = args[0] === '!';
    
    if (negate) { 
        args = args.slice(1);
    }
    
    var flag = args[0];
    var flags = args[1];
    var isOn = flags[flag] && flags[flag].isSwitchedOn();
    var willRender = negate ? !isOn : isOn;

    if (willRender) {
        return compiler(content, parents, options, blockName);
    } else {
        return ';';
    }
}, true, true);
