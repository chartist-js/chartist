'use strict';

// Initialize highlight.js
window.hljs.initHighlightingOnLoad();

// Generic data-* driven control behaviour
$(function() {
  $('[data-toggle-visible]').each(function() {
    var $element = $(this),
      $target = $($element.data('toggleVisible'));

    $target.addClass('invisible');
    $element.on('click', function(e) {
      $target.toggleClass('invisible');
      e.preventDefault();
    });
  });
});

// Initialize foundation
$(document).foundation();