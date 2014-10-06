/* ========================================================================
 * Copyright 2014 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var Print = (function($){

  var settings = {
      printButton: $('#print-button'),
      printWith: 800
  };

  var map = Viewer.getMap();

  return {
    init: function(){

      this.bindUIActions();
    },
    bindUIActions: function() {
        settings.printButton.on('touchend click', function(e) {
          Print.exportPng();
          e.preventDefault();
        });
    },
    exportPng: function() {
      var canvas = $('canvas');
      var image = new Image();      
      image.crossOrigin = 'Anonymous';      
      image.src = canvas.get(0).toDataURL("image/png");
      var copyCanvas = $('#temp');
      var drawCanvas = copyCanvas[0].getContext('2d')
      var sourceWidth = canvas[0].width;
      copyCanvas.attr('width', settings.printWith);
      copyCanvas.attr('height', settings.printWith);
      var sourceWidth = canvas[0].width;        
      var destinyWidth = sourceWidth >= 800 ? 800 : sourceWidth;
      var height = sourceWidth * canvas[0].height/sourceWidth;      
      drawCanvas.drawImage(image, (sourceWidth/2 - destinyWidth/2), 0, destinyWidth, settings.printWith, 0, 0, settings.printWith, settings.printWith);

      var imageCrop = new Image();
      imageCrop.src = copyCanvas.get(0).toDataURL("image/png");
      var printWindow = window.open('','','width=800,height=800');
      printWindow.document.write('<img src="' + imageCrop.src + '"/>');
      printWindow.document.close();      
      printWindow.print();
      printWindow.document.close();

    }
  };
})(jQuery); 