/**
 * Day Ticks Provider
 *
 * 
 *
 * @module Chartist.DayTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';

  	function addStep(date, step) {
    	date.setDate(date.getDate() + step);
		return date;
	}

	function getStart(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);
	}

	function roundDown(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0,0,0,0);
	}

	function roundUp(date) {
		var res = roundDown(date);
		res.setDate(date.getDate() + 1);
		return res;
	}
	
	function DayTicksProvider() {
	}

  // Creating day tick provider type in Chartist namespace
  Chartist.DayTicksProvider = Chartist.DateTicksProvider.extend({
    constructor: DayTicksProvider,
	addStep: addStep,
	roundDown: roundDown,
	roundUp: roundUp,
	getStart: getStart
  });

}(window, document, Chartist));