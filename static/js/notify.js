
var Notify = function (message) {
    this.template = '<div class="message__container">' + message.text +'</div>';
    this.message = message;
}

Notify.prototype.tell = function () {
    
    var box = document.createElement('div');
    box.innerHTML = this.template; 

    document.body.appendChild(box);
   
    console.log(this.message);

    // Acknowledge
    box.addEventListener('click', function () {
        box.parentNode.removeChild(box)
    })

}
