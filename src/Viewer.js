/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var Viewer = (function($){
 
  var map, mapControls, attribution;

  var settings = {
    projection: '',
    projectionCode: '',
    projectionExtent: '',
    extent: [],    
    center: [0, 0],
    zoom: 0,
    resolutions: null, 
    source: {},
    group: [],
    layers: [],
    modules: [],
    editLayer: null
  };
  var cqlQuery, queryFinished = false;
 
  return {
    init: function(mapSettings){

        if(!(Modernizr.canvas)) {
          $('#wrapper').remove();
          return;
        }
        //Map settings to use for this viewer       
        settings.projectionCode = mapSettings.projectionCode;
        settings.projectionExtent = mapSettings.projectionExtent;
        settings.projection = ol.proj.get(settings.projectionCode);
        settings.projection.setExtent(settings.projectionExtent);
        settings.extent = mapSettings.extent;                 
        settings.center = mapSettings.center;
        settings.zoom = mapSettings.zoom;
        settings.resolutions = mapSettings.resolutions;
        settings.source = mapSettings.source;
        settings.home = mapSettings.home;
        settings.groups = mapSettings.groups;
        settings.editLayer = mapSettings.editLayer;
        this.createLayers(mapSettings.layers, settings.layers); //read layers from mapSettings      
        settings.modules = mapSettings.modules;

        //If url arguments, parse this settings
        if (window.location.search) {
            this.parseArg();
        }    

        //Create attribution
        attribution = new ol.control.Attribution({
          collapsible: false
        });

        //Set map controls
        mapControls = [
                new ol.control.Zoom({zoomInTipLabel: null, zoomOutTipLabel:null,zoomInLabel: '', zoomOutLabel:''}),
                attribution,
                new ol.control.Rotate({label: ''}), /*Override default label for compass*/
                new ol.control.ScaleLine({target: 'bottom-tools'})
        ]
        if(window.top!=window.self) {
            MapWindow.init();
        }
  
      this.bindHome(settings.home);
    	this.loadMap();

      //Check size for attribution mode
      $(window).on('resize', this.checkSize);
      this.checkSize();

      // init modules
      var module;
      var options;
      var fn,nsFn;
      for (var i=0; i<settings.modules.length; i++) {
        module = settings.modules[i].name;
        options = settings.modules[i].options || undefined;
        nsFn = settings.modules[i].fn || 'init';
        fn = window[module][nsFn];
        if (typeof fn === 'function') fn.apply(null, options);
      }

    },
    createLayers: function(layerlist, layerTarget) {
        for(var i=layerlist.length-1; i>=0; i--) {
            if(layerlist[i].type == 'WMTS') {
                layerTarget.push(Viewer.addWMTS(layerlist[i]));
            }
            else if(layerlist[i].type == 'WMS') {
                layerTarget.push(Viewer.addWMS(layerlist[i]));
            }
            else if(layerlist[i].type == 'WFS') {
                layerTarget.push(Viewer.addWFS(layerlist[i]));
            }
            else if(layerlist[i].type == 'GEOJSON') {
                layerTarget.push(Viewer.addGeoJson(layerlist[i]));
            } 
            else if(layerlist[i].type == 'GROUP') {
                layerTarget.push(Viewer.createLayerGroup(layerlist[i].layers, layerlist[i]));
            }          
        }
        return layerTarget;
    },
    createLayerGroup: function(layers, layersConfig) {
      var group = [];
      group = Viewer.createLayers(layers, group);
      return new ol.layer.Group({name: layersConfig.name, group: layersConfig.group, title: layersConfig.title, styleName: layersConfig.style || 'default', layers: group, mapSource: layersConfig.source, visible: layersConfig.visible});
    },
    loadMap: function(){

	    map = new ol.Map({
	      target: 'map',
	      controls: mapControls,
	      layers: settings.layers,
	      view: new ol.View({
          extent: settings.extent,
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
                var l = elements[i].split(";");
                var layers = settings.layers;
                var la, match;
                for (var j = 0; j < layers.length; j++) {
                    match = 0; 
                    $.each(l, function(index, el) {
                      la = el.split(",");
                      if(layers[j].get('group')) {
                        if((layers[j].get('group') == 'background') && (la[0] == layers[j].get('name'))) {
                          layers[j].setVisible(true);
                          match = 1;
                        }
                        else if ((layers[j].get('group') == 'background') && (match == 0)) {                    
                          layers[j].setVisible(false);
                        }
                        else if (la[0] == layers[j].get('name')) {
                          if (la[1] == 1) {
                            layers[j].set('legend', true);
                            layers[j].setVisible(false);                            
                          }
                          else {
                            layers[j].set('legend', true);                            
                            layers[j].setVisible(true);                         
                          }   
                        }
                      }                                           
                    })                    
    		        }
    	    }              
        }
    	 	
    },
    getSettings: function () {
      return settings;
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
            layerNames += el.get('name') + ';';
        }
        else if(el.get('legend') == true) {
            layerNames += el.get('name') + ',1;';          
        }
      })
      return url + center + '&' + zoom + '&' + layerNames.slice(0, layerNames.lastIndexOf(";"));
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
    getEditLayer: function() {
      return settings.editLayer;
    },
    getGroup: function(group) {    
        var group = $.grep(settings.layers, function(obj) {
            return (obj.get('group') == group);
        }); 
        return group;       
    },
    getGroups: function() {
        return settings.groups;
    },
    getProjectionCode: function() {
      return settings.projectionCode;
    },
    getMapSource: function() {
      return settings.source;
    },
    addWMS: function(layersConfig) {    

        return new ol.layer.Tile({
          name: layersConfig.name.split(':').pop(), //remove workspace part of name
          group: layersConfig.group || 'default',
          opacity: layersConfig.opacity || 1,          
          title: layersConfig.title,
          styleName: layersConfig.style || 'default',
		  extent: layersConfig.extent || undefined,
          minResolution: layersConfig.hasOwnProperty('minScale') ? Viewer.scaleToResolution(layersConfig.minScale): undefined,
          maxResolution: layersConfig.hasOwnProperty('maxScale') ? Viewer.scaleToResolution(layersConfig.maxScale): undefined,            
          type: layersConfig.type,
          visible: layersConfig.visible,
          legend: false,          
          source: new ol.source.TileWMS(({
            url: settings.source[layersConfig.source].url,
            gutter: layersConfig.gutter || 0,
            crossOrigin: 'anonymous',
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
           group: layersConfig.group || 'background',          
           name: layersConfig.name.split(':').pop(), //remove workspace part of name
           opacity: layersConfig.opacity || 1,
           title: layersConfig.title,
           styleName: layersConfig.style || 'default',
           minResolution: layersConfig.hasOwnProperty('minScale') ? Viewer.scaleToResolution(layersConfig.minScale): undefined,
           maxResolution: layersConfig.hasOwnProperty('maxScale') ? Viewer.scaleToResolution(layersConfig.maxScale): undefined,             
           visible: layersConfig.visible,
           source: new ol.source.WMTS({
             crossOrigin: 'anonymous',
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
             extent: settings.extent, //layer extent to avoid bad requests out of range
             style: 'default'
           })
        })
    },
    addGeoJson: function(layersConfig) {
        return new ol.layer.Vector({
          group: 'none',
          name: layersConfig.name.split(':').pop(),
          opacity: layersConfig.opacity || 1,
          styleName: layersConfig.style || 'default',
          legend: false,
          queryable: layersConfig.hasOwnProperty('queryable') ? layersConfig.queryable : true,
          minResolution: layersConfig.hasOwnProperty('minScale') ? Viewer.scaleToResolution(layersConfig.minScale): undefined,
          maxResolution: layersConfig.hasOwnProperty('maxScale') ? Viewer.scaleToResolution(layersConfig.maxScale): undefined,            
          title: layersConfig.title,
          visible: layersConfig.visible,
          source: new ol.source.GeoJSON({
            url: layersConfig.source
          }),
          style: Viewer.createStyle(layersConfig.style)                  
        })
    },  
    addWFS: function(layersConfig) {
        var vectorSource = null;
        var geometryName = layersConfig.hasOwnProperty('geometryName') ? layersConfig.geometryName : 'geom';
        var featureType = layersConfig.name.split('__').shift();

        vectorSource = new ol.source.ServerVector({
          format: new ol.format.GeoJSON({geometryName: geometryName}),
          loader: function(extent, resolution, projection) {
            var that = this;
            var url = settings.source[layersConfig.source].url + '?service=WFS&' +
                'version=1.1.0&request=GetFeature&typeName=' + featureType +
                '&outputFormat=application/json' +
                '&srsname=' + settings.projectionCode + '&bbox=' + extent.join(',') + ',' + settings.projectionCode;
            $.ajax({
              url: url,
              dataType: 'json',
              success: function(response) {
                vectorSource.addFeatures(vectorSource.readFeatures(response));
              }
            });            
          },
          strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({
            maxZoom: settings.resolutions.length
          })),
          projection: settings.projectionCode
        });
        var options = {
          featureType: featureType.split('__').shift(),
          name: layersConfig.name.split(':').pop(),
          title: layersConfig.title,
          group: layersConfig.group || 'default',
          opacity: layersConfig.opacity || 1,
          geometryName: geometryName,
          relations: layersConfig.relations || undefined,
          legend: false,
          mapSource: layersConfig.source,
          styleName: layersConfig.style || 'default',         
          queryable: layersConfig.hasOwnProperty('queryable') ? layersConfig.queryable : true,
          minResolution: layersConfig.hasOwnProperty('minScale') ? Viewer.scaleToResolution(layersConfig.minScale): undefined,
          maxResolution: layersConfig.hasOwnProperty('maxScale') ? Viewer.scaleToResolution(layersConfig.maxScale): undefined,                  
          visible: layersConfig.visible,          
          attributes: layersConfig.attributes     
        }

        var styleOptions = Viewer.createStyle(layersConfig.style);

        var layerType = layersConfig.vectorSource ? layersConfig.vectorSource : 'vector';

        if (layerType == 'vector') {
          options.source = vectorSource;
          options.style = styleOptions;
          return new ol.layer.Vector(options);                                 
        }
        else if (layerType == 'image') {
          options.source = new ol.source.ImageVector({
            source: vectorSource,
            style: styleOptions
          });
          return new ol.layer.Image(options);
        }
    },
    wfsCql: function(relations, coordinates) {
            var url, finishedQueries = 0;
            cqlQuery = [];
            // alert(coordinates);
            // var matches = coordinates.filter.match(/\[(.*?)\]/);
            for(var i=0; i < relations.length; i++) {
              (function(index) {
                var layer = relations[index].layer;
                var mapServer = settings.source[Viewer.getLayer(layer).get('mapSource')].url;           
                url = mapServer + '?';
                data = 'service=WFS&' +
                    'version=1.0.0&request=GetFeature&typeName=' + layer +
                    '&outputFormat=json' +
                    '&CQL_FILTER=INTERSECTS(geom,' + coordinates + ')&outputFormat=json';
                $.ajax({
                  url: url,
                  type: 'POST',
                  data: data,
                  dataType: 'json',
                  success: function(response) {
                    var result = {};
                    result.layer = relations[index].layer;
                    result.url = relations[index].url || undefined;
                    result.features = [];
                    for(var j=0; j<response.features.length; j++) {
                      var f = {};
                      f.attribute = response.features[j]['properties'][relations[index].attribute];
                      f.url = response.features[j]['properties'][relations[index].url] || undefined;                      
                      result.features.push(f);
                    }
                    cqlQuery.push(result);
                    finishedQueries++;
                    if (finishedQueries >= relations.length) {
                      queryFinished = true;
                    }                  
                  },
                  error: function(jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                  }              
                });
            })(i);
          } 
    },
    getCqlQuery: function() {
      return cqlQuery;
    },
    modalMoreInfo: function() {
      var content = $('#identify').html();
      var title = $('.popup-title').html();
      Popup.setVisibility(false);

      var queryList = '<ul id="querylist">';
      queryList += '</ul>';   

      var modal = Modal('#map', {title: title, content: content + queryList});          
      modal.showModal();
      $('.modal li').removeClass('hidden');

      var queryListItems = '';
      var tries = 10, nrTries = 0;
      checkQuery();

      //check if query is finished
      function checkQuery() {
        if (queryFinished) {
          appendQuery();
          queryFinished = false;
          return;
        }
        else {
          setTimeout(function() {
            if(nrTries <= tries) {
              nrTries ++;
              checkQuery();
            }
          }, 100);          
        }        
      }

      //append query results to modal
      function appendQuery() {
        cqlQuery.sort(function(a, b) {
          return a.layer.localeCompare(b.layer);
        });        
        for (var i=0; i < cqlQuery.length; i++) {
          if(cqlQuery[i].features.length) {
            var l = Viewer.getLayer(cqlQuery[i].layer);
            queryListItems += '<ul><li>' + l.get('title') + '</li>';
            for (var j=0; j < cqlQuery[i].features.length; j++) {
                  var attr = cqlQuery[i].features[j].attribute;
                  if (cqlQuery[i].features[j].url) {
                    queryListItems += '<li><div class="query-item"><a href="' + cqlQuery[i].features[j].url + '" target="_blank">' +
                          attr + 
                          '</a></div></li>';
                  }
                  else {
                    queryListItems += '<li><div class="query-item">' + attr + '</div></li>';//<div class="icon-expand icon-expand-false"></div></li>';                        
                  }        
            }
            queryListItems += '</ul>';
          }
        }      
        $('#querylist').append(queryListItems);
      }
    },
    createStyle: function(styleName) {
          var s = styleSettings[styleName];
          var style = (function() {
            var styleList=[];
            //Create style for each rule
            for (var i = 0; i < s.length; i++) {
              var styleRule = [];
              var styleOptions;
              //Check if rule is array, ie multiple styles for the rule
              if(s[i].constructor === Array) {
                for(var j=0; j<s[i].length; j++) {
                  styleOptions = Viewer.createStyleOptions(s[i][j]);
                  styleRule.push(new ol.style.Style(styleOptions));
                }
              }
              //If single style for rule
              else {
                styleOptions = Viewer.createStyleOptions(s[i]);
                styleRule = [new ol.style.Style(styleOptions)];
              }

              styleList.push(styleRule);
            }

            return function(feature,resolution) {
              var scale = Viewer.getScale(resolution);
              for (var j=0; j<s.length; j++) {
                var styleL;
                if (s[j][0].hasOwnProperty('filter')) {  
                  //find attribute vale between [] defined in styles
                  var featAttr, expr, featMatch;
                  var matches = s[j][0].filter.match(/\[(.*?)\]/);
                  if (matches) {
                      featAttr = matches[1];
                      expr = s[j][0].filter.split(']')[1];
                      featMatch = feature.get(featAttr);
                      expr = typeof featMatch == 'number' ? featMatch + expr : '"' + featMatch + '"' + expr ;
                  }
                  if(eval(expr) && checkScale(s[j][0].maxScale, s[j][0].minScale)) {
                    styleL = styleList[j];
                  }
                }
                else if (checkScale(s[j][0].maxScale, s[j][0].minScale)) {
                  styleL = styleList[j];                
                }
                     
              }

              // check if scale is defined
              function checkScale(maxScale, minScale) {
                if (maxScale || minScale) {
                  // Alter 1: maxscale and minscale
                  if(maxScale && minScale) {
                    if ((scale > maxScale) && (scale < minScale)) {
                      return true;
                    }
                  }
                  // Alter 2: only maxscale
                  else if (maxScale) {
                    if(scale > maxScale) {
                      return true;  
                    }
                  }
                  // Alter 3: only minscale
                  else if (minScale) {
                    if(scale < minScale) {
                      return true;  
                    }
                  }                  
                }
                // Alter 4: no scale limit
                else {
                    return true;
                }
              }
              // end check scale 

              return styleL;
            }
          })()
          return style; 
          
    },
    createStyleOptions: function(styleParams) {
      var styleOptions = {
        fill: styleParams.fill ? new ol.style.Fill(styleParams.fill) : undefined,
        stroke: styleParams.stroke ? new ol.style.Stroke(styleParams.stroke) : undefined,
        image: undefined
      };
      if (styleParams.hasOwnProperty('circle')) {
        styleOptions.image = new ol.style.Circle({
            radius: styleParams.circle.radius,
            fill: new ol.style.Fill(styleParams.circle.fill) || undefined,
            stroke: new ol.style.Stroke(styleParams.circle.stroke) || undefined
        });
      }
      else if (styleParams.hasOwnProperty('icon')) {
        styleOptions.image = new ol.style.Icon(styleParams.icon);        
      }

      return styleOptions;
    },
    getScale: function(resolution) {
      var dpi = 25.4 / 0.28;
      var mpu = settings.projection.getMetersPerUnit();
      var scale = resolution * mpu * 39.37 * dpi;
      scale = Math.round(scale);
      return scale;
    },
    scaleToResolution: function(scale) {
      var dpi = 25.4 / 0.28;
      var mpu = settings.projection.getMetersPerUnit();
      var resolution = scale / (mpu * 39.37 * dpi);
      return resolution;      
    },
    getAttributes: function(feature, layer) {
        var content = '<div id="identify"><ul>';
        var attribute, li = '', title, val;
        //If layer is configured with attributes
        if(layer.get('attributes')) {
          for(var i=0; i<layer.get('attributes').length; i++) {
            attribute = layer.get('attributes')[i];
            title = '';
            if (attribute['name']) {
              val = feature.get(attribute['name']) || 'uppgift saknas';
              if (attribute['title']) {
                title = '<b>' + attribute['title'] + '</b>';
              }
              if (attribute['url']) {
                val = '<a href="' + feature.get(attribute['url']) + '" target="_blank">' +
                      feature.get(attribute['name']) + 
                      '</a>';
              }
              if (attribute['urlPrefix'] && attribute['url']) {
                val = '<a href="' + attribute['urlPrefix'] + feature.get(attribute['url']) + '" target="_blank">' + 
                      feature.get(attribute['name']) +
                      '</a>';
              } 
            }
            else if (attribute['html']) {
              val = attribute['html'];
            }

            var cls = ' class="' + attribute['cls'] + '" ' || '';

            li += '<li' + cls +'>' + title + val + '</li>';
          }
        }
        content += li + '</ul></div>';
        return content;
    },
    addFeatureInfo: function() {
        Popup.init('#map');

        map.on('click', function(evt) {
          Viewer.removeOverlays();     
          var overlay = new ol.Overlay({
            element: $('#popup')
          });

          map.addOverlay(overlay);
          var l;
          var feature = map.forEachFeatureAtPixel(evt.pixel,
              function(feature, layer) {
                l = layer;
                if(l.get('queryable') == true) {
                  return feature;
              }
              });
          if (feature) {
            var geometry = feature.getGeometry();
            var coord;
            geometry.getType() == 'Point' ? coord = geometry.getCoordinates() : coord = evt.coordinate;
            overlay.setPosition(coord);
            var content = Viewer.getAttributes(feature,l);
            //If layer have relations to be queried, ie more information
            if(l.get('relations')) {
              var format = new ol.format.WKT();
              var featureCoord = format.writeGeometry(feature.getGeometry()); 
              Viewer.wfsCql(l.get('relations'), featureCoord);
              content += '<br><div class="mdk-more-button">Mer information</div>';
              Popup.setContent({content: content, title: l.get('title')});            
              Popup.setVisibility(true);              
              $('.mdk-more-button').on('click touchend', function(e) {
                Viewer.modalMoreInfo();               
                e.preventDefault();              
              });
            }
            else {
              Popup.setContent({content: content, title: l.get('title')});            
              Popup.setVisibility(true);              
            }           
            Viewer.autoPan();
         
          } else {
            Popup.setVisibility(false);
          }
          evt.preventDefault();
        });      
    },
    addGetFeatureInfo: function() {
        Popup.init('#map');

        var overlay = new ol.Overlay({
          element: $('#popup')
        });

        map.on('singleclick', function(evt) {
          var element = overlay.getElement();
          var coordinate = evt.coordinate;
          var layer, queryLayers=[];
          for(var i=0; i<settings.layers.length; i++) {
            layer = settings.layers[i];
            if(layer.get('type')=='WMS' && layer.getVisible()==true) {
              (function(l) {
              var url = layer.getSource().getGetFeatureInfoUrl(
              evt.coordinate, map.getView().getResolution(), settings.projection,
              {'INFO_FORMAT': 'text/html'});
                $.post(url, function(data) {
                  var match = data.match(/<body[^>]*>([\s\S]*)<\/body>/);
                    if (match && !match[1].match(/^\s*$/)) {
                      if(queryLayers.length==0) {
                      queryLayers.push(data);

                      overlay.setPosition(coordinate);
                      
                      Popup.setContent({content: data, title: l.get('title')});
                      Popup.setVisibility(true);
                      Viewer.autoPan();

                      }/*End if empty*/
                      else {
                        queryLayers.push(data);;
                      }
                    }
                    else {
                      // $(element).popover('hide');
                      Popup.setVisibility(false);
                    }
                });//end post
              })(layer) //end post function
              } //end if
              } //end for
          
          map.addOverlay(overlay);
          evt.preventDefault();
        });
          
    },
    autoPan: function() {
    /*Workaround to remove when autopan implemented for overlays */
      var el=$('.popup');
      var center = map.getView().getCenter();
      var popupOffset = $(el).offset();
      var mapOffset = $('#' + map.getTarget()).offset();
      var offsetY = popupOffset.top - mapOffset.top;
      var mapSize = map.getSize();
      var offsetX = (mapOffset.left + mapSize[0])-(popupOffset.left+$(el).outerWidth(true));
      // Check if mapmenu widget is used and opened
      var menuSize = 0;
      if(MapMenu) {
        menuSize = MapMenu.getTarget().offset().left > 0 ? mapSize[0]- MapMenu.getTarget().offset().left : menuSize = 0;                 
      }
      if (offsetY < 0 || offsetX < 0 + menuSize || offsetX > (mapSize[0]-$(el).outerWidth(true))) {
        var dx = 0, dy = 0;
        if (offsetX < 0 + menuSize) {
          dx = (-offsetX + menuSize)*map.getView().getResolution();
        }
        if (offsetX > (mapSize[0]-$(el).outerWidth(true))) {
          dx = -($(el).outerWidth(true)-(mapSize[0]-offsetX))*map.getView().getResolution();
        }                         
        if (offsetY < 0) {
          dy = (-offsetY)*map.getView().getResolution();
        }
        var pan = ol.animation.pan({
          duration: 300,
          source: center
        });
        map.beforeRender(pan);
        map.getView().setCenter([center[0]+dx, center[1]+dy]);

      }
    /*End workaround*/
    },
    removeOverlays: function() {
      var overlays = map.getOverlays();
      if (overlays.length > 0) {
        for (var i=0; i < overlays.length; i++) {
          map.removeOverlay(overlays[i]);
        }
      }   
    }, 
    bindHome: function(home) {
      var homeb = home;
      $('#home-button').on('touchend click', function(e) {
        map.getView().fitExtent(homeb, map.getSize());
        $('#home-button button').blur();
        e.preventDefault();
      });                                
    },
    checkSize: function() {
      var small = map.getSize()[0] < 768;
      attribution.setCollapsible(small);
      attribution.setCollapsed(small);      
    }  
  };
 
})(jQuery);