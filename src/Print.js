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
          $('#app-wrapper').append('<canvas id="print" style="display: none"></canvas>');
          Print.createImage();
          e.preventDefault();
        });
    },
    imageToPrint: function(copyCanvas) {
      var imageCrop = new Image();
      try {
        imageCrop.src = copyCanvas.get(0).toDataURL("image/png");
      }
      catch (e) {
        console.log(e);
      }
      finally {
        var printWindow = window.open('','','width=800,height=820');
        printWindow.document.write('<body style="margin: 0;"><img src="' + imageCrop.src + '"/><p>&copy Lantmäteriet Geodatasamverkan</p></body>'); 
        printWindow.document.close();   
        printWindow.print();
        setTimeout(function(){
          printWindow.close();
          $('#print').remove();
        }, 10); 
      }
    },
    createImage: function() {
      var canvas = $('canvas');
      var image = new Image();
      // image.crossOrigin = 'Anonymous';

      try {
        var imageUrl = canvas.get(0).toDataURL("image/png");        
      }
      catch (e) {
        console.log(e);
      }
      finally {
        var copyCanvas = $('#print'); 
        image.onload = function() {
          var ctxCanvas = copyCanvas[0].getContext('2d');
          var sourceWidth = canvas[0].width;
          copyCanvas[0].width = settings.printWith;
          copyCanvas[0].height = settings.printWith;
          var sourceWidth = canvas[0].width;        
          var destinyWidth = sourceWidth >= 800 ? 800 : sourceWidth;
          var height = sourceWidth * canvas[0].height/sourceWidth; 
          ctxCanvas.drawImage(image, (sourceWidth/2 - destinyWidth/2), 0, settings.printWith, settings.printWith, 0, 0, settings.printWith, settings.printWith);       
          Print.imageToPrint(copyCanvas);  
        };    
        image.src = imageUrl;      
      }
    }
  };
})(jQuery); 