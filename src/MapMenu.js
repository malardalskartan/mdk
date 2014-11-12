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
    init: function(menuSettings, groups){
        this.loadMenuItems(menuSettings);
        this.bindUIActions();
        this.addLegend(groups);
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
    addLegend: function(groups) {
      var layers = Viewer.getLayers();
      var legendGroup;
      var defaultGroup = 'default';
      //Add legend groups
      var legend = '<div id="legendlist"><ul class="legendlist"></ul></div>';
      $('#mapmenu').append(legend);                
      for (var i=0; i < groups.length; i++) {
        if (groups[i].hasOwnProperty('defaultGroup')) {
          defaultGroup = groups[i].name;
        }
        legendGroup ='<li>' +
                       '<ul id="group-' + groups[i].name + '" class="legend-group">' +
                          '<li class="legend-header"><div class="legend-item">' + groups[i].title + '<div class="icon-expand"></div></div></li>' +
                       '</ul>' + 
                     '</li>';
        $('#legendlist .legendlist').append(legendGroup);
        if(groups[i].expanded == true) {
          $('#group-' + groups[i].name +' .icon-expand').addClass('icon-expand-true');
        }
        else{
          $('#group-' + groups[i].name +' .icon-expand').addClass('icon-expand-false'); 
          $('#group-' + groups[i].name).addClass('ul-expand-false');                             
        }
        //Event listener for tick layer
        $('#group-' + groups[i].name + ' .legend-header').on('touchend click', function(evt) {
          MapMenu.toggleGroup($(this));
          evt.preventDefault();
        });     
      }

      //Add map legend
      var mapLegend = '<div id="map-legend"><ul class="legend-default"></ul></div>';
      $('#map').append(mapLegend);


      //Add layers to legend
      for (var i=layers.length-1; i>=0; i--) {
        var name = (layers[i].get('name'));
        var item = '<li class="legend"><div class ="legend-item ' + name + '" id="' + name + '"><div><div class="checkbox"></div>';
        item += layers[i].get('title') + '</div></div></li>';
        //Append layer to group in legend. Add to default group if not defined.
        if(layers[i].get('group') == defaultGroup) {
          $('#group-' + layers[i].get('group')).append(item);            
          item = '<li class="legend"><div class ="legend-item ' + name + '" id="default-' + name + '"><div><div class="checkbox"></div>';
          item += layers[i].get('title') + '</div></div></li>';          
          $('#map-legend .legend-default').append(item);                    
                  
        }
        else if(layers[i].get('group')) {     
          $('#group-' + layers[i].get('group')).append(item);
        }
        else {
          $('#group-default').append(item);
        }

        //Append class according to visiblity and if group is background
        if(layers[i].get('group') == 'background') {
          if(layers[i].getVisible()==true) {
            $('.' + name + ' .checkbox').addClass('check-true');
          }
          else {
            $('.' + name + ' .checkbox').addClass('check-false');
          }  
        }
        else {
          if(layers[i].getVisible()==true) {
            $('.' + name + ' .checkbox').addClass('checkbox-true');
          }
          else {
            $('.' + name + ' .checkbox').addClass('checkbox-false');
          }  
        }

        //Event listener for tick layer
        $('.' + name).on('touchend click', function(evt) {
          $(this).each(function() {
            var that = this;
            MapMenu.toggleCheck($(that).attr("id"));
          });
          evt.preventDefault();
        });
      }
    },
    toggleGroup: function(groupheader) {
      var group = groupheader.parent('.legend-group');
      var groupicon = $('#' + group.attr('id') + ' .icon-expand');
      if (groupicon.hasClass('icon-expand-false')) {
        groupicon.removeClass('icon-expand-false');
        groupicon.addClass('icon-expand-true');
        group.removeClass('ul-expand-false');
      }
      else {
        groupicon.removeClass('icon-expand-true');
        groupicon.addClass('icon-expand-false');
        group.addClass('ul-expand-false');
      }
    },
    toggleCheck: function(layerid) {
      var layername = layerid.split('default-').pop();
      var layer = Viewer.getLayer(layername);
      if(layer.get('group') == 'background') {
        if($('.' + layername + ' .checkbox').hasClass('check-true')) {
          $('.' + layername + ' .checkbox').removeClass('check-true');
          $('.' + layername + ' .checkbox').addClass('check-false');
          layer.setVisible(false);        
        }
        else {
          var group = Viewer.getGroup('background'); 
          for(var i=0; i<group.length; i++) {
              group[i].setVisible(false);
              $('.' + group[i].get('name') + ' .checkbox').removeClass('check-true');
              $('.' + group[i].get('name') + ' .checkbox').addClass('check-false');              
          }
          layer.setVisible(true);
          $('.' + layername + ' .checkbox').removeClass('check-false');
          $('.' + layername + ' .checkbox').addClass('check-true');                
        }  
      }
      else {
        if($('.' + layername + ' .checkbox').hasClass('checkbox-true')) {
          $('.' + layername + ' .checkbox').removeClass('checkbox-true');
          $('.' + layername + ' .checkbox').addClass('checkbox-false');
          layer.setVisible(false);        
        }
        else {
          $('.' + layername + ' .checkbox').removeClass('checkbox-false');
          $('.' + layername + ' .checkbox').addClass('checkbox-true'); 
          layer.setVisible(true);       
        }          
      }
    
    },
    getTarget: function() {
      return settings.mapMenu;
    }
  };
})(jQuery);	