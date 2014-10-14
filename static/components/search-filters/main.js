function init(){
    var component = document.querySelector('.search-filters');

    component.addEventListener('click', function(e){
        if(e.target.nodeName === 'H1'){
            component.classList.toggle('open');
        }else if(e.target.nodeName === 'H2'){
            e.target.parentNode.classList.toggle('open');
        }
    });
}

init();