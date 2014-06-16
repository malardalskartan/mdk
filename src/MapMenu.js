var MapMenu = (function($){

  var settings = {
  		menuButton: $('#mapmenu-button button'),
      mapMenu: $('#mapmenu')
  };

  return {
    init: function(menuSettings){
        this.loadMenuItems(menuSettings);
        this.bindUIActions();
        this.addLegend();
    },
    bindUIActions: function() {
    	settings.menuButton.click(function() {
    		MapMenu.toggleMenu();
        settings.menuButton.blur();
    	});
    },
    loadMenuItems: function(menuSettings) {
      // for(var i=0; i<menuSettings.length; i++) {
      //   menuSettings[i].itemName.init();
      // }
    },
    toggleMenu: function() {
      if(settings.mapMenu.hasClass('mapmenu-show')){
        settings.mapMenu.removeClass('mapmenu-show');
        settings.menuButton.removeClass('mapmenu-button-false');
        settings.menuButton.addClass('mapmenu-button-true');
      }
      else {
        settings.mapMenu.addClass('mapmenu-show');
        settings.menuButton.removeClass('mapmenu-button-true');
        settings.menuButton.addClass('mapmenu-button-false');
      }
    },
    addLegend: function() {
      var layers = Viewer.getLayers();
      $('#mapmenu').append('<div><ul id="legendlist"></ul></div>');
      for (var i=layers.length-1; i>=0; i--) {
        var name = (layers[i].get('name'));
        var item = '<li><div class ="legend-item" id="' + name + '"><div><div class="checkbox"></div>';
        item += layers[i].get('title') + '</div><div class="getLegend"></div></div></li>'     
        $('#legendlist').append(item);
        if(layers[i].getVisible()==true) {
          $('#' + name + ' .checkbox').addClass('checkbox-true');
        }
        else {
          $('#' + name + ' .checkbox').addClass('checkbox-false');
        }
        $('#' + name).click(function() {
          MapMenu.toggleCheck($(this).attr("id"), layers[i]);
        })
      }
    },
    toggleCheck: function(layerid) {
      if($('#' + layerid + ' .checkbox').hasClass('checkbox-true')) {
        $('#' + layerid + ' .checkbox').removeClass('checkbox-true');
        $('#' + layerid + ' .checkbox').addClass('checkbox-false');
        Viewer.getLayer(layerid).setVisible(false);        
      }
      else {
        $('#' + layerid + ' .checkbox').removeClass('checkbox-false');
        $('#' + layerid + ' .checkbox').addClass('checkbox-true'); 
        Viewer.getLayer(layerid).setVisible(true);       
      }      
    }
  };
})(jQuery);	