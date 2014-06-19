/* ========================================================================
 * Copyright 2014 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var ShareMap = (function($){

  var settings = {
  		shareButton: $('#share-button'),
  };

  return {
    init: function(){
        this.bindUIActions();
    },
    bindUIActions: function() {
    	settings.shareButton.on('touchend click', function(e) {
    		ShareMap.createModal();
        MapMenu.toggleMenu();
        e.preventDefault();
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
      $('#map').prepend(modal);
      $('.modal-screen, .modal-close-button').on('touchend click', function(e) {
        ShareMap.closeOverlay();
        e.preventDefault();
      });
      this.createLink();               
    },
    closeOverlay: function() {
      $('#modal').remove();
    },
    createLink: function() {
      $('.share-link input').val(Viewer.getMapUrl());
    }
  };
})(jQuery);	