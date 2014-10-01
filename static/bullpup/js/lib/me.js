
// Stores a unique list of things (Eg, sections, favourites, history) against a
// key in localStorage

var Me = function (key) {
    if (!key) {
        throw new Error('You must supply a key /^[a-z]+$/');
    }
    this.key = 'ft.me.' + key;
};

Me.prototype.getOrCreate = function () {
    var exists = localStorage.getItem(this.key);
    if (exists) {
        return JSON.parse(exists);
    } else {
        var empty = { sections: [] };
        localStorage.setItem(this.key, JSON.stringify(empty));
        return empty;
    }
};

Me.prototype.save = function (obj) {
    console.log(obj);
    localStorage.setItem(this.key, JSON.stringify(obj)); 
};

Me.prototype.add = function (path, display, headline) {
    var current = this.getOrCreate();
    console.log(path, this.exists(path));
    if (!this.exists(path)) {
        current.sections.push({ path: path, display: display, headline: headline });
        return this.save(current);
    }
    return false;
};

Me.prototype.exists = function (path) {
    var current = this.getOrCreate();
    return current.sections.some(function (section) {
        return section.path === path;
    });
};

Me.prototype.reset = function () {
    return localStorage.removeItem(this.key);
};

Me.prototype.render = function (obj) {
    var history = this.getOrCreate();
    var links = history.sections.reverse().slice(0, 7).map(function (section) {
        return '<li class="stream-list__label"><a class="stream-list__label-inner" href="' + section.path + '">' + section.display + '</a></li>';
    }).join('');
    return '<ul class="stream-list">' + links + '</ul>';
};

/*
    var fav = new Me('favourites');
    fav.reset();
    fav.add('query', 'display');
    fav.add('query=1', 'display one');
    console.log(fav.exists('query'), fav.exists('nope'));
    console.log(fav.render());
*/


