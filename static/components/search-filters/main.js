function updateDateRange(index, dateRanges, button){
    var style;
    for(var i= 0, l=dateRanges.length; i<l; i++){
        style = i === index ? 'block' : 'none';
        dateRanges[i].style.display = style;
        if(style === 'block'){
            button.href = dateRanges[i].dataset.href;
        }
    }
}

function init(){
    var component = document.querySelector('.search-filters'),
        dateSlider = document.querySelector('.search-filters input[type="range"'),
        dateRanges = document.querySelectorAll('.search-filters ul.ranges li'),
        button = document.querySelector('.search-filters form a.button');

    component.addEventListener('click', function(e){
        if(e.target.nodeName === 'H1'){
            component.classList.toggle('open');
        }else if(e.target.nodeName === 'H2'){
            e.target.parentNode.classList.toggle('open');
        }
    });

    dateSlider.addEventListener('change', function(e){
        updateDateRange(e.target.value-1, dateRanges, button);
    });

    dateSlider.value = "1";
    updateDateRange(0, dateRanges, button);

}

init();