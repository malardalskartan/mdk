/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

/*requires Modal.js*/

var ShareMap = (function($){

  var settings = {
  		shareButton: $('#share-button')
  };

  return {
    init: function(){
        this.bindUIActions();
    },
    bindUIActions: function() {
      var that = this;
    	settings.shareButton.on('touchend click', function(e) {
        var modal = Modal('#map', {title: 'Länk till karta', content: that.createContent()});
        modal.showModal();
        that.createLink(); //Add link to input
        MapMenu.toggleMenu();
        e.preventDefault();
    	});
    },
    createContent: function() {
      return '<div class="share-link"><input type="text"></div>' +
                    '<i>Kopiera och klistra in länken för att dela kartan.</i>';              
    },
    createLink: function() {
      $('.share-link input').val(Viewer.getMapUrl());
    }
  };
})(jQuery);	