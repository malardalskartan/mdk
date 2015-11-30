 /* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');

module.exports = {
    createButton: function(options) {
        var tooltip ='';
        var cls = options.className || options.buttonName;
        var placement = options.tooltipPlacement || 'east';
        if(options.tooltipText) {
            tooltip = '<span data-tooltip="' + options.tooltipText + '" data-placement="' + placement + '"></span>';
        }
        var el = '<div id="' + options.buttonName + '" class="mdk-button-container mdk-tooltip">' +
                 '<button class="' + cls + ' mdk-button"></button>' +
                 tooltip +
                 '</div>';
        return el;
    },
    createListButton: function(options) {
        var el = '<li>' +
                    '<div id="' + options.name + '-button" class="menu-button"' + '>' +
                        '<div class="button-icon ' + options.name + '-icon"></div>' +
                            options.text +
                        '</div>' +
                    '</div>' +
                  '</li>';
        return el;
    }
}