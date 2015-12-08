"use strict";

window.proj4 = require('proj4');
global.jQuery = require("jquery");

var mdk = {};
mdk.map = require('./src/viewer');

module.exports = mdk;
