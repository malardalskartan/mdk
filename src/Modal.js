var modal = (function($){

  var object = {
    init: function(){
        this.bindUIActions();
    },
    bindUIActions: function() {
    	settings.shareButton.click(function() {
    		ShareMap.createModal();
        MapMenu.toggleMenu();
    	});
    },
    createModal: function() {
      var modal = '<div id="modal">' +
                    '<div class="modal-screen"></div>' +
                    '<div class="modal">' +
                    '<div class="modal-close-button"></div>' +
                    '<div class="modal-title">Länk till karta</div>' +
                    '<div class="modal-content">' +
                    '<div class="share-link"><input type="text"></div>' +
                    '<i>Kopiera och klistra in länken för att dela kartan.</i>' +
                    '</div>' +
                    '<div></div>' +
                    '</div>' +
                    '</div>';
      //$('#map').prepend(modal);
      $('.modal-screen, .modal-close-button').click(function() {
        ShareMap.closeModal();
      });              
    },
    closeModal: function() {
      $('#modal').remove();
    }
  };
  return object;
})(jQuery);	