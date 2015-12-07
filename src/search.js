/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var Popup = require('./popup');
var typeahead = require("typeahead.js-browserify");
typeahead.loadjQueryPlugin();
var Bloodhound = require("typeahead.js-browserify").Bloodhound;

var adress;
var name, northing, easting, url, title; 

function init(options){

    name = options.searchAttribute;
    northing = options.northing;
    easting = options.easting;
    url = options.url;
    title = options.title || '';

    var el = '<div id="search-wrapper">' +
                '<div id="search" class="search">' +
                    '<input class="search-field typeahead form-control" type="text" placeholder="Sök adress...">' +
                    '<button id="search-button" class="search-false"></button>' +
                '</div>' +
              '</div>';
    $('#map').append(el);
    // constructs the suggestion engine
    // fix for internet explorer
        // constructs the suggestion engine
        // fix for internet explorer
    $.support.cors = true;
    adress = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace(name),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      limit: 10,
      remote: {
        url: url + '?q=&QUERY',
        wildcard: '&QUERY',
        ajax: {
          contentType:'application/json',
          type: 'POST',
          crossDomain: true,
          success: function(data) {
            data.sort(function(a, b) {
              return a[name].localeCompare(b[name]);
            });
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
          }
        }
      }
    });
     
    adress.initialize();
     
    $('.typeahead').typeahead({
      autoSelect: true,
      hint: true,
      highlight: true,
      minLength: 4
    },
    {
      name: 'adress',
      limit: 9,
      displayKey: name,
      source: adress.ttAdapter()
      // templates: {
      //   suggestion: function(data) {
      //     return data.NAMN;
      //   }
      // }
    });

    bindUIActions();
}
function bindUIActions() {
        $('.typeahead').on('typeahead:selected', function(evt, data){
            // alert(data.x);
          // Popup.init('#map');
          Viewer.removeOverlays();
          var map = Viewer.getMap();     
          var overlay = new ol.Overlay({
            element: $('#popup')
          });

          map.addOverlay(overlay);

          var coord = [data[easting], data[northing]];
          overlay.setPosition(coord);
          var content = data[name];
          // content += '<br>' + data.postnr + '&nbsp;' + data.postort;
          Popup.setContent({content: content, title: title});            
          Popup.setVisibility(true);

          map.getView().setCenter([data[easting], data[northing]]);
          map.getView().setZoom(11);          
        });

        $('#search .search-field').on('input', function() {
          if($('#search .search-field.tt-input').val() &&  $('#search-button').hasClass('search-false')) {
            $('#search-button').removeClass('search-false');
            $('#search-button').addClass('search-true');
            onClearSearch();                      
          }
          else if(!($('#search .search-field.tt-input').val()) &&  $('#search-button').hasClass('search-true')) {
            $('#search-button').removeClass('search-true');
            $('#search-button').addClass('search-false');
            offClearSearch();                        
          }       
        });
}
function onClearSearch() {
    $('#search-button.search-true').on('touchend click', function(e) {
      $('.typeahead').typeahead('val', '');
      Popup.setVisibility(false);
      Viewer.removeOverlays();
      $('#search-button').removeClass('search-true');
      $('#search-button').addClass('search-false');          
      $('#search .search-field.tt-input').val('');
      $('#search-button').blur();                    
      e.preventDefault();          
    });
}
function offClearSearch() {
    $('#search-button.search-true').off('touchend click', function(e) {
      e.preventDefault();                 
    });
}

module.exports.init = init;

