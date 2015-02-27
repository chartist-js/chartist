v0.7.3 - 27 Feb 2015
--------------------
- Fixed bugs in the chart.update method 
- Fixed rounding precision issues in order of magnitude calculation
- Fixed bug in Chartist.extend which caused merge problems from object properties into non-objects
- Added possibility to use chartPadding with a padding object that contains top, right, bottom and left properties

v0.7.2 - 12 Feb 2015
--------------------
- Added new line smoothing / interpolation module for configurable line smoothing
- Added simple line smoothing. Thanks @danieldiekmeier !
- Removed some unused internal code

v0.7.1 - 02 Feb 2015
--------------------
- Bug fix where some files where not included in dist version of Chartist which made v0.7.0 unusable.

v0.7.0 - 01 Feb 2015
--------------------
- This version introduces a new option in the bar charts to draw them horizontally
- Underlying changes for axis model that allows flexible value projection and removes code duplication
- Added SVG Path API for manipulating SVG paths. This can be used in animations or to transform the output by Chartist further.
- The fullWidth and centerBars options were removed from the bar chart
- Updating chart after options update enables the use of 'print' media query in responsive options to have a quick redraw before printing. This only works in Chrome 40 so far
- Fixed issues with 0 values in series object data notation

v0.6.1 - 23 Jan 2015
--------------------
- Fixed bug that prevented data events to be captured
- Fixed bug with update function called in the same call stack as chart constructor

v0.6.0 - 17 Jan 2015
--------------------
- Added 14 default colors for colored series
- Added data event that allows you to transform the data before it gets rendered in Chartist. This is also useful for plugin authors that would like to create plugins which modify data.
- Possibility to specify meta data in the data object passed to Chartist that will be written to custom attributes into the DOM.
- Possibility to specify options when calling chart.update in order to override the current options with new ones
- Fixed some missing entries in the bower ignore section to exclude the documentation site as well as the grunt tasks
- Fixed issue when Chartist is initialized in a container that already contains SVG

v0.5.0 - 14 Dec 2014
--------------------
- Added new option for line and bar chart to use full width of the chart area by skipping the last grid line
- Added new option for bar chart to create stacked bar charts
- All chart update functions now accepts an optional data parameter that allows to update an existing chart with new data
- Fix for an error when charts get re-constructed on the same element and in the same call stack

v0.4.4 - 11 Dec 2014
--------------------
- Fixed NS_ERROR_FAILURE error in Firefox and added graceful handling of unsupported SMIL animations (i.e. in foreignObjects)

v0.4.3 - 27 Nov 2014
--------------------
- Updated plugin architecture for convenience reasons and better support for modularization

v0.4.2 - 27 Nov 2014
--------------------

- Included first version of Chartist.js Plugin mechanism
- Major refactoring of development stack (thanks @Autarc !)
- Removed unused functions in Chartist.Core

v0.4.1 - 21 Nov 2014
--------------------

- Added more functionality to Chartist.Svg: select child elements, parent, root as well as a Svg list wrapper with delegation functions
- Fixed bug in strip unit
- Added classes to the label and grid gorups
- Added this as return value so calls to chart can be chained up easily


v0.4.0 - 17 Nov 2014
--------------------

- Added new animation API for SMIL animations
- Added possibility to add event handlers with asterisk that will be triggerd on all events including the event name in the cb function
- Added possibility to pass DOM node to SVG constructor so you can wrap existing SVG nodes into a Chartist.Svg element
- Fixed svg recycling on re-creation
- Fixed resize listener detach that wasn't working properly
- Refactored Chartist.Svg to use Chartist.Class
- Including event when line and area is drawn
- Changed default scaleMinSpace to 20 to be more mobile friendly
- Fixed bug with line area base

