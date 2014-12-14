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

