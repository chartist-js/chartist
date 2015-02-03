/**
 * Minute Ticks Provider
 *
 * 
 *
 * @module Chartist.MinuteTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';

  	function addStep(date, step) {
    	date.setMinutes(date.getMinutes() + step);
		return date;
	}

	function getStart(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),date.getMinutes(),0,0);
	}

	function roundDown(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),date.getMinutes(),0,0);
	}

	function roundUp(date) {
		var res = roundDown(date);
		res.setMinutes(date.getMinutes() + 1);
		return res;
	}
	
	function MinuteTicksProvider() {
	}

  // Creating minute tick provider type in Chartist namespace
  Chartist.MinuteTicksProvider = Chartist.DateTicksProvider.extend({
    constructor: MinuteTicksProvider,
	addStep: addStep,
	roundDown: roundDown,
	roundUp: roundUp,
	getStart: getStart
  });

}(window, document, Chartist));