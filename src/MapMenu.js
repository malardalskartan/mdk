/* ========================================================================
 * Copyright 2014 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

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
    	settings.menuButton.on('touchend click', function(e) {
    		MapMenu.toggleMenu();
        settings.menuButton.blur();
        e.preventDefault();
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
      var legend ='<div id="legendlist">' + 
                    '<ul>' + 
                        '<li>' +
                          '<ul id="group-default">' +
                          '</ul>' + 
                        '</li>' +
                        '<li class="menu-item-divider"></li>' +
                        '<li>' + 
                          '<ul id="group-background">' +
                          '</ul>' + 
                        '</li>' +                                   
                    '</ul>' +
                  '</div>';
      $('#mapmenu').append(legend);
      for (var i=layers.length-1; i>=0; i--) {
        var name = (layers[i].get('name'));
        var item = '<li><div class ="legend-item" id="' + name + '"><div><div class="checkbox"></div>';
        item += layers[i].get('title') + '</div></div></li>';
        //Append layer to group in legend. Add to default group if not defined.
        if(layers[i].get('group')) {     
          $('#group-' + layers[i].get('group')).append(item);
        }
        else {
          $('#group-default').append(item);
        }

        //Append class according to visiblity and if group is background
        if(layers[i].get('group') == 'background') {
          if(layers[i].getVisible()==true) {
            $('#' + name + ' .checkbox').addClass('check-true');
          }
          else {
            $('#' + name + ' .checkbox').addClass('check-false');
          }  
        }
        else {
          if(layers[i].getVisible()==true) {
            $('#' + name + ' .checkbox').addClass('checkbox-true');
          }
          else {
            $('#' + name + ' .checkbox').addClass('checkbox-false');
          }  
        }

        //Event listener for tick layer
        $('#' + name).click(function() {
          MapMenu.toggleCheck($(this).attr("id"));
        })
      }
    },
    toggleCheck: function(layerid) {
      var layer = Viewer.getLayer(layerid);
      if(layer.get('group') == 'background') {
        if($('#' + layerid + ' .checkbox').hasClass('check-true')) {
          $('#' + layerid + ' .checkbox').removeClass('check-true');
          $('#' + layerid + ' .checkbox').addClass('check-false');
          Viewer.getLayer(layerid).setVisible(false);        
        }
        else {
          var group = Viewer.getGroup('background'); 
          for(var i=0; i<group.length; i++) {
              group[i].setVisible(false);
              $('#' + group[i].get('name') + ' .checkbox').removeClass('check-true');
              $('#' + group[i].get('name') + ' .checkbox').addClass('check-false');              
          }
          Viewer.getLayer(layerid).setVisible(true);
          $('#' + layerid + ' .checkbox').removeClass('check-false');
          $('#' + layerid + ' .checkbox').addClass('check-true');                
        }  
      }
      else {
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
    
    },
    getTarget: function() {
      return settings.mapMenu;
    }
  };
})(jQuery);	