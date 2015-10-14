var lowercase = 'abcdefghijklmnopqrstuvwxyz';
var numbers = '0123456789';
var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
var specials = ":@-._~!$&'()*+,=;";
var salt = "jdui8b754ph73xy97d0ps8ueiyr654jj";
var dictionaryAsArray = (lowercase + numbers + uppercase + specials).split('');
var dictionary = arrayToObject(dictionaryAsArray);
var queryString = require('query-string');
var Cookies = require('cookies-js');

function dictionaryIndexesToString(dictionaryIndexes) {
    return dictionaryIndexes.map(dictionaryIndexToChar).join('');
}

function dictionaryIndexToChar(index) {
    return dictionary[index];
}

function formatAsUUID(string) {
    return string.replace(/([a-z0-9]{8})([a-z0-9]{4})([a-z0-9]{4})([a-z0-9]{4})([a-z0-9]{12})/, "$1-$2-$3-$4-$5");
}

function toArray(string) {
    return string.split('');
}

function dictionaryIndexes(string) {
    return toArray(string).map(positionWithinDictionary);
}

function positionWithinDictionary(character) {
    return dictionaryAsArray.indexOf(character)
}

function addOverArrays(a, b) { // zip -> map(reduce(sum))
    return a.map((x, index) => b[index] + x);
}

function subtractOverArrays(a, b) {
    return a.map((x, index) => x - b[index]);
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

function arrayToObject(arr) {
    return arr.reduce(function(o, v, i) {
      o[i] = v;
      return o;
    }, {});
}

function addInPairs(arr) {
    return arr.map(function(item, index) {
        if (index % 2 === 0) {
            if (arr[index + 1] != null) {
                return item + arr[index + 1];
            } else {
                return item;
            }
        }
    }).filter(x => x !== null || x !== undefined )
}

function removeHyphens(string) {
    return string.replace(/-/g,'');
}

function encrypt() {
    // probably want to check dam or subs to see if they can generate tokens still (they may have run out)
    var session = Cookies.get('FTSession')
    var sessionFormat = /\w{38}/;
    if (sessionFormat.test(session)) {
        console.log(localStorage['o-tracking-proper-id']);
        var user = removeHyphens(localStorage['o-tracking-proper-id']); // is this the user's uuid? (I think so)
        var article = removeHyphens(window.location.pathname.split('/')[2]); // is this safe? (will the path structure change?)

        var userDictionaryIndexes = dictionaryIndexes(user);
        var articleDictionaryIndexes = dictionaryIndexes(article);
        var saltDictionaryIndexes = dictionaryIndexes(salt);

        var tokenIndexes = addOverArrays(addOverArrays(userDictionaryIndexes, articleDictionaryIndexes), saltDictionaryIndexes)
        .map(a => a % 36)

        var code = dictionaryIndexesToString(tokenIndexes);

        history.pushState({}, '', window.location.pathname + '?share_code=' + encodeURI(code));
    }
}

function decrypt(code, article) {
    var codeDictionaryIndexes = dictionaryIndexes(code);
    var articleDictionaryIndexes = dictionaryIndexes(removeHyphens(article));
    var saltDictionaryIndexes = dictionaryIndexes(salt);

    var userDictionaryIndexes = subtractOverArrays(subtractOverArrays(codeDictionaryIndexes, saltDictionaryIndexes), articleDictionaryIndexes)
    .map(a => mod(a, 36));

    var user = formatAsUUID(dictionaryIndexesToString(userDictionaryIndexes));
    return user;
}

module.exports = {
    encrypt: encrypt,
    decrypt: decrypt
};