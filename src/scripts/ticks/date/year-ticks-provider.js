/**
 * Year Ticks Provider
 *
 * 
 *
 * @module Chartist.YearTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';
		function addStep(date, step) {
			date.setFullYear(date.getFullYear() + step);
			return date;
    	}

    	function getStart(date) {
    		return new Date(date.getFullYear(),1, 0,0,0,0,0);
    	}

    	function roundDown(date) {
    		 return new Date(date.getFullYear(),1, 0,0,0,0,0);
    	}

    	function roundUp(date) {
    	    var res = roundDown(date);
			res.setFullYear(date.getFullYear() + 1);
			return res;
    	}
	
	function YearTicksProvider() {
	}

  // Creating year tick provider type in Chartist namespace
  Chartist.YearTicksProvider = Chartist.DateTicksProvider.extend({
    constructor: YearTicksProvider,
	addStep: addStep,
	roundDown: roundDown,
	roundUp: roundUp,
	getStart: getStart
  });

}(window, document, Chartist));