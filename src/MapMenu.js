/* ========================================================================
 * Copyright 2014 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var MapMenu = (function($){

  var settings = {
  		menuButton: $('#mapmenu-button button'),
      mapMenu: $('#mapmenu')
  };

  var symbolSize = 20;

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
    getSymbol: function(style) {
      var symbol='';
      var s = style[0];
      if (s[0].hasOwnProperty('icon')) {
        var src = s[0].icon.src;
        // var scale = style.icon.scale || undefined;
        var o = '<object type="image/svg+xml" data="' + src + '" style="width: 20px;"></object>';               
        var inlineStyle = 'background: url(' + src + ') no-repeat;width: 20px; height: 20px;background-size: 20px;';
        symbol = '<div class="legend-item-img">' + o + '</div>';
      }
      else if (s[0].hasOwnProperty('fill')) {
        var fill = '';
        for(var i=0; i<s.length; i++) {
          fill += MapMenu.createFill(s[i]);
        }        
        symbol += '<div class="legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
        symbol += fill;
        symbol += '</svg></div>';
      }
      else if (s[0].hasOwnProperty('stroke')) {
        var stroke = '';
        for(var i=0; i<s.length; i++) {
          stroke += MapMenu.createStroke(s[i]);
        }
        symbol += '<div class="legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';              
        symbol += stroke;
        symbol += '</svg></div>';
      }     
      else if (s[0].hasOwnProperty('image')) {
        var src = s[0].image.src;
        var inlineStyle = 'background: url(' + src + ') no-repeat;width: 30px; height: 30px;background-size: 30px;';        
        symbol = '<div class="legend-item-img" style="' + inlineStyle +'"></div>';
      }
      return symbol;
    },
    createFill: function(fillProperties) {
        var f = fillProperties;
        var strokeWidth = 0;
        if(f.hasOwnProperty('stroke')) {
          strokeWidth = f.stroke.width >=3 ? 3 : f.stroke.width;        
          var stroke = 'stroke:' + f.stroke.color + ';' || 'stroke:none;';
          stroke += 'stroke-width:' + strokeWidth + ';' || '';
          stroke += 'stroke-dasharray:' + f.stroke.lineDash + ';' || '';            
        }        
        var fillSize = symbolSize - 4; //-2-2                         
        var fill = '<rect x="2" y="2" rx="2" ry="2" width="' + fillSize + '" height="' + fillSize + '" ';        
        fill += f.hasOwnProperty('fill') ? 'style="fill:' + f.fill.color + ';' : 'style="fill:none;';
        fill += stroke;
        fill += '"></rect>';
        return fill;  
    },
    createStroke: function(strokeProperties) {
        var s = strokeProperties;        
        var strokeWidth = s.stroke.width > 4 ? 4 : s.stroke.width;
        strokeWidth = s.stroke.width < 2 ? 2 : strokeWidth;
        var stroke = '<line x1 = "2" y1= "' + (symbolSize-4).toString() + '" x2="' + (symbolSize-4).toString() + '" y2="2" ';        
        stroke += 'style="';
        stroke += 'stroke:' + s.stroke.color + ';' || 'stroke:none;';
        stroke += 'stroke-width:' + strokeWidth + ';' || '';
        stroke += 'stroke-dasharray:' + s.stroke.lineDash + ';' || '';              
        stroke += '"/>';
        return stroke;
    },
    createLegendItem: function(layerid) {
      var layername = layerid.split('legend-').pop();
      var layer = Viewer.getLayer(layername);
      var legendItem = '<li class="legend ' + layername + '" id="' + layerid + '"><div class ="legend-item"><div class="checkbox"></div>';
      legendItem +=  layer.get('styleName') ? MapMenu.getSymbol(styleSettings[layer.get('styleName')]) : '';
      var title = '<div class="legend-item-title">' + layer.get('title') + '</div></div></li>';
      legendItem += title;        
      return legendItem;      
    },
    addLegend: function(groups) {
      var layers = Viewer.getLayers();
      var legendGroup;
      var overlayGroup;
      var item = '';

      //Add legend groups
      var legend = '<div id="legendlist"><ul class="legendlist"></ul></div>';
      $('#mapmenu').append(legend);                
      for (var i=0; i < groups.length; i++) {
        if (groups[i].hasOwnProperty('overlayGroup')) {
          overlayGroup = groups[i].name;
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
      var mapLegend = '<div id="map-legend"><ul id="legend-overlay"><li class="legend hidden"><div class ="toggle-button toggle-button-max"></div></li><li><ul id="overlay-list"></li></ul></ul><ul id="map-legend-background"></ul></div>';
      $('#map').append(mapLegend);
      //Add divider to map legend if not only background 
      if(overlayGroup) {
        $('#map-legend-background').prepend('<div class="legend-item-divider"></div>');
      };


      //Add layers to legend
      for (var i=layers.length-1; i>=0; i--) {

        var name = (layers[i].get('name'));
        var title = '<div class="legend-item-title">' + layers[i].get('title') + '</div></div></li>';

        //Append layer to group in legend. Add to default group if not defined.
        if(layers[i].get('group') == 'background') {
          //Append background layers to menu
          item = '<li class="legend ' + name + '" id="' + name + '"><div class ="legend-item"><div class="checkbox"></div>'; 
          item += title;            
          $('#group-' + layers[i].get('group')).append(item);
          //Append background layers to map legend
          item = '<li class="legend ' + name + '" id="legend-' + name + '"><div class ="legend-item">'
          item += layers[i].get('styleName') ? MapMenu.getSymbol(styleSettings[layers[i].get('styleName')]) : '';  
          item += '</div>';     
          $('#map-legend-background').append(item);
                  
        }        
        else if(layers[i].get('group') && ((layers[i].get('group') != 'none'))) {    
          item = '<li class="legend ' + name + '" id="' + name + '"><div class ="legend-item"><div class="checkbox"></div>'; 
          item +=  layers[i].get('styleName') ? MapMenu.getSymbol(styleSettings[layers[i].get('styleName')]) : '';
          item += title;         
          $('#group-' + layers[i].get('group')).append(item);
          if(layers[i].get('legend') == true || layers[i].getVisible(true)) {
            //Append to map legend                      
            item = '<li class="legend ' + name + '" id="legend-' + name + '"><div class ="legend-item"><div class="checkbox"></div>';
            item += layers[i].get('styleName') ? MapMenu.getSymbol(styleSettings[layers[i].get('styleName')]) : '';
            item += title;          
            $('#overlay-list').append(item);                              
          }          
        }

        //Append class according to visiblity and if group is background
        if(layers[i].get('group') == 'background') {
          if(layers[i].getVisible()==true) {
            $('#' + name + ' .checkbox').addClass('check-true');
            $('#legend-' + name).addClass('check-true-img');
          }
          else {
            $('#' + name + ' .checkbox').addClass('check-false');
            $('#legend-' + name).addClass('check-false-img');            
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
        $('#' + name).on('touchend click', function(evt) {
          $(this).each(function() {
            var that = this;
            MapMenu.toggleCheck($(that).attr("id"));
          });
          evt.preventDefault();
        });
        $('#legend-' + name).on('touchend click', function(evt) {
          $(this).each(function() {
            var that = this;
            MapMenu.toggleCheck($(that).attr("id"));
          });
          evt.preventDefault();
        });       
      }
      //Toggle map legend
      $('#legend-overlay .toggle-button').on('touchend click', function(evt) {
        MapMenu.toggleOverlay();
        evt.preventDefault();
      });            
    },
    onToggleCheck: function(layername) {
        //Event listener for tick layer
        $('#' + layername).on('touchend click', function(evt) {
          $(this).each(function() {
            var that = this;
            MapMenu.toggleCheck($(that).attr("id"));
          });
          evt.preventDefault();
        });     
    },
    offToggleCheck: function(layername) {
        //Event listener for tick layer
        $('#' + layername).off('touchend click', function(evt) {
          $(this).each(function() {
            var that = this;
            MapMenu.toggleCheck($(that).attr("id"));
          });
          evt.preventDefault();
        });
    },    
    //Expand and minimize group
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
    //Toggle layers
    toggleCheck: function(layerid) {
      var layername = layerid.split('legend-').pop();
      var inMapLegend = layerid.split('legend-').length > 1 ? true : false;
      var layer = Viewer.getLayer(layername);
      //Radio toggle for background
      if(layer.get('group') == 'background') {
          var group = Viewer.getGroup('background'); 
          for(var i=0; i<group.length; i++) {
              group[i].setVisible(false);
              $('#' + group[i].get('name') + ' .checkbox').removeClass('check-true');
              $('#' + group[i].get('name') + ' .checkbox').addClass('check-false');
              //map legend
              $('#legend-' + group[i].get('name')).removeClass('check-true-img');
              $('#legend-' + group[i].get('name')).addClass('check-false-img');                             
          }
          layer.setVisible(true);
          $('#' + layername + ' .checkbox').removeClass('check-false');
          $('#' + layername + ' .checkbox').addClass('check-true');
          //map legend
          $('#legend-' + layername).removeClass('check-false-img');
          $('#legend-' + layername).addClass('check-true-img');                          
      }
      //Toggle check for alla groups except background
      else {
        if($('.' + layername + ' .checkbox').hasClass('checkbox-true')) {
          $('.' + layername + ' .checkbox').removeClass('checkbox-true');
          $('.' + layername + ' .checkbox').addClass('checkbox-false');
          if (inMapLegend == false) {
            MapMenu.offToggleCheck('legend-' + layername);            
            $('#legend-' + layername).remove();
            layer.set('legend', false);
            MapMenu.checkToggleOverlay();              
          }
          layer.setVisible(false);     
        }
        else {
          if (inMapLegend == false && $('#legend-' + layername).length == 0) {
            $('#overlay-list').append(MapMenu.createLegendItem('legend-' + layername));
            MapMenu.onToggleCheck('legend-' + layername);
            MapMenu.checkToggleOverlay();
          }           
          $('.' + layername + ' .checkbox').removeClass('checkbox-false');
          $('.' + layername + ' .checkbox').addClass('checkbox-true');     
          layer.setVisible(true);
          layer.set('legend', true);    
        }          
      }
    
    },
    checkToggleOverlay: function() {
        if($('#overlay-list li').length > 1 && $('#legend-overlay >li:first-child').hasClass('hidden')) {
            $('#legend-overlay > li:first-child').removeClass('hidden');          
        }     
        else {
            $('#legend-overlay > li:first-child').addClass('hidden');
            if($('#overlay-list li').length == 1 && $('#overlay-list').hasClass('hidden')) {
                $('#overlay-list').removeClass('hidden');
                MapMenu.toggleOverlay();          
            }                          
        }
    },
    toggleOverlay: function() {
        if($('#legend-overlay .toggle-button').hasClass('toggle-button-max')) {
          $('#legend-overlay .toggle-button').removeClass('toggle-button-max');
          $('#legend-overlay .toggle-button').addClass('toggle-button-min');
          $('#overlay-list').addClass('hidden');
        }
        else {
          $('#legend-overlay .toggle-button').removeClass('toggle-button-min');
          $('#legend-overlay .toggle-button').addClass('toggle-button-max');
          $('#overlay-list').removeClass('hidden');                   
        }
    },
    getTarget: function() {
      return settings.mapMenu;
    }
  };
})(jQuery);	