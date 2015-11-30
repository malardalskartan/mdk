/* ========================================================================
 * Copyright 2015 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */

var Modal = function(modalTarget, options){

  var object = {
    target: $(modalTarget),
    title: options.title || undefined,
    content: options.content || undefined,
    footer: options.footer || undefined,
    modal: null,
    bindUIActions: function() {
      var that = this;
      $('.modal-screen, .close-button').click(function() {
        that.closeModal();
      });   
    },
    createModal: function() {
      this.modal = '<div id="modal">' +
                    '<div class="modal-screen"></div>' +
                    '<div class="modal">' +
                    '<div class="close-button"></div>' +
                    '<div class="modal-title">' + this.title + '</div>' +
                    '<div class="modal-content">' + this.content +'</div>' +
                    '</div>' +
                    '</div>';           
    },
    showModal: function() {
      this.createModal();
      this.target.prepend(this.modal);
      this.bindUIActions();
    },
    closeModal: function() {
      $('#modal').remove();
    }
  };
  return object;
};	