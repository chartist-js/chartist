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

  $('[data-sticky]').each(function() {
    var $element = $(this),
      initialOffset = $element.offset().top,
      margin = $element.data('sticky') || 0;

    $(window).on('scroll', function() {
      var scrollTop = $(window).scrollTop();

      if(scrollTop > initialOffset - margin) {
        $element.css({
          position: 'relative',
          top: scrollTop + margin - initialOffset
        });
      } else {
        $element.css({
          position: '',
          top: ''
        });
      }
    });
  });
});

// Initialize foundation
$(document).foundation({
  topbar: {
    scrolltop: false
  }
});