/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var Popup = require('./popup');
var sidebar = require('./sidebar');
var maputils = require('./maputils');
var owlCarousel = require('../externs/owlcarousel-browserify');
owlCarousel.loadjQueryPlugin();

module.exports = function(options) {

    var select;
    var map = Viewer.getMap();
    var settings = options ? options : {};
    var showOverlay = settings.hasOwnProperty('overlay') ? settings.overlay : true;
    var identifyTarget;
    if(showOverlay) {
        Popup.init('#map');
        identifyTarget = 'overlay';
    }
    else {
        sidebar.init();
        identifyTarget = 'sidebar';
    }

    map.on('click', function(evt) {
        if(select) {
            select.getFeatures().clear();
            map.removeInteraction(select);
        }
        Viewer.removeOverlays();
        //Featurinfo in two steps. First serverside and client side when finished
        var clientResult = forEachFeatureAtPixel(evt);
        if(clientResult !== false) {
            var result = [],
            serverResult = [],
            promiseFn = [];
            forEachLayerAtPixel(evt).map(function(request) {
                request.fn.done(function(data) {
                    var feature = geojsonToFeature(data),
                    layer = Viewer.getLayer(request.layer);
                    if(feature) {
                        serverResult.push({
                            layer: layer,
                            feature: feature,
                            content: getAttributes(feature, layer)
                        });
                    }
                });
                promiseFn.push(request.fn);
            });
            //When server side finished do client side
            $.when.apply($, promiseFn).done(function() {
                result = serverResult.concat(clientResult);
                if (result.length > 0) {
                    identify(result, identifyTarget, evt.coordinate)
                }
                else {
                  console.log('No features identified');
                  Popup.setVisibility(false);
                  sidebar.setVisibility(false);
                }
            });
        }
        evt.preventDefault();
    });
    function forEachLayerAtPixel(evt) {
        var requests = [];
        //Check for support of crossOrigin in image, absent in IE 8 and 9
        if('crossOrigin' in new(Image)) {
            map.forEachLayerAtPixel(evt.pixel, function(layer) {
                var item = getGetFeatureInfoRequest(layer, evt.coordinate);
                if(item) {requests.push(item)};
            });
        }
        //If canvas is tainted
        else if(isTainted(evt.pixel)) {
            var layers = Viewer.getQueryableLayers();
            layers.forEach(function(layer) {
                //If layer is tainted, then create request for layer
                if(isTainted(evt.pixel, layer)) {
                    var item = getGetFeatureInfoRequest(layer, evt.coordinate);
                    if(item) {requests.push(item)};
                }
                //If layer is not tainted, test if layer hit at pixel
                else if(layerAtPixel(evt.pixel, layer)){
                    var item = getGetFeatureInfoRequest(layer, evt.coordinate);
                    if(item) {requests.push(item)};
                }
            });
        }
        //If crossOrigin is not supported and canvas not tainted
        else {
            map.forEachLayerAtPixel(evt.pixel, function(layer) {
                var item = getGetFeatureInfoRequest(layer, evt.coordinate);
                if(item) {requests.push(item)};
            });
        }
        return requests;
    }
    function forEachFeatureAtPixel(evt) {
        var result = [],
        cluster = false;
        map.forEachFeatureAtPixel(evt.pixel,
            function(feature, layer) {
              var item = {};
              var l = layer;
              var queryable = false;
              if(layer) {
                  queryable = layer.get('queryable');
              }
              if(feature.get('features')) {
                  //If cluster
                  if (feature.get('features').length > 1) {
                    map.getView().setCenter(evt.coordinate);
                    var zoom = map.getView().getZoom();
                    if(zoom + 1 < Viewer.getResolutions().length) {
                      map.getView().setZoom(zoom + 1);
                    }
                    cluster = true;
                    return true;
                  }
                  else if(feature.get('features').length == 1 && queryable) {
                      item.layer = l;
                      item.feature = feature.get('features')[0];
                      item.content = getAttributes(feature.get('features')[0],l)
                      result.push(item);
                  }
              }
              else if(queryable) {
                  item.layer = l;
                  item.feature = feature;
                  item.content = getAttributes(feature,l)
                  result.push(item);
              }

            });
        if(cluster) {
            return false;
        }
        else {
            return result;
        }
    }
    function getGetFeatureInfoRequest(layer, coordinate) {
        var layerType = layer.get('type'),
        obj = {};
        switch (layerType) {
          case 'WMTS':
            return undefined;
            break;
          case 'WMS':
            var url = layer.getSource().getGetFeatureInfoUrl(
            coordinate, map.getView().getResolution(), Viewer.getProjection(),
            {'INFO_FORMAT': 'application/json'});
            obj.layer = layer.get('name');
            obj.cb = "GEOJSON";
            obj.fn = getFeatureInfo(url);
            return obj;
            break;
          default:
            return undefined;
        }
    }
    function getFeatureInfo(url) {
        return $.ajax(url, {
          type: 'post'
        });
    }
    function identify(items, target, coordinate) {
        var layers = items.map(function(i){
            return i.layer;
        });
        select = new ol.interaction.Select({layers: layers});
        map.addInteraction(select);
        var content = items.map(function(i){
            return i.content;
        }).join('');
        content = '<div id="identify"><div id="mdk-identify-carousel" class="owl-carousel owl-theme">' + content + '</div></div>';
        switch (target) {
            case 'overlay':
                var overlay = new ol.Overlay({
                  element: $('#popup').get(0)
                });
                map.addOverlay(overlay);
                var geometry = items[0].feature.getGeometry();
                var coord;
                geometry.getType() == 'Point' ? coord = geometry.getCoordinates() : coord = coordinate;
                overlay.setPosition(coord);
                Popup.setContent({content: content, title: items[0].layer.get('title')});
                Popup.setVisibility(true);
                var owl = initCarousel('#mdk-identify-carousel', undefined, function(){
                    var currentItem = this.owl.currentItem;
                    maputils.clearAndSelect(select, items[currentItem].feature);
                    Popup.setTitle(items[currentItem].layer.get('title'));
                });
                Viewer.autoPan();
                break;
            case 'sidebar':
                sidebar.setContent({content: content, title: items[0].layer.get('title')});
                sidebar.setVisibility(true);
                var owl = initCarousel('#mdk-identify-carousel', undefined, function(){
                    var currentItem = this.owl.currentItem;
                    maputils.clearAndSelect(select, items[currentItem].feature);
                    sidebar.setTitle(items[currentItem].layer.get('title'));
                });
                break;
        }
    }
    function geojsonToFeature(obj) {
        var vectorSource = new ol.source.Vector({
          features: (new ol.format.GeoJSON()).readFeatures(obj)
        });
        return vectorSource.getFeatures()[0];
    }
    function initCarousel(id, options, cb) {
        var carouselOptions = options || {
          navigation : true, // Show next and prev buttons
          slideSpeed : 300,
          paginationSpeed : 400,
          singleItem:true,
          rewindSpeed:200,
          navigationText: ['<svg class="mdk-icon-fa-chevron-left"><use xlink:href="css/svg/fa-icons.svg#fa-chevron-left"></use></svg>', '<svg class="mdk-icon-fa-chevron-right"><use xlink:href="css/svg/fa-icons.svg#fa-chevron-right"></use></svg>'],
          afterAction: cb
        };
        return $(id).owlCarousel(carouselOptions);
    }
    function getAttributes(feature, layer) {
      var content = '<div><ul>';
      var attribute, li = '', title, val;
      //If layer is configured with attributes
      if(layer.get('attributes')) {
        for(var i=0; i<layer.get('attributes').length; i++) {
          attribute = layer.get('attributes')[i];
          title = '';
          val = '';
          if (attribute['name']) {
            if(feature.get(attribute['name'])) {
                val = feature.get(attribute['name']);
                if (attribute['title']) {
                  title = '<b>' + attribute['title'] + '</b>';
                }
                if (attribute['url']) {
                  var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], feature.get(attribute['url']));
                  val = '<a href="' + url + '" target="_blank">' +
                        feature.get(attribute['name']) +
                        '</a>';
                }
            }
          }
          else if (attribute['url']) {
              if(feature.get(attribute['url'])) {
                  var text = attribute['html'] || attribute['url'];
                  var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], feature.get(attribute['url']));
                  val = '<a href="' + url + '" target="_blank">' +
                        text +
                        '</a>';
              }
          }
          else if (attribute['img']) {
              if(feature.get(attribute['img'])) {
                  var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], feature.get(attribute['img']));
                  var attribution = attribute['attribution'] ? '<div class="image-attribution">' + attribute['attribution'] + '</div>' : '';
                  val = '<div class="image-container">' +
                            '<img src="' + url + '">' + attribution +
                        '</div>';
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
    function createUrl(prefix, suffix, url) {
        var p = prefix || '';
        var s = suffix || '';
        return p + url + s;
    }
    function isTainted(pixel, layerFilter) {
        try {
            if(layerFilter) {
                map.forEachLayerAtPixel(pixel, function(layer) {
                    return layerFilter === layer;
                });
            }
            else {
                map.forEachLayerAtPixel(pixel, function(layer) {});
            }
            return false;
        }
        catch(e) {
            console.log(e);
            return true;
        }
    }
    function layerAtPixel(pixel, matchLayer) {
        map.forEachLayerAtPixel(pixel, function(layer) {
            return matchLayer === layer;
        })
    }
}
