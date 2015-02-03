/**
 * Seconds Ticks Provider
 *
 * 
 *
 * @module Chartist.SecondsTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';
  	function addStep(date, step) {
    	date.setSeconds(date.getSeconds() + step);
		return date;
	}

	function getStart(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),date.getMinutes(),date.getSeconds(),0);
	}

	function roundDown(date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),date.getMinutes(),date.getSeconds(),0);
	}

	function roundUp(date) {
		var res = roundDown(date);
		res.setSeconds(date.getSeconds() + 1);
		return res;
	}
	
	function SecondsTicksProvider() {
	}

  // Creating seconds tick provider type in Chartist namespace
  Chartist.SecondsTicksProvider = Chartist.DateTicksProvider.extend({
    constructor: SecondsTicksProvider,
	addStep: addStep,
	roundDown: roundDown,
	roundUp: roundUp,
	getStart: getStart
  });

}(window, document, Chartist));