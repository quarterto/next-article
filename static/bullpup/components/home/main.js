(function () {
  console.log('home: ');

  $(function () {
    $('.pane-4').on('click', '.card', function (event) {
      event.stopPropagation();


      $(this).find('.themes_articles').show();

    });

    $('.pane-4').on('click', '.close', function (event) {
      event.stopPropagation();

      console.log('this: ', $('.themes_articles'));
      $('.themes_articles').hide();

    });


  });
    // ...
})();
