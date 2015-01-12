/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var Search = (function($){

  var adress;

  return {
    init: function(){
        // constructs the suggestion engine
        // fix for internet explorer
        $.support.cors = true;
        adress = new Bloodhound({
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('adressomrade'),
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          limit: 10,
          remote: {
            url: 'http://localhost:3001/addressok?s=%QUERY',
            ajax: {
              contentType:'application/json',
              type: 'POST',
              crossDomain: true,
              success: function(data) {
                data.sort(function(a, b) {
                  return a.adressomrade.localeCompare(b.adressomrade);
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
          autoselect: true,
          hint: true,
          highlight: true,
          minLength: 4
        },
        {
          name: 'adress',
          displayKey: 'adressomrade',
          source: adress.ttAdapter(),
          templates: {
            suggestion: function(data) {
              return data.adressomrade + ', ' + data.kommunnamn;
            }
          }
        });

        this.bindUIActions();
    },
    bindUIActions: function() {
        $('.typeahead').on('typeahead:selected', function(evt, data){
            // alert(data.x);
          // Popup.init('#map');
          Viewer.removeOverlays();
          var map = Viewer.getMap();     
          var overlay = new ol.Overlay({
            element: $('#popup')
          });

          map.addOverlay(overlay);

          // adressplatspunkt: {srsName: "EPSG:3006", gml:pos: "6611684.407 627413.711"}
          var srs = data.adressplatspunkt['srsName'];
          var mapSrs = Viewer.getSettings()['projectionCode'];
          var coord = data.adressplatspunkt['gml:pos'].split(' ').reverse();
          if (srs != mapSrs) {
            coord = ol.proj.transform(coord, srs, mapSrs);         
          }

          overlay.setPosition(coord);

          var content = data.adressomrade;
          content += '<br>' + data.postnummer + ' ' + data.kommunnamn;
          var title = 'Adress';
          Popup.setContent({content: content, title: title});            
          Popup.setVisibility(true);

          map.getView().setCenter(coord);
          map.getView().setZoom(11);          
        });

        $('#search .search-field').on('input', function() {
          if($('#search .search-field.tt-input').val() &&  $('#search-button').hasClass('search-false')) {
            $('#search-button').removeClass('search-false');
            $('#search-button').addClass('search-true');
            Search.onClearSearch();                      
          }
          else if(!($('#search .search-field.tt-input').val()) &&  $('#search-button').hasClass('search-true')) {
            $('#search-button').removeClass('search-true');
            $('#search-button').addClass('search-false');
            Search.offClearSearch();                        
          }       
        });
    },
    onClearSearch: function() {
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
    },
    offClearSearch: function() {
        $('#search-button.search-true').off('touchend click', function(e) {
          e.preventDefault();                 
        });
    }
  };
})(jQuery); 



