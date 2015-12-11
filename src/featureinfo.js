/* ========================================================================
 * Copyright 2015 Mälardalskartan
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

    sidebar.init();
    Popup.init('#map');

    map.on('click', function(evt) {

      if(select) {
          select.getFeatures().clear();
          map.removeInteraction(select);
      }

      Viewer.removeOverlays();
      var overlay = new ol.Overlay({
        element: $('#popup')
      });

      map.addOverlay(overlay);

      var identify = true;
      var l, layers = [];
      var features = [];
      var content ='';
      map.forEachFeatureAtPixel(evt.pixel,
          function(feature, layer) {
            l = layer;
            var queryable = false;
            if(layer) {
                queryable = layer.get('queryable');
            }
            if(feature.get('features')) {
                if (feature.get('features').length > 1) {
                  map.getView().setCenter(evt.coordinate);
                  var zoom = map.getView().getZoom();
                  if(zoom + 1 < Viewer.getResolutions().length) {
                    map.getView().setZoom(zoom + 1);
                  }
                  identify =false;
                }
                else if(feature.get('features').length == 1 && queryable) {
                    layers.push(l);
                    features.push(feature.get('features')[0]);
                    content += getAttributes(feature.get('features')[0],l);
                }
            }
            else if(queryable) {
                layers.push(l);
                features.push(feature);
                content += getAttributes(feature,l);
            }
          });

      if (features.length > 0 && identify) {
          select = new ol.interaction.Select({layers: layers});
          map.addInteraction(select);
          content = '<div id="identify"><div id="mdk-identify-carousel" class="owl-carousel owl-theme">' + content + '</div></div>';
          switch (showOverlay) {
              case true:
                  var geometry = features[0].getGeometry();
                  var coord;
                  geometry.getType() == 'Point' ? coord = geometry.getCoordinates() : coord = evt.coordinate;
                  overlay.setPosition(coord);
                  //If layer have relations to be queried, ie more information
                  // if(l.get('relations')) {
                  //   var format = new ol.format.WKT();
                  //   var featureCoord = format.writeGeometry(features[0].getGeometry());
                  //   wfsCql(l.get('relations'), featureCoord);
                  //   content += '<br><div class="mdk-more-button">Mer information</div>';
                  //   Popup.setContent({content: content, title: l.get('title')});
                  //   Popup.setVisibility(true);
                  //   $('.mdk-more-button').on('click touchend', function(e) {
                  //     modalMoreInfo();
                  //     e.preventDefault();
                  //   });
                  // }
                  // else {
                    Popup.setContent({content: content, title: l.get('title')});
                    Popup.setVisibility(true);
                    var owl = initCarousel('#mdk-identify-carousel', undefined, function(){
                        var currentItem = this.owl.currentItem;
                        maputils.clearAndSelect(select, features[currentItem]);
                        Popup.setTitle(layers[currentItem].get('title'));
                    });
                  // }
                  var owl = initCarousel('#mdk-identify-carousel');
                  Viewer.autoPan();
                  break;
              case false:
                  sidebar.setContent({content: content, title: l.get('title')});
                  sidebar.setVisibility(true);
                  var owl = initCarousel('#mdk-identify-carousel', undefined, function(){
                      var currentItem = this.owl.currentItem;
                      maputils.clearAndSelect(select, features[currentItem]);
                      sidebar.setTitle(layers[currentItem].get('title'));
                  });
                  break;
          }
      }
      else {
        console.log('No features identified');
        sidebar.setVisibility(false);
      }
      evt.preventDefault();
    });
    function initCarousel(id, options, cb) {
        var carouselOptions = options || {
          navigation : true, // Show next and prev buttons
          slideSpeed : 300,
          paginationSpeed : 400,
          singleItem:true,
          rewindSpeed:200,
          navigationText: ["&#xf053;", "&#xf054;"],
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
}