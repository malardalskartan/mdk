/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Modernizr = require('../externs/modernizr');
var Popup = require('./popup');
var Modal = require('./modal');
var utils = require('./utils');
var sidebar = require('./sidebar');
var controls = {};
controls.geoposition = require('./geoposition');
controls.mapmenu = require('./mapmenu');
controls.print = require('./print');
controls.sharemap = require('./sharemap');
controls.legend = require('./legend');
controls.search = require('./search');


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
  styles: {},
  controls: [],
  featureInfoOverlay: undefined,
  editLayer: null
};
var cqlQuery, queryFinished = false;
 
function init (mapOptions){

        // if(!(Modernizr.canvas)) {
        //   $('#wrapper').remove();
        //   return;
        // }
        //Map settings to use for this module
        if (typeof(mapOptions) === 'object') {       
            setMapOptions(mapOptions);
        }
        else if (typeof(mapOptions) === 'string') {
            $.getJSON(mapOptions)
                .done(function(data) {
                    setMapOptions(data);
                });
        }


    }
    function setMapOptions(mapOptions) {    
        // Read and set projection
        if(mapOptions.hasOwnProperty('proj4Defs')) {
            var proj = mapOptions['proj4Defs'];
            //Register proj4 projection definitions
            for (var i=0; i<proj.length; i++) {
                proj4.defs(proj[i].code, proj[i].projection);
                if(proj[i].hasOwnProperty('alias')) {
                    proj4.defs(proj[i].alias, proj4.defs(proj[i].code));
                }
            }
            // Projection to be used in map
            settings.projectionCode = mapOptions.projectionCode || undefined;
            settings.projectionExtent =  mapOptions.projectionExtent;
            settings.projection = new ol.proj.Projection({
                code: settings.projectionCode,
                extent: settings.projectionExtent
            });
        }

        settings.extent = mapOptions.extent || undefined;
        settings.center = mapOptions.center;
        settings.zoom = mapOptions.zoom;
        settings.resolutions = mapOptions.resolutions || undefined;
        settings.source = mapOptions.source;
        settings.home = mapOptions.home;
        settings.groups = mapOptions.groups;
        settings.editLayer = mapOptions.editLayer;
        settings.styles = mapOptions.styles;        
        createLayers(mapOptions.layers, settings.layers); //read layers from mapOptions      
        settings.controls = mapOptions.controls;
        settings.featureInfoOverlay = mapOptions.hasOwnProperty('featureInfoOverlay') ? mapOptions.featureInfoOverlay : true;
        //If url arguments, parse this settings
        if (window.location.search) {
            parseArg();
        }    

        //Create attribution
        attribution = new ol.control.Attribution({
          collapsible: false
        });

        //Set map controls
        mapControls = [
                new ol.control.Zoom({zoomInTipLabel: '', zoomOutTipLabel:'',zoomInLabel: '', zoomOutLabel:''}),
                attribution,
                new ol.control.Rotate({label: ''}), /*Override default label for compass*/
                new ol.control.ScaleLine({target: 'bottom-tools'})
        ]
        if(window.top!=window.self) {
            MapWindow.init();
        }
  
      createHome(settings.home);
      loadMap();

      //Check size for attribution mode
      $(window).on('resize', checkSize);
      checkSize();

      //Init controls
      var controlName, controlOptions;
      for (var i=0; i<settings.controls.length; i++) {
          controlName = settings.controls[i].name;
          controlOptions = settings.controls[i].options || undefined;
          controlOptions ? controls[controlName].init(controlOptions) : controls[controlName].init();
      }
      sidebar.init();
      Popup.init('#map');      
      addFeatureInfo();

    }
    function createLayers(layerlist, layers) {
        for(var i=layerlist.length-1; i>=0; i--) {
            var layer = layerlist[i];
            var layerOptions = setLayerOptions(layer);          
            if(layer.type == 'WMTS') {
                layers.push(addWMTS(layer));
            }
            else if(layer.type == 'WMS') {
                layers.push(addWMS(layer));
            }
            else if(layer.type == 'WFS') {
                var wfsSource = wfs(layerOptions);
                layers.push(createVectorLayer(layerOptions, wfsSource));                
            }
            else if(layer.type == 'AGS_FEATURE') {
                var agsFeatureSource = agsFeature(layerOptions);
                layers.push(createVectorLayer(layerOptions, agsFeatureSource));                
            }            
            else if(layer.type == 'GEOJSON') {
                layers.push(createVectorLayer(layerOptions, geojson(layerOptions.source)));
            }
            else if(layer.type == 'MAPQUEST') {
                layers.push(addMapQuest(layer));
            }             
            else if(layer.type == 'GROUP') {
                layers.push(createLayerGroup(layer.layers, layer));
            }          
        }
        return layers;
    }
    function setLayerOptions(options) {
        var geometryName = options.hasOwnProperty('geometryName') ? options.geometryName : 'geom';
        var featureType = options.name.split('__').shift();      
        var layerOptions = {
            featureType: featureType.split('__').shift(),
            name: options.name.split(':').pop(),
            id: options.id || undefined,
            title: options.title,
            group: options.group || 'none',
            opacity: options.opacity || 1,
            geometryName: geometryName,
            filter: options.filter || undefined,
            relations: options.relations || undefined,
            layerType: options.layerType || 'vector',
            legend: false,
            source: options.source,
            style: options.style || 'default',
            styleName: options.style,        
            queryable: options.hasOwnProperty('queryable') ? options.queryable : true,
            minResolution: options.hasOwnProperty('minScale') ? scaleToResolution(options.minScale): undefined,
            maxResolution: options.hasOwnProperty('maxScale') ? scaleToResolution(options.maxScale): undefined,                  
            visible: options.visible,          
            attributes: options.attributes     
        }
        if (options.hasOwnProperty('clusterStyle')) {
            layerOptions.clusterStyle = options.clusterStyle;
        }
        return layerOptions;
    }
    function createLayerGroup(layers, layersConfig) {
      var group = [];
      group = createLayers(layers, group);
      return new ol.layer.Group({
          name: layersConfig.name,
          group: layersConfig.group,
          title: layersConfig.title,
          styleName: layersConfig.style || 'default',
          layers: group,
          mapSource: layersConfig.source,
          visible: layersConfig.visible
      });
    }
    function loadMap(){

	    map = new ol.Map({
	      target: 'map',
	      controls: mapControls,
	      layers: settings.layers,
	      view: new ol.View({
          extent: settings.extent || undefined,
	      	projection: settings.projection || undefined,
	        center: settings.center,
          resolutions: settings.resolutions || undefined,
	        zoom: settings.zoom
	      })
	    });    	
    }
    function parseArg(){
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
    	 	
    }
    function getSettings() {
        return settings;
    }
    function getStyleSettings() {
        return settings.styles;
    }
    function getMapUrl() {
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
    }
    function getMap() {
      return map;
    }
    function getLayers() {
      return settings.layers;
    }
    function getLayer(layername) {    
        var layer = $.grep(settings.layers, function(obj) {
           return (obj.get('name') == layername);
        }); 
        return layer[0];       
    }
    function getEditLayer() {
      return settings.editLayer;
    }
    function getGroup(group) {    
        var group = $.grep(settings.layers, function(obj) {
            return (obj.get('group') == group);
        }); 
        return group;       
    }
    function getGroups() {
        return settings.groups;
    }
    function getProjectionCode() {
      return settings.projectionCode;
    }
    function getMapSource() {
      return settings.source;
    }
    function createVectorLayer(options, source) {
        var vectorLayer;
        switch(options.layerType) {
            case 'vector':
                options.source = source;
                options.style = createStyle(options.style);
                vectorLayer = new ol.layer.Vector(options);
                break;
            case 'cluster':
                options.source = new ol.source.Cluster({
                  source: source,
                  distance: 60
                });
                options.style = createStyle(options.style, options.clusterStyle);
                vectorLayer = new ol.layer.Vector(options);
                break;
            case 'image':
                options.source = new ol.source.ImageVector({
                  source: source,
                  style: createStyle(options.style)
                });
                vectorLayer = new ol.layer.Image(options);
                break;
        }
        return vectorLayer;
    }
    function createTileLayer(options) {

    }
    function addWMS(layersConfig) {    

        return new ol.layer.Tile({
          name: layersConfig.name.split(':').pop(), //remove workspace part of name
          group: layersConfig.group || 'default',
          opacity: layersConfig.opacity || 1,          
          title: layersConfig.title,
          styleName: layersConfig.style || 'default',
		      extent: layersConfig.extent || undefined,
          minResolution: layersConfig.hasOwnProperty('minScale') ? scaleToResolution(layersConfig.minScale): undefined,
          maxResolution: layersConfig.hasOwnProperty('maxScale') ? scaleToResolution(layersConfig.maxScale): undefined,            
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
    }
    function addWMTS(layersConfig) {
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
           minResolution: layersConfig.hasOwnProperty('minScale') ? scaleToResolution(layersConfig.minScale): undefined,
           maxResolution: layersConfig.hasOwnProperty('maxScale') ? scaleToResolution(layersConfig.maxScale): undefined,             
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
    }
    function geojson(source) {
        return new ol.source.Vector({
            url: source,
            format: new ol.format.GeoJSON()
        })
    }  
    function wfs(options) {
        var vectorSource = null;
        var serverUrl = settings.source[options.source].url;

        //If cql filter then bbox must be used in the filter.
        var geometryName = options.geometryName;
        var queryFilter = options.filter ? '&CQL_FILTER=' + options.filter + ' AND BBOX(' + geometryName + ',' : '&BBOX=';
        var bboxProjectionCode = options.filter ? "'" + settings.projectionCode + "')" : settings.projectionCode;
        vectorSource = new ol.source.Vector({
          format: new ol.format.GeoJSON({geometryName: options.geometryName}),
          url: function(extent, resolution, projection) {
              return serverUrl +
                  '?service=WFS&' +
                  'version=1.1.0&request=GetFeature&typeName=' + options.name +
                  '&outputFormat=application/json' +
                  '&srsname=' + settings.projectionCode + 
                  queryFilter + extent.join(',') + ',' + bboxProjectionCode;          
          },
          strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
              maxZoom: settings.resolutions.length
          }))
        });
        return vectorSource;
    }
    function agsFeature(options) {
        var vectorSource = null;
        var esriSrs = settings.projectionCode.split(':').pop();
        var serverUrl = settings.source[options.source].url;
        var queryFilter = options.filter ? '&where=' + options.filter : '';
        var esrijsonFormat = new ol.format.EsriJSON();
        vectorSource = new ol.source.Vector({
            loader: function(extent, resolution, projection) {
              var that = this;
              // var serverUrl = settings.source[options.source].url;
              var url = serverUrl + options.id +
                  '/query?f=json&' +
                  'returnGeometry=true' +
                  '&spatialRel=esriSpatialRelIntersects' +
                  '&geometry=' + encodeURIComponent('{"xmin":' + extent[0] + ',"ymin":' +
                      extent[1] + ',"xmax":' + extent[2] + ',"ymax":' + extent[3] +
                      ',"spatialReference":{"wkid":' + esriSrs + '}}') +
                  '&geometryType=esriGeometryEnvelope'+
                  '&inSR=' + esriSrs + '&outFields=*' + '' + '&returnIdsOnly=false&returnCountOnly=false' +
                  '&geometryPrecision=2' +
                  '&outSR=' + esriSrs + queryFilter;
              // use jsonp: false to prevent jQuery from adding the "callback"
              // parameter to the URL
              $.ajax({
                url: url,
                dataType: 'jsonp',
                success: function(response) {
                    if (response.error) {
                        alert(response.error.message + '\n' +
                            response.error.details.join('\n'));
                    }
                    else {
                        // dataProjection will be read from document
                        var features = esrijsonFormat.readFeatures(response, {
                            featureProjection: projection
                        });
                        if (features.length > 0) {
                            that.addFeatures(features);
                        }
                    }           
                }
              });
            },
            strategy: ol.loadingstrategy.bbox
        });
        return vectorSource;      
    }
    function addMapQuest(layersConfig) {
        // layersConfig.hasOwnProperty('attribution') ? attr=[new ol.Attribution({html: layersConfig.attribution})] : [attr = null];

        return new ol.layer.Tile({
           group: layersConfig.group || 'background',          
           name: layersConfig.name.split(':').pop(), //remove workspace part of name
           opacity: layersConfig.opacity || 1,
           title: layersConfig.title,
           styleName: layersConfig.style || 'default',
           minResolution: layersConfig.hasOwnProperty('minScale') ? scaleToResolution(layersConfig.minScale): undefined,
           maxResolution: layersConfig.hasOwnProperty('maxScale') ? scaleToResolution(layersConfig.maxScale): undefined,             
           visible: layersConfig.visible,
           source: new ol.source.MapQuest({
             layer: layersConfig.name,                      
             style: 'default'
           })
        })
    }
    function wfsCql(relations, coordinates) {
            var url, finishedQueries = 0;
            cqlQuery = [];
            // alert(coordinates);
            // var matches = coordinates.filter.match(/\[(.*?)\]/);
            for(var i=0; i < relations.length; i++) {
              (function(index) {
                var layer = relations[index].layer;
                var mapServer = settings.source[getLayer(layer).get('mapSource')].url;           
                url = mapServer + '?';
                data = 'service=WFS&' +
                    'version=1.0.0&request=GetFeature&typeName=' + layer +
                    '&outputFormat=json' +
                    '&CQL_FILTER=INTERSECTS(geom,' + coordinates + ')' +
                    '&outputFormat=json';
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
    }
    function getCqlQuery() {
      return cqlQuery;
    }
    function modalMoreInfo() {
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
            var l = getLayer(cqlQuery[i].layer);
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
    }
    function createStyle(styleName, clusterStyleName) {
          var styleSettings = settings.styles[styleName];
          if($.isEmptyObject(styleSettings)) {
              alert('Style ' + styleName + ' is not defined');
          }
          var clusterStyleSettings = settings.styles[clusterStyleName];
          var style = (function() {
            //Create style for each rule
            var styleList = createStyleList(styleSettings);
            if(clusterStyleSettings) {
                var clusterStyleList = createStyleList(clusterStyleSettings);
                return styleFunction(styleSettings, styleList, clusterStyleSettings, clusterStyleList);                          
            }
            else {
                return styleFunction(styleSettings,styleList);
            }

          })()
          return style;        
    }
    //Create list of ol styles based on style settings
    function createStyleList(styleSettings) {
        var styleList=[];
        //Create style for each rule
        for (var i = 0; i < styleSettings.length; i++) {
          var styleRule = [];
          var styleOptions;
          //Check if rule is array, ie multiple styles for the rule
          if(styleSettings[i].constructor === Array) {
            for(var j=0; j<styleSettings[i].length; j++) {
              styleOptions = createStyleOptions(styleSettings[i][j]);
              styleRule.push(new ol.style.Style(styleOptions));
            }
          }
          //If single style for rule
          else {
            styleOptions = createStyleOptions(styleSettings[i]);
            styleRule = [new ol.style.Style(styleOptions)];
          }

          styleList.push(styleRule);
        }
        return styleList;
    }
    function styleFunction(styleSettings, styleList, clusterStyleSettings, clusterStyleList) {
      var s = styleSettings;
      var fn = function(feature,resolution) {
        var scale = getScale(resolution);
        var styleL;
        //If size is larger than, it is a cluster
        var size = clusterStyleList ? feature.get('features').length : 1;
        if(size > 1 && map.getView().getResolution() != settings.resolutions[settings.resolutions.length-1]) {
            styleL = checkOptions(feature, scale, clusterStyleSettings, clusterStyleList, size);
            // clusterStyleList[0].setText(size);
        }
        else {
            styleL = checkOptions(feature, scale, styleSettings, styleList);
        }
        return styleL;
      }
      return fn;     
    }
    function checkScale(scale, maxScale, minScale) {
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
    function checkOptions(feature, scale, styleSettings, styleList, size) {
        var s = styleSettings;
        for (var j=0; j<s.length; j++) {
          var styleL;
          if(checkScale(scale, s[j][0].maxScale, s[j][0].minScale)) {
            s[j].some(function(element, index, array) {
                if (element.hasOwnProperty('text') && size) {
                    styleList[j][index].getText().setText(size);
                }
            });                               
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
              if(eval(expr)) {
                styleL = styleList[j];
                return styleL;
              }
            }
            else {
              styleL = styleList[j];
              return styleL;                
            }                
          }
        }
    }
    function createStyleOptions(styleParams) {
        var styleOptions = {};
        if(styleParams.hasOwnProperty('geometry')) {
            switch (styleParams.geometry) {
                case 'centerPoint':
                    styleOptions.geometry = function(feature) {
                        var coordinates = feature.getGeometry().getInteriorPoints().getFirstCoordinate();
                        return new ol.geom.Point(coordinates);
                    }
                break;
            } 
        }
        if(styleParams.hasOwnProperty('zIndex')) {
            styleOptions.zIndex = styleParams.zIndex;
        }                
        if(styleParams.hasOwnProperty('fill')) {
            styleOptions.fill = new ol.style.Fill(styleParams.fill);
        }
        if(styleParams.hasOwnProperty('stroke')) {
            styleOptions.stroke = new ol.style.Stroke(styleParams.stroke);
        }
        if(styleParams.hasOwnProperty('text')) {         
            styleOptions.text = new ol.style.Text(styleParams.text);
            if(styleParams.text.hasOwnProperty('fill')) {
                styleOptions.text.setFill(new ol.style.Fill(styleParams.text.fill));
            }
            if(styleParams.text.hasOwnProperty('stroke')) {
                styleOptions.text.setStroke(new ol.style.Stroke(styleParams.text.stroke));
            }                       
        }
        if(styleParams.hasOwnProperty('icon')) {
            styleOptions.image = new ol.style.Icon(styleParams.icon);        
        }
        if(styleParams.hasOwnProperty('circle')) {
            styleOptions.image = new ol.style.Circle({
                radius: styleParams.circle.radius,
                fill: new ol.style.Fill(styleParams.circle.fill) || undefined,
                stroke: new ol.style.Stroke(styleParams.circle.stroke) || undefined
            });          
        }                     
        return styleOptions;
    }
    function getScale(resolution) {
      var dpi = 25.4 / 0.28;
      var mpu = settings.projection.getMetersPerUnit();
      var scale = resolution * mpu * 39.37 * dpi;
      scale = Math.round(scale);
      return scale;
    }
    function scaleToResolution(scale) {
      var dpi = 25.4 / 0.28;
      var mpu = settings.projection.getMetersPerUnit();
      var resolution = scale / (mpu * 39.37 * dpi);
      return resolution;      
    }
    function getAttributes(feature, layer) {
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
                val = '<a href="' + attribute['urlPrefix'] + feature.get(attribute['url']) + (attribute['urlSuffix'] || '') +'" target="_blank">' + 
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
    }
    function addFeatureInfo() {


        map.on('click', function(evt) {
          removeOverlays();    
          var overlay = new ol.Overlay({
            element: $('#popup')
          });

          map.addOverlay(overlay);
          var l;
          var identify = true;
          var feature = map.forEachFeatureAtPixel(evt.pixel,
              function(feature, layer) {
                l = layer;
                if(l.get('queryable') == true) {
                  if(feature.get('features')) {
                    if(feature.get('features').length == 1 || map.getView().getResolution() == settings.resolutions[settings.resolutions.length-1]) {
                      return feature.get('features')[0];
                    }
                    else if (feature.get('features').length > 1) {
                      map.getView().setCenter(evt.coordinate);
                      var zoom = map.getView().getZoom();
                      if(zoom + 1 < settings.resolutions.length) {
                        map.getView().setZoom(zoom + 1);                      
                      }
                      identify =false;
                    }
                  }
                  else {
                    return feature;
                  }
                } 
          });

          if (feature && identify) {
              console.log(settings.featureInfoOverlay);
              switch (settings.featureInfoOverlay) {
                  case true:
                      var geometry = feature.getGeometry();
                      var coord;
                      geometry.getType() == 'Point' ? coord = geometry.getCoordinates() : coord = evt.coordinate;
                      overlay.setPosition(coord);
                      var content = getAttributes(feature,l);
                      //If layer have relations to be queried, ie more information
                      if(l.get('relations')) {
                        var format = new ol.format.WKT();
                        var featureCoord = format.writeGeometry(feature.getGeometry()); 
                        wfsCql(l.get('relations'), featureCoord);
                        content += '<br><div class="mdk-more-button">Mer information</div>';
                        Popup.setContent({content: content, title: l.get('title')});            
                        Popup.setVisibility(true);              
                        $('.mdk-more-button').on('click touchend', function(e) {
                          modalMoreInfo();               
                          e.preventDefault();              
                        });
                      }
                      else {
                        Popup.setContent({content: content, title: l.get('title')});            
                        Popup.setVisibility(true);              
                      }           
                      autoPan();
                      break;                     
                  case false:
                      var content = getAttributes(feature,l);
                      sidebar.setContent({content: content, title: l.get('title')});
                      sidebar.setVisibility(true);
                      break;                                 
              }  
          }
          else {
            console.log('No features identified');
          }
          evt.preventDefault();
        });      
    }
    function addGetFeatureInfo() {
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
                      autoPan();

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
          
    }
    function autoPan() {
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
      if(controls.hasOwnProperty('mapmenu')) {
        menuSize = controls.mapmenu.getTarget().offset().left > 0 ? mapSize[0]- controls.mapmenu.getTarget().offset().left : menuSize = 0;                 
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
    }
    function removeOverlays() {
        var overlays = map.getOverlays();
        if (overlays.length > 0) {
            for (var i=0; i < overlays.length; i++) {
              map.removeOverlay(overlays[i]);
            }
        }   
    } 
    function createHome(home) {
        var el = utils.createButton({
            buttonName: 'home-button',
            tooltipText: 'Zooma till hela kartan'
        });
        $('#map').append(el); 
        $('#home-button').on('touchend click', function(e) {
          map.getView().fit(home, map.getSize());
          $('#home-button button').blur();
          e.preventDefault();
        });                                
    }
    function checkSize() {
        var small = map.getSize()[0] < 768;
        attribution.setCollapsible(small);
        attribution.setCollapsed(small);      
    }  

module.exports.init = init;
module.exports.createLayers = createLayers;
module.exports.createLayerGroup = createLayerGroup;
module.exports.loadMap = loadMap;
module.exports.parseArg = parseArg;
module.exports.getSettings = getSettings;
module.exports.getStyleSettings = getStyleSettings;
module.exports.getMapUrl = getMapUrl;
module.exports.getMap = getMap;
module.exports.getLayers = getLayers;
module.exports.getLayer = getLayer;
module.exports.getEditLayer = getEditLayer;
module.exports.getGroup = getGroup;
module.exports.getGroups = getGroups;
module.exports.getProjectionCode = getProjectionCode;
module.exports.getMapSource = getMapSource;
module.exports.addWMS = addWMS;
module.exports.addWMTS = addWMTS;
module.exports.geojson = geojson;
module.exports.wfs = wfs;
module.exports.addMapQuest = addMapQuest;
module.exports.wfsCql = wfsCql;
module.exports.getCqlQuery = getCqlQuery;
module.exports.modalMoreInfo = modalMoreInfo;
module.exports.createStyle = createStyle;
module.exports.styleFunction = styleFunction;
module.exports.createStyleOptions = createStyleOptions;
module.exports.getScale = getScale;
module.exports.scaleToResolution = scaleToResolution;
module.exports.getAttributes = getAttributes;
module.exports.addFeatureInfo = addFeatureInfo;
module.exports.addGetFeatureInfo = addGetFeatureInfo;
module.exports.autoPan = autoPan;
module.exports.removeOverlays = removeOverlays;
module.exports.checkSize = checkSize;
module.exports.setMapOptions = setMapOptions;
