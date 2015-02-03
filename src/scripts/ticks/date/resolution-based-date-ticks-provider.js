/**
 * Resolution Based Date Ticks Provider
 *
 * 
 *
 * @module Chartist.ResolutionBasedDateTicksProvider
 */
/* global Chartist */
(function(window, document, Chartist){
  'use strict';
	function getTicks(highLow) {
    		var startDate = highLow.low;
    		var endDate = highLow.high;

    		var duration = endDate - startDate;
    		var bestProvider = getProviderBasedOnDuration(duration);

    		var newStart = bestProvider.roundDown(new Date(startDate.getTime()));
    		var newEnd = bestProvider.roundUp(new Date(endDate.getTime()));

    		var step = 1;
    		var startTick = bestProvider.getStart(newStart);
    		var endTick = bestProvider.addStep(newEnd, step);

    		var ticks = [];
    		while(startTick.valueOf() < endTick.valueOf())
    		{
    			ticks.push(startTick);
    			startTick = bestProvider.addStep(new Date(startTick.getTime()), step);
    		}
    		return ticks;
    	}

  	function getProviderBasedOnDuration(duration) {
  		if(duration > 31556952000)
  		{
  			return new Chartist.YearTicksProvider();
  		}
  		if(duration > 2592000000)
  		{
  			return new Chartist.MonthTicksProvider();
  		}
  		if(duration > 86400000)
  		{
  			return new Chartist.DayTicksProvider();
  		}
  		if(duration > 3600000)
  		{
  			return new Chartist.HourTicksProvider();
  		}
  		if(duration > 60000)
  		{
  			return new Chartist.MinuteTicksProvider();
  		}
  		if(duration > 1000)
  		{
  			return new Chartist.MillisecondsTicksProvider();
  		}

  		return new Chartist.MillisecondsTicksProvider();
  	}
	
	function ResolutionBasedTicksProvider() {
	}

  // Creating date tick provider type in Chartist namespace
  Chartist.ResolutionBasedTicksProvider = Chartist.DateTicksProvider.extend({
    constructor: ResolutionBasedTicksProvider,
    getTicks: getTicks
  });

}(window, document, Chartist));