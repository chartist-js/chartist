/**
 * Milliseconds Ticks Provider
 *
 * 
 *
 * @module Chartist.MillisecondsTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';

  	function addStep(date, step) {
    	date.setMilliseconds(date.getMilliseconds() + step);
		return date;
	}

	function getStart(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),date.getMinutes(),date.getSeconds(),date.getMilliseconds());
	}

	function roundDown(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),date.getMinutes(),date.getSeconds(),date.getMilliseconds());
	}

	function roundUp(date) {
    	    var res = roundDown(date);
			res.setMilliseconds(date.getMilliseconds() + 1);
    		return res;
    	}
	
	function MillisecondsTicksProvider() {
	}

  // Creating ms tick provider type in Chartist namespace
  Chartist.MillisecondsTicksProvider = Chartist.DateTicksProvider.extend({
    constructor: MillisecondsTicksProvider,
	addStep: addStep,
	roundDown: roundDown,
	roundUp: roundUp,
	getStart: getStart
	
  });

}(window, document, Chartist));