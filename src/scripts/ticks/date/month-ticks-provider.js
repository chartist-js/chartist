/**
 * Month Ticks Provider
 *
 * 
 *
 * @module Chartist.MonthTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';
  
  	function addStep(date, step) {
    	date.setMonth(date.getMonth() + step);
		return date;
	}

	function getStart(date) {
		return new Date(date.getFullYear(), date.getMonth(),  1, 0,0,0,0);
	}

	function roundDown(date) {
		return new Date(date.getFullYear(), date.getMonth(),  1, 0,0,0,0);
	}

	function roundUp(date) {
		var res = roundDown(date);
		res.setMonth(date.getMonth() + 1);
		return res;
	}
	
	function MonthTicksProvider() {
	}

  // Creating month tick provider type in Chartist namespace
  Chartist.MonthTicksProvider = Chartist.DateTicksProvider.extend({
    constructor: MonthTicksProvider,
	addStep: addStep,
	roundDown: roundDown,
	roundUp: roundUp,
	getStart: getStart
  });

}(window, document, Chartist));