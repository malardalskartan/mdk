/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var sidebar;

function init() {
    var el = '<div id="sidebar">' +
                '<div class="sidebar">' +
                  '<div class="mdk-close-button"></div>' +
                  '<div class="sidebar-title"></div>' +
                  '<div class="sidebar-content"></div>' +
                '</div>' +    
              '</div>';
    $('#map').append(el);
    sidebar = $('#sidebar');    

    bindUIActions();
    // addLegend(viewer.getGroups());
}
function bindUIActions() {
    $('#sidebar .sidebar .mdk-close-button').on('touchend click', function(evt) {
        closeSidebar();
        evt.preventDefault();
    });
}
function setVisibility(visible) {  
    visible == true ? $('#sidebar').addClass('sidebar-show') : $('#sidebar').removeClass('sidebar-show');
}
function setContent(config) {
    config.title ? $('#sidebar .sidebar .sidebar-title').html(config.title): $('#sidebar .sidebar .sidebar-title').html('');
    config.content ? $('#sidebar .sidebar .sidebar-content').html(config.content): $('#sidebar .sidebar .sidebar-content').html('');            
}
function closeSidebar() {
    setVisibility(false);
}    

module.exports.init = init;
module.exports.setVisibility = setVisibility;
module.exports.setContent = setContent;
module.exports.closeSidebar = closeSidebar;