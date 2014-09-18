
// Reload the stream when an index:open event is fired 
top.document.addEventListener('index:open', function (e) {
    location.href = '/stream/' + e.detail.stream;
});

// FIXME Anchor the viewport to a given article when selected
top.document.addEventListener('index:capi', function (e) {
    var el = document.getElementById('capi-' + e.detail.capi); 
    //window.scrollTo(0, el.offsetTop - el.scrollTop + el.clientTop);
});
