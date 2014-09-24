
// Stores a unique list of things (Eg, sections, favourites, history) against a
// key in localStorage

var Me = function (key) {
    if (!key) {
        throw new Error('You must supply a key /^[a-z]+$/');
    }
    this.key = 'ft.me.' + key;
}

Me.prototype.getOrCreate = function () {
    var exists = localStorage.getItem(this.key);
    if (exists) {
        return JSON.parse(exists);
    } else {
        var empty = { sections: [] };
        localStorage.setItem(this.key, JSON.stringify(empty));
        return empty;
    }
}

Me.prototype.save = function (obj) {
    localStorage.setItem(this.key, JSON.stringify(obj)); 
}

Me.prototype.add = function (path, display) {
    var current = this.getOrCreate();
    if (!this.exists(path)) {
        current.sections.push( { path: path, display: display });
        return this.save(current);
    }
    return false;
}

Me.prototype.exists = function (path) {
    var current = this.getOrCreate();
    return current.sections.some(function (section) {
        return section.path === path;
    })
}

Me.prototype.reset = function () {
    return localStorage.removeItem(this.key);
}

Me.prototype.render = function (obj) {
    return this.getOrCreate();
}

/*
    var fav = new Me('favourites');
    fav.reset();
    fav.add('query', 'display');
    fav.add('query=1', 'display one');
    console.log(fav.exists('query'), fav.exists('nope'));
    console.log(fav.render());
*/


