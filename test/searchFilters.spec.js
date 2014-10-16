var SearchFilters = require('../server/searchFilters.js');
var expect = require('chai').expect;

describe('SearchFilters', function(){

    var searchFilters;

    var requestStub = {
        path : '/path',
        query : {
            q : 'SearchTerm',
            f : 'regions:Bulgaria AND initialPublishDateTime:>' + SearchFilters.getDateConstantValue('Today')
        }
    };

    beforeEach(function(){
        searchFilters = new SearchFilters(requestStub);
    });

    it('Should accept an express Request object on instantiation', function(){

        expect(searchFilters).to.be.an.instanceof(SearchFilters);
    });

    it('Should save the path and other query params', function(){
        expect(searchFilters.path).to.equal(requestStub.path);
    });

    it('Should parse the f param and save a list of Filter objects', function(){
        var filters = searchFilters.filters;

        expect(filters.length).to.equal(2);
        expect(filters[0].name).to.equal('regions');
        expect(filters[0].value).to.equal('Bulgaria');
    });

    it('Should replace the text for dates with something readable', function(){
        var filter = searchFilters.filters[1];

        expect(filter.text).to.equal('Today');
    });

    it('Should be able to return a url without a given filter', function(){
        var url = searchFilters.getURLWithout('regions');

        expect(url).to.equal(requestStub.path + '?q=' + requestStub.query.q + '&f=initialPublishDateTime:>' + SearchFilters.getDateConstantValue('Today'));
    });

    it('Should be able to return a url with a passed filter included', function(){
        var url = searchFilters.getURLWith('people', 'Obama');
        var expectedURL = requestStub.path + '?q=' + requestStub.query.q + '&f=' + requestStub.query.f + ' AND people:Obama';
        expect(url).to.equal(expectedURL);
    });

    it('Should add the correct removeurl to each filter', function(){
        var filters = searchFilters.filters;

        expect(filters[0].removeurl).to.equal(searchFilters.getURLWithout(filters[0].name));
        expect(filters[1].removeurl).to.equal(searchFilters.getURLWithout(filters[1].name));
    });

});