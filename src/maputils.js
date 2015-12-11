/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var $ = require('jquery');

module.exports = {
  clearAndSelect: function(selection, feature) {
      selection.getFeatures().clear();
      selection.getFeatures().push(feature);
  }
}
