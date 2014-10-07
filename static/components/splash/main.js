(function() {
    $.get('/uber-nav', function(data) {
        $('.js-splash').html(data);
    });
})();
