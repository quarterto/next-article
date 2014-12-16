require('swig').setFilter('isAdSlot', function(input){
    return input === 3 || input%5 === 3;
});
