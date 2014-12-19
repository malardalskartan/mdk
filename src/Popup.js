/* ========================================================================
 * Copyright 2014 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var Popup = (function($){

  return {
    init: function(target){
        var pop = '<div id="popup">' +
                    '<div class="popup">' +
                    '<div class="close-button"></div>' +
                    '<div class="popup-title"></div>' +
                    '<div class="popup-content"></div>' +
                    '</div>' +
                  '</div>';      
        $(target).append(pop);
        this.bindUIActions();
    },
    bindUIActions: function() {
      var that = this;
      $('#popup .popup .close-button').on('touchend click', function(evt) {
        that.closePopup();
        evt.preventDefault();
      });   
    },    
    setVisibility: function(visible) {
      visible == true ? $('#popup .popup').css('display', 'block') : $('#popup .popup').css('display', 'none');
    },
    setContent: function(config) {
      config.title ? $('#popup .popup .popup-title').html(config.title): $('#popup .popup .popup-title').html('');
      config.content ? $('#popup .popup .popup-content').html(config.content): $('#popup .popup .popup-content').html('');            
    },
    closePopup: function() {
      this.setVisibility(false);
    }    
  };
})(jQuery);	