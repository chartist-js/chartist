# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.3.0](https://github.com/chartist-js/chartist/compare/v1.2.1...v1.3.0) (2022-11-03)


### Features

* accumulate-relative stacked bar chart stack mode ([#1375](https://github.com/chartist-js/chartist/issues/1375)) ([ce13067](https://github.com/chartist-js/chartist/commit/ce13067acec9cee050af979d323dae5e728292c4)), closes [#1167](https://github.com/chartist-js/chartist/issues/1167)


### Bug Fixes

* add dist exports ([#1374](https://github.com/chartist-js/chartist/issues/1374)) ([1438bad](https://github.com/chartist-js/chartist/commit/1438bad5b8754fe0744c4c1c8540c08a4c4e6862)), closes [#1368](https://github.com/chartist-js/chartist/issues/1368)
* add missing default for text-line-height ([#1373](https://github.com/chartist-js/chartist/issues/1373)) ([f94e559](https://github.com/chartist-js/chartist/commit/f94e559c2414d17002ee52421b860d91b6eae0af))

### [1.2.1](https://github.com/chartist-js/chartist/compare/v1.2.0...v1.2.1) (2022-10-05)


### Bug Fixes

* data normalization with alignment ([#1365](https://github.com/chartist-js/chartist/issues/1365)) ([fe11d2f](https://github.com/chartist-js/chartist/commit/fe11d2f6d9e55455286bc34d3eed93b587f1313c)), closes [#1235](https://github.com/chartist-js/chartist/issues/1235)
* reverse data correctly [#1250](https://github.com/chartist-js/chartist/issues/1250) ([#1364](https://github.com/chartist-js/chartist/issues/1364)) ([0223b1f](https://github.com/chartist-js/chartist/commit/0223b1ff2c69a919e3d776b58fb9b5cc96654987))

## [1.2.0](https://github.com/chartist-js/chartist/compare/v1.1.3...v1.2.0) (2022-10-03)


### Features

* dist scss styles sources ([#1362](https://github.com/chartist-js/chartist/issues/1362)) ([d0efcb0](https://github.com/chartist-js/chartist/commit/d0efcb00aa45e1d4611a16472da758ead8148f7b))
* remove legacy styles fallbacks ([#1363](https://github.com/chartist-js/chartist/issues/1363)) ([831673f](https://github.com/chartist-js/chartist/commit/831673f9dff080d1c762db2bc5da397eb0b55ab9))


### Bug Fixes

* SvgPath.parse fails on negative values ([#1360](https://github.com/chartist-js/chartist/issues/1360)) ([cf6831d](https://github.com/chartist-js/chartist/commit/cf6831d2f7e08dddb497d6b7ce5354e0976779ab))

### [1.1.3](https://github.com/chartist-js/chartist/compare/v1.1.2...v1.1.3) (2022-09-23)


### Bug Fixes

* B and I series have the same color value ([#1356](https://github.com/chartist-js/chartist/issues/1356)) ([6f5ad92](https://github.com/chartist-js/chartist/commit/6f5ad92795755b1e50775cf7b837d20700f3e334))
* label position fix ([#1357](https://github.com/chartist-js/chartist/issues/1357)) ([fbc13e2](https://github.com/chartist-js/chartist/commit/fbc13e22c334a46e9097f7115c1616fc0cc1077d)), closes [#1266](https://github.com/chartist-js/chartist/issues/1266)

### [1.1.2](https://github.com/chartist-js/chartist/compare/v1.1.1...v1.1.2) (2022-08-14)


### Bug Fixes

* add id field to AnimationDefinition interface ([#1351](https://github.com/chartist-js/chartist/issues/1351)) ([4012c43](https://github.com/chartist-js/chartist/commit/4012c43942e2dd243a4e5983f25bf4c22ea42d91))

### [1.1.1](https://github.com/chartist-js/chartist/compare/v1.1.0...v1.1.1) (2022-08-13)


### Bug Fixes

* add styles to side effects ([#1350](https://github.com/chartist-js/chartist/issues/1350)) ([053bf97](https://github.com/chartist-js/chartist/commit/053bf978d825c6285da93af3558b8c0667676212))

## [1.1.0](https://github.com/chartist-js/chartist/compare/v1.0.0...v1.1.0) (2022-08-13)


### Features

* add ResponsiveOptions type helper, add generic type to Svg#getNode method ([#1347](https://github.com/chartist-js/chartist/issues/1347)) ([7dd3ba2](https://github.com/chartist-js/chartist/commit/7dd3ba2992751976bfdff9603021afa8fad140d8))


### Bug Fixes

* add Date type to members of Multi type ([#1348](https://github.com/chartist-js/chartist/issues/1348)) ([9bd8679](https://github.com/chartist-js/chartist/commit/9bd867958dd457b26cb697cf6b4d101944443755))

## [1.0.0](https://github.com/chartist-js/chartist/compare/v0.11.4...v1.0.0) (2022-08-08)


### ⚠ BREAKING CHANGES

* [new exports names](https://github.com/chartist-js/chartist#esm)
* methods in EventEmitter were renamed: `addEventHandler` -> `on`, `removeEventHandler` -> `off` ([73e1c44](https://github.com/chartist-js/chartist/commit/73e1c44dc1abab4938dc623a3dc22caad92af6a8))

### Features

* [TypeScript support](https://github.com/chartist-js/chartist#typescript) ([ee4106e](https://github.com/chartist-js/chartist/commit/ee4106e04f3c081805dd79675340378f895c8290))
* [ESM support](https://github.com/chartist-js/chartist#esm)


v0.11.0 - 11 Apr 2017
- Added CSP compatibility by using CSSOM instead of style attributes (Francisco Silva)
- Added feature to render pie / donut chart as solid shape, allowing outlines (Sergey Kovalyov, Chris Carson)
- Fixed XMLNS for foreignObjet content (Alfredo Matos)

v0.10.0 - 23 Oct 2016
---------------------

- Added dominant-baseline styles for pie and donut charts (Gion Kunz)
- Added public getNode on SVG api (Gion Kunz)
- Added support for bar charts to have auto narrowing on AutoScaleAxis by overriding referenceValue (Jonathan Dumaine)
- Added amdModuleId for better integration into webpack (Chris)
- Added grid background to line and bar chart (hansmaad)
- Added new LTS node version and included NPM run scripts (Gion Kunz)
- Added correct meta data emission in events (Gion Kunz)
- Fixed rounding issues where raw value was added instead of rounded (Gion Kunz)
- Fixed step axis issue with axis stretch and series count 0 (Gion Kunz)
- Fixed label position of single series pie / donut charts to be centered (Gion Kunz)
- Fixed order or drawing pie and donut slices (Gion Kunz)
- Fixed calculations of stepLength to only stretch ticksLength if > 1 (Alexander van Eck)
- Fixed better handling of axisOptions.position and fallback to 'end' position (Alexander van Eck)
- Fixed handling of holes in interpolation for multi-value series (James Watmuff)
- Fixed function StepAxis() returning NaN (Joao Milton)
- Fixed NaN issues in SVG when rendering Pie chart with only 0s (Alexander van Eck)
- Fixed infinite loop in getBounds with a more robust increment (hansmaad)
- Fixed performance of Chartist.extend (cheese83)
- Fixed license reference issues in package.json (Jacob Quant)
- Cleanup of data normalization changes and allows Date objects and booleans as values (Gion Kunz)
- Cleanup refactoring for data management and normalization (Gion Kunz)

v0.9.8 - 22 Jun 2016
--------------------
- Added monotone cubic interpolation which is now the default interpolation for line charts (James Watmuff)
- Update zoom plugin to 0.2.1 (hansmaad)
- Bugfix: Prevent infinite loop in getBounds if bounds.valueRange is very small, fixes #643 (hansmaad)
- Bugfix: Correct update events during media changes (Rory Hunter)
- Bugfix: prevent negative value for foreignObject width attribute (Jose Ignacio)
- Fixed example line chart in getting started documentation (Robin Edbom)
- Updated development pipeline dependencies (Gion Kunz)
- Updated chartist tooltip plugin and example styles (Gion Kunz)
- Fixed WTFPL License issue (Gion Kunz)

v0.9.7 - 23 Feb 2016
--------------------
- Fixed bug with label and grid rendering on axis, fixes #621

v0.9.6 - 22 Feb 2016
--------------------
- Added dual licensing WTFPL and MIT, built new version (Gion Kunz)
- Adding unminified CSS to dist output, fixes #506 (Gion Kunz)
- Refactored namespaced attribute handling, fixes #584 (Gion Kunz)
- Allow charts to be created without data and labels, fixes #598, fixes #588, fixes #537, fixes #425 (Gion Kunz> <Carlos Morales)
- Removed onlyInteger setting from default bar chart settings, fixes #423 (Gion Kunz)
- Removed serialization of values on line chart areas, fixes #424 (Gion Kunz)
- Removed workaround and fallback for SVG element width and height calculations, fixes #592 (Gion Kunz)
- Render 0 in ct:value attribute for line graphs (Paul Salaets)
- Allow empty pie chart values to be ignored (Stephen)
- Fix #527 Pie render issue with small angles. (hansmaad)
- Small fix for stacked bars with 'holes' in the data (medzes)

v0.9.5 - 14 Nov 2015
--------------------
- Added 'fillHoles' option for line graphs, which continues the line smoothly through data holes (Thanks to Joshua Warner !)
- Added option to use relative donut width values (Thanks to hansmaad !)
- Added stackMode for bar charts to create overlapping charts or bipolar stacked charts (Thanks to Douglas Mak !)
- Fixed issue with unordered ticks in fixed scale axis, fixes #411 (Thanks Carlos !)
- Fixed left navigation in examples was not using valid anchors, fixes #514 (Thanks Carlos !)
- Internal refactoring and cleanup (Thanks to hansmaad !)

v0.9.4 - 06 Aug 2015
--------------------
- Added axes to all events where they are available in context to provide better API convenience when developing plugins
- Consider additional parameters of SVG elem when called with DOM node

v0.9.3 - 05 Aug 2015
--------------------
- Added better check for undefined values in bar chart, fixes #400
- Fixed issue with SVG feature check within Svg module (Thanks to Markus Gruber !)

v0.9.2 - 02 Aug 2015
--------------------
- Enabled bar charts to use dynamic axes fixes #363, fixes #355
- Added axis title plugin to plugins page (Thanks to @alexstanbury !)
- Added a label group for Pie charts to prevent occlusion by slices (Thanks to Anthony Jimenez!)
- Added better handling for multi values when writing custom attributes, fixes #379

v0.9.1 - 24 Jun 2015
--------------------
- Fixed bug with areaBase narrowing process in area charts, fixes #364
- Fixed bug on bar chart where wrong offset was used (axis offset), fixes #347 (Thanks to @amsardesai !)
- Fixed bug with namespace attributes that caused duplication of SVG element on updates in old browsers (Thanks to @radist2s !)

v0.9.0 - 10 Jun 2015
--------------------
- Major refactoring of axis and projection code, added possibility to configure axes when creating a chart
- Added areaBase to series options override in line chart, fixes #342
- Throwing up in infinite loop for edge cases and during development
- Documentation: Added documentation for axis configuration and getting started guide for custom axes

v0.8.3 - 07 Jun 2015
--------------------
- Greatly reduced CSS selector complexity and split slice into slice-pie and slice-donut
- Added more robust detach mechanism that takes async initialization into account
- Added better handling for area drawing with segmented paths, fixes #340
- Documentation: Added getting started guide for styling charts

v0.8.2 - 02 Jun 2015
--------------------
- Fixed broken release 0.8.1

v0.8.1 - 02 Jun 2015 (BROKEN!)
------------------------------
- Added new option labelPosition for Pie charts to have better control over label placement, fixes #315
- Added default styles for alignment-baseline
- Added better support for undefined values in bar charts
- Refactored getHighLow to use recursion in order to enable more dynamic array structures and better edge case management
- Fixed issue with Chartist.rho that caused endless loop when called with 1, fixes #318

v0.8.0 - 10 May 2015
--------------------
- Added new option to bar charts to allow a series distribution and use a simple one dimensional array for data (#209)
- Added option for label placement and refactored label positioning code (#302)
- Added option to only use integer numbers in linear scale axis (#77)
- Added possibility to add series configuration on line chart to override specific options on series level (#289, #168)
- Added functionality to handle holes in line charts (#294)
- Added step interpolation for line charts
- Added default styles for bar and horizontal bar labels that make more sense (#303)
- Added series data and meta information to events (#293)
- Changed line chart behavior to draw points from interpolated values (#295)
- Removed restriction to SVGElements so Chartist.Svg can be used for HTML DOM elements (#261)
- Refactored and simplified axis creation, also includes updated CSS label handling
- Refactored getDataArray for simplification and fixed type conversion issue with data arrays for pie charts
- Centralized high/low calculations in getHighLow() method and added support for empty charts. Thanks @scthi !
- Fixed bug in pie chart where meta was only added when series name was specified
- Fixed bug where special condition to check single value should also include object value notation (#265)
- Fixed bug with Chartist.extend when null property is extended
- Fixed bug with Firefox dying with a DOM exception when calling getBBox() on an invisible node. Thanks @scthi !
- Switched from object literal accessor definition to regular function (#278)

v0.7.4 - 19 Apr 2015
--------------------
- Enhanced documentation site (Accessibility plugin, live example eval, fixed path to Sass settings, better HTML example of how to include Chartist, example how to include multiple charts on one page)
- Added Arc to Chartist.Svg.Path
- Refactored Chartist.Pie to make use of Svg.Path and expose path in events
- Closing path of Pie if not a donut for correct strokes
- Exposing axis objects in created event
- Changed grid event to use axis object instead of string

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
- Added classes to the label and grid groups
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
