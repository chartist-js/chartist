/**
 * Hour Ticks Provider
 *
 * 
 *
 * @module Chartist.HourTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';

  	function addStep(date, step) {
    	date.setHours(date.getHours() + step);
		return date;
	}

	function getStart(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),0,0,0);
	}

	function roundDown(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),0,0,0);
	}

	function roundUp(date) {
		var res = roundDown(date);
		res.setHours(date.getHours() + 1);
		return res;
	}
	
	function HourTicksProvider() {
	}

  // Creating hour tick provider type in Chartist namespace
  Chartist.HourTicksProvider = Chartist.DateTicksProvider.extend({
    constructor: HourTicksProvider,
	addStep: addStep,
	roundDown: roundDown,
	roundUp: roundUp,
	getStart: getStart
  });

}(window, document, Chartist));