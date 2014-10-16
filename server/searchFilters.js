function setToMidnight(d){
    d.setSeconds(0);
    d.setMinutes(0);
    d.setHours(0);
    return d;
}

function setToBeginningOfWeek(d){
    var day = d.getDay();
    d.setDate(d.getDate() - day);
    return setToMidnight(d);
}

function setToBeginningOfMonth(d){
    d.setDate(1);
    return setToMidnight(d);
}

function setToBeginningOfYear(d){
    d.setMonth(0,1);
    return setToMidnight(d);
}

function getDateConstant(val){
    return getDateConstantValue(DateConstants[getDateConstantName(val)]);
}

function getDateConstantValue(d){
    var isoString =  d.toISOString();
    return isoString.slice(0, isoString.length-5) + 'Z';
}

function getDateConstantName(val){
    var date = new Date(val);
    for(var d in DateConstants){
        if(DateConstants[d] === date){
            return d;
        }
    }
}

var DateConstants = {
    'Today' : setToMidnight(new Date()),
    'This Week' : setToBeginningOfWeek(new Date()),
    'This Month' : setToBeginningOfMonth(new Date()),
    'This Year' : setToBeginningOfYear(new Date())
};

function Filter(name, value){
    this.name = name;
    this.value = value;
    this.title = [name[0].toUpperCase(), name.slice(1)].join('');
    this.isDate = name.indexOf('Date') > 1;
    this.text = value;
    this.removeurl = '';
}

Filter.prototype.toUrl = function toUrl(){
    return this.name + ':' + this.value;
};

function SearchFilters(req){
    this.path = req.path;
    this.query = (function(){
       var obj = {};
        Object.keys(req.query).forEach(function(key){
           if(key !== 'f'){
               obj[key] = req.query[key];
           }
        });
        return obj;
    });
    this.filters = this.parseFilterQuery(req.f);
}

SearchFilters.prototype.parseFilterQuery = function parseFilterQuery(q){
    var filters = [],
        searchFilters = this;

    if(!q){
        return filters;
    }

    q = decodeURI(q);
    q.split('AND').forEach(function(item){
        var name = item.slice(0, item.indexOf(':')),
            value = item.slice(item.indexOf(':')+1),
            filter = new Filter(name, value);

        if(filter.isDate){
            filter.title = 'Date';
            filter.text = getDateConstantName(value);
        }

        filter.removeurl = searchFilters.getURLWithout.call(searchFilters, name);

        filters.push(filter);
    });

    return filters;
};

SearchFilters.prototype.buildURL = function buildURL(f){
    var url = path + '?';
    Object.keys(this.query).forEach(function(key){
       url += key + '=' + this.query[key];
    });

    url += 'f=' + f;
    return url;

};

SearchFilters.prototype.getURLWithout = function getURLWithout(filterName){
    var f = [];
    this.filters.forEach(function(filter){
        if(filter.name !== filterName ){
            f.push(filter.name + ':' + filter.value);
        }
    });

    return this.buildURL(f.join(' AND '));
};

SearchFilters.prototype.getURLWith = function(name, value){
    var f = [];
    this.filters.forEach(function(filter){
        f.push(filter.name + ':' + filter.value);
    });
    f.push(name + ':' + value);

    return this.buildURL(f.join(' AND '));
};

module.exports = SearchFilters;