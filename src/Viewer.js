/* ========================================================================
 * Copyright 2014 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var Viewer = (function($){
 
  var map, mapControls;

  var settings = {
    projection: '',
    projectionCode: '',
    projectionExtent: '',    
    center: [0, 0],
    zoom: 0,
    resolutions: null, 
    source: {},
    layers: []
  };
 
  return {
    init: function(mapSettings){
        //Map settings to use for this viewer       
        settings.projectionCode = mapSettings.projectionCode;
        settings.projectionExtent = mapSettings.projectionExtent;
        settings.projection = ol.proj.configureProj4jsProjection({
            code: settings.projectionCode,
            extent: settings.projectionExtent
        });                 
        settings.center = mapSettings.center;
        settings.zoom = mapSettings.zoom;
        settings.resolutions = mapSettings.resolutions;
        settings.source = mapSettings.source;
        this.createLayers(mapSettings.layers);        

        //If url arguments, parse this settings
        if (window.location.search) {
            this.parseArg();
        }    

        //Set map controls
        mapControls = [
                new ol.control.Zoom({zoomInTipLabel: null, zoomOutTipLabel:null,zoomInLabel: '', zoomOutLabel:''}),
                new ol.control.Attribution()
        ]; 
        if(window.top!=window.self) {
            MapWindow.init();
        }
        else {
            mapControls.push(new ol.control.FullScreen());
        }    

    	this.loadMap();

      this.addGetFeatureInfo(); 

    },
    createLayers: function(layerlist) {
        for(var i=layerlist.length-1; i>=0; i--) {
            if(layerlist[i].type == 'WMTS') {
                settings.layers.push(Viewer.addWMTS(layerlist[i]));
            }
            else if(layerlist[i].type == 'WMS') {
                settings.layers.push(Viewer.addWMS(layerlist[i]));
            }
        }
    },
    loadMap: function(){
	    map = new ol.Map({
	      target: 'map',
	      controls: mapControls,
	      layers: settings.layers,
	      view: new ol.View2D({
	      	projection: settings.projection,
	        center: settings.center,
            resolutions: settings.resolutions,
	        zoom: settings.zoom
	      })
	    });    	
    },
    parseArg: function(){
    	var str = window.location.search.substring(1);
    	var elements = str.split("&");          

    	for (var i = 0; i < elements.length; i++) {
            //center coordinates
            if (i==0) {
                var z = elements[i].split(",");
                settings.center[0] = parseInt(z[0]);
                settings.center[1] = parseInt(z[1]);              
            }
            else if (i==1) {
                settings.zoom = parseInt(elements[i]);
            }             
    		else if (i==2) {
                var l = elements[i].split(",");
                var layers = settings.layers;
                for (var j = 0; j < l.length; j++) {  
                    layers.forEach(function(el) {
                      if (l[j] == el.get('name')) {
                        el.setVisible(true);
                      }
                    })                    
    		    }
    	    }              
        }
    	 	
    },
    getMapUrl: function () {
      var layerNames = '', url;
      //delete search arguments if present
      if (window.location.search) {
          url = window.location.href.replace(window.location.search, '?');
      }
      else {
          url = window.location.href + '?';    
      }
      var mapView = map.getView();
      var center = mapView.getCenter();
      for (var i=0; i < 2; i++) {
        center[i]=parseInt(center[i]); //coordinates in integers
      }
      var zoom = mapView.getZoom();
      var layers = map.getLayers();
      //add layer if visible
      layers.forEach(function(el) {
        if(el.getVisible() == true) {
            layerNames += el.get('name') + ',';
        }
      })
      return url + center + '&' + zoom + '&' + layerNames.slice(0, layerNames.lastIndexOf(","));
    },
    getMap: function() {
      return map;
    },
    getLayers: function() {
      return settings.layers;
    },
    getLayer: function(layername) {    
        var layer = $.grep(settings.layers, function(obj) {
            return (obj.get('name') == layername);
        }); 
        return layer[0];       
    },
    addWMS: function(layersConfig) {    

        return new ol.layer.Tile({
          name: layersConfig.name.split(':').pop(), //remove workspace part of name
          title: layersConfig.title,
          visible: layersConfig.visible,           
          source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
            url: settings.source[layersConfig.source].url,
            projection: settings.projection,
            params: {'LAYERS': layersConfig.name, 'TILED': true, VERSION: settings.source[layersConfig.source].version}
          }))
        })        
    },
    addWMTS: function(layersConfig) {
        var matrixIds = [], attr = null;
        for (var z = 0; z < settings.resolutions.length; ++z) {
          matrixIds[z] = settings.projectionCode + ':' + z;
        }

        layersConfig.hasOwnProperty('attribution') ? attr=[new ol.Attribution({html: layersConfig.attribution})] : [attr = null];

        return new ol.layer.Tile({
           name: layersConfig.name.split(':').pop(), //remove workspace part of name
           title: layersConfig.title,
           visible: layersConfig.visible,
           source: new ol.source.WMTS({
             attributions: attr,
             url: settings.source[layersConfig.source].url,
             projection: settings.projection,
             layer: layersConfig.name,
             matrixSet: settings.projectionCode,
             format: layersConfig.format,
             tileGrid: new ol.tilegrid.WMTS({
               origin: ol.extent.getTopLeft(settings.projectionExtent),
               resolutions: settings.resolutions,
               matrixIds: matrixIds
             }),                       
             extent: settings.projectionExtent,
             style: 'default'
           })
        })
    },
    addGetFeatureInfo: function() {

        // Popup showing the position the user clicked
        var popup = new ol.Overlay({
          element: $('#popup')
        });

        var viewResolution = map.getView().getResolution();

        map.on('touchend click', function(evt) { 
          var element = popup.getElement();
          var coordinate = evt.coordinate;

          var url = Viewer.getLayer('fmis_uppsala_l_sweref_point').getSource().getGetFeatureInfoUrl(
            evt.coordinate, viewResolution, settings.projection,
            {'INFO_FORMAT': 'text/html'});

          $.post(url, function(data) {
            var match = data.match(/<body[^>]*>([\s\S]*)<\/body>/);
              if (match && !match[1].match(/^\s*$/)) {
                $(element).popover('destroy');

                popup.setPosition(coordinate);

                $(element).popover({
                  'placement': 'top',
                  'animation': false,
                  'html': true,
                  'title': Viewer.getLayer('fmis_uppsala_l_sweref_point').get('title') + '<span class="modal-close-button"></span>',
                  'content': data
                });
                $(element).popover('show');
                $('.popover-title .modal-close-button').click(function() {
                  $(element).popover('hide');
                });
                /*Workaround to remove when autopan implemented for overlays */
                  var el=$('.popover');
                  var center = map.getView().getCenter();
                  var popupOffset = $(el).offset();
                  var mapOffset = $('#' + map.getTarget()).offset();
                  var offsetY = popupOffset.top - mapOffset.top;
                  var mapSize = map.getSize();
                  var offsetX = (mapOffset.left + mapSize[0])-(popupOffset.left+$(el).outerWidth(true));                 
                  if (offsetY < 0 || offsetX < 0) {
                    var dx = 0, dy = 0;
                    if (offsetX < 0) {
                      dx = (-offsetX)*viewResolution;
                    }
                    if (offsetY < 0) {
                      dy = (-offsetY)*viewResolution;
                    }
                    var pan = ol.animation.pan({
                      duration: 300,
                      source: center
                    });
                    map.beforeRender(pan);
                    map.getView().setCenter([center[0]+dx, center[1]+dy]);

                  }
                /*End workaround*/

              }
              else {
                $(element).popover('hide');
              }
          });
          evt.preventDefault();

        });
        map.addOverlay(popup);  
    }  
  };
 
})(jQuery);