/**
 * Date Ticks Provider
 *
 * 
 *
 * @module Chartist.DateTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';
	function getTicks(highLow) {
    		var startDate = highLow.low;
    		var endDate = highLow.high;

    		var duration = endDate - startDate;

    		var newStart = this.roundDown(new Date(startDate.getTime()));
    		var newEnd = this.roundUp(new Date(endDate.getTime()));

    		var step = 1;
    		var startTick = this.getStart(newStart);
    		var endTick = this.addStep(newEnd, step);

    		var ticks = [];
    		while(startTick.valueOf() < endTick.valueOf())
    		{
    			ticks.push(startTick);
    			startTick = this.addStep(new Date(startTick.getTime()), step);
    		}
    		return ticks;
    	}

	function addStep(date, step) {
	}

	function getStart(date) {
	}

	function roundDown(date) {
	}

	function roundUp(date) {
	}
	
	function DateTicksProvider() {
	}

  // Creating date tick provider type in Chartist namespace
  Chartist.DateTicksProvider = Chartist.Base.extend({
    constructor: DateTicksProvider,
    getTicks: getTicks,
	addStep: addStep,
	roundDown: roundDown,
	roundUp: roundUp,
	getStart: getStart
  });

}(window, document, Chartist));