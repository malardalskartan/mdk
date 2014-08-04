/* ========================================================================
 * Copyright 2014 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var MapWindow = (function($){

  var settings = {
  		windowButton: $('#window-button button')
  };

  return {
    init: function(){
        this.createButton();
        this.bindUIActions();
    },
    bindUIActions: function() {
    	$('#window-button button').click(function() {
        $('#window-button button').blur();
    		MapWindow.openMapWindow();
    	});
    },
    createButton: function() {
      var button = '<div id="window-button" class="mdk-button"><button class="window-button"></button></div>';
      $('#map').append(button);
    },
    openMapWindow: function() {
      var url = Viewer.getMapUrl();   
      window.open(url);
    }
  };
})(jQuery);	