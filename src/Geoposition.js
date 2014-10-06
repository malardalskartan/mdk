/* ========================================================================
 * Copyright 2014 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var Geoposition = (function($){

  var settings = {
      geolocateButtonId: $('#geolocation-button'),
      geolocateButton: $('#geolocation-button button'),
      deltaMean: 500
  };
  var map, geolocation, marker, markerEl, positions;
  var enabled = false;

  return {
    init: function(){
      map = Viewer.getMap();
      // Geolocation marker
      var markerImg = '<img id="geolocation_marker" src="img/geolocation_marker.png" />';
      $('#map').prepend(markerImg);
      markerEl = $('#geolocation_marker');
      marker = new ol.Overlay({
        positioning: 'center-center',
        element: markerEl,
        stopEvent: false
      });

      positions = new ol.geom.LineString([], ('XYZM'));

      geolocation = new ol.Geolocation(({
        projection: map.getView().getProjection(),
        trackingOptions: {
          maximumAge: 10000,
          enableHighAccuracy: true,
          timeout: 600000
        }
      }));

      this.bindUIActions();
    },
    bindUIActions: function() {
      settings.geolocateButtonId.on('touchend click', function(e) {
        enabled = false;
        Geoposition.toggle();
        settings.geolocateButton.blur();
        e.preventDefault();
      });      
    },
    toggle: function() {
      if(settings.geolocateButton.hasClass('geolocation-button-true')){
        settings.geolocateButton.removeClass('geolocation-button-true');        
        geolocation.setTracking(false);

        geolocation.un('change', Geoposition.getPositionVal);
        map.un('postcompose',Geoposition.render);
        map.removeOverlay(marker);
      }
      else {
        settings.geolocateButton.addClass('geolocation-button-true');       
        map.addOverlay(marker);

        // Listen to position changes
        geolocation.on('change', Geoposition.getPositionVal);
        geolocation.setTracking(true); // Start position tracking
        map.on('postcompose',Geoposition.render);
        map.render();
      }        
    },
    getPositionVal: function() {
          var position = geolocation.getPosition();
          var accuracy = geolocation.getAccuracy();
          var heading = geolocation.getHeading() || 0;
          var speed = geolocation.getSpeed() || 0;
          var m = Date.now();

          Geoposition.addPosition(position, heading, m, speed);
    },
    addPosition: function(position, heading, m, speed) {
      var x = position[0];
      var y = position[1];
      var fCoords = positions.getCoordinates();
      var previous = fCoords[fCoords.length - 1];
      var prevHeading = previous && previous[2];
      if (prevHeading) {
        var headingDiff = heading - this.mod(prevHeading);

        // force the rotation change to be less than 180°
        if (Math.abs(headingDiff) > Math.PI) {
          var sign = (headingDiff >= 0) ? 1 : -1;
          headingDiff = - sign * (2 * Math.PI - Math.abs(headingDiff));
        }
        heading = prevHeading + headingDiff;
      }
      positions.appendCoordinate([x, y, heading, m]);

      // only keep the 20 last coordinates
      positions.setCoordinates(positions.getCoordinates().slice(-20));

      // FIXME use speed instead
      if (heading && speed) {
        markerEl.src = 'img/geolocation_marker_heading.png';
      } else {
        markerEl.src = 'img/geolocation_marker.png';
      } 

      var previousM = 0;
      // change center and rotation before render
      map.beforeRender(function(map, frameState) {
        if (frameState !== null) {
          // use sampling period to get a smooth transition
          var m = frameState.time - settings.deltaMean * 1.5;
          m = Math.max(m, previousM);
          previousM = m;
          // interpolate position along positions LineString
          var c = positions.getCoordinateAtM(m, true);
          var view = frameState.viewState;
          if (c && enabled == false && geolocation.getTracking()) {
            marker.setPosition(c);
            map.getView().setCenter(c);
            map.getView().setZoom(10);
            enabled = true;
          }
          else if (c && geolocation.getTracking()) {
            marker.setPosition(c);
          }
        }
        return true; // Force animation to continue
      });

    },
    mod: function(n) {
      return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    },
    getCenterWithHeading: function(position, rotation, resolution) {
      var size = map.getSize();
      var height = size[1];

      return [
        position[0] - Math.sin(rotation) * height * resolution * 1 / 4,
        position[1] + Math.cos(rotation) * height * resolution * 1 / 4
      ];
    },    
    render: function() {
      map.render;
    }     
  };
})(jQuery); 