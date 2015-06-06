'use strict';

// Initialize highlight.js
window.hljs.initHighlightingOnLoad();

function evalChartistCode(code, chartElement) {
  // Modify the code to use a proper selector using the ID of the example as well as return the Chartist object
  var modified = code.replace(/.*Chartist\s*\.\s*(.+)\(\s*['"](.+)['"]/, function(match, type) {
    return ['var chart = new Chartist.', type, '(chartElement'].join('');
  }) + '; return chart;';

  // Remove any declaration of $chart as we are passing $chart to our function eval
  modified = modified.replace(/var \$chart.+;/, '');

  var $chartElement = $(chartElement).empty();

  try {
    // Create function from the modified code and execute it
    return (new Function(['chartElement', '$chart'], modified)(chartElement, $chartElement)); // jshint ignore:line
  } catch(err) {
    // Maybe show error in the future
  }
}

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

  $('[data-example]').each(function() {
    var $element = $(this),
      code = window.atob($element.data('example'));

    // Execute the Chartist code immediately
    evalChartistCode(code, $element.get(0));
  });

  $('[data-live-example]').each(function() {
    var $element = $(this),
      $editor = $element.find('.code-editor'),
      initialCode = window.atob($element.data('liveExample')),
      chartist,
      cm;

    function updateChart() {
      if(chartist) {
        chartist.update();
      }
    }

    function initializeCodeMirror() {
      if(cm) {
        return;
      }

      cm = window.CodeMirror.fromTextArea($editor.get(0), {
        mode: 'javascript',
        theme: 'chartist',
        lineWrapping: true,
        indentUnit: 2,
        tabSize: 2
      });

      cm.on('change', function(event) {
        // Execute the Chartist code once the code gets updated
        chartist = evalChartistCode(event.doc.getValue(), $element.find('.ct-chart').get(0));
      });
    }

    $element.find('.edit-button').on('click', function() {
      $element.addClass('edit-mode');
      updateChart();
      initializeCodeMirror();
    });

    $element.find('.close-edit-button').on('click', function() {
      $element.removeClass('edit-mode');
      updateChart();
    });

    $editor.val(initialCode);

    // Execute the Chartist code immediately
    chartist = evalChartistCode(initialCode, $element.find('.ct-chart').get(0));
  });
});

// Initialize foundation
$(document).foundation({
  topbar: {
    scrolltop: false
  }
});
