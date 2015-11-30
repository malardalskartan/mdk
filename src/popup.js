/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var $ = require('jquery');

function init(target){
    var pop = '<div id="popup">' +
                '<div class="popup">' +
                '<div class="mdk-close-button"></div>' +
                '<div class="popup-title"></div>' +
                '<div class="popup-content"></div>' +
                '</div>' +
              '</div>';      
    $(target).append(pop);
    bindUIActions();
}
function bindUIActions() {
    $('#popup .popup .mdk-close-button').on('touchend click', function(evt) {
        closePopup();
        evt.preventDefault();
    });   
}  
function setVisibility(visible) {
    visible == true ? $('#popup .popup').css('display', 'block') : $('#popup .popup').css('display', 'none');
}
function setContent(config) {
    config.title ? $('#popup .popup .popup-title').html(config.title): $('#popup .popup .popup-title').html('');
    config.content ? $('#popup .popup .popup-content').html(config.content): $('#popup .popup .popup-content').html('');            
}
function closePopup() {
    setVisibility(false);
}    

module.exports.init = init;
module.exports.setVisibility = setVisibility;
module.exports.setContent = setContent;
module.exports.closePopup = closePopup;