# 1.0.0-rc.8 (12/06/2014)

- fixed bug in `SVG.off`
- fixed offset by window scroll position in `rbox()` [thanks @bryhoyt]


# 1.0.0-rc.7 (11/06/2014)

- calling `after()` when calling `stop(true)` (fulfill flag) [thanks @vird]
- added `classes()`, `hasClass()`, `addClass()`, `removeClass()` and `toggleClass()` [thanks @pklingem]
- fixed a bug where `Element#style()` would not save empty values in IE11 [thanks @Shtong]
- fixed `SVG is not defined error` [thanks @anvaka]
- fixed a bug in `move()`on text elements with a string based value
- binding events listeners to svg.js instance
- text element fires `rebuild` event whenever the `rebuild()` method is called
- fix for `text()` method on text element when acting as getter [thanks @Lochemage]
- fix in `style()` method with a css string [thanks @TobiasHeckel]

# 1.0.0-rc.6 (03/03/2014)

- fine-tuned text element positioning
- fixed a bug in text `dy()` method
- added `leading()` method to `SVG.FX`
- removed internal representation for `style`
- added `reverse()` method to `SVG.Array` (and thereby also to `SVG.PointArray` and `SVG.PathArray`)
- added `fulfill` option to `stop()` method in `SVG.FX` to finalise animations
- calling `at()` method directly on morphable svg.js instances in `SVG.FX` module
- moved most `_private` methods to local named functions
- moved helpers to a separate file
- added more output values to `bbox()` and `rbox()` methods

# 1.0.0-rc.5 (14/02/2014)

- added `plain()` method to `SVG.Text` element to add plain text content, without tspans
- added `plain()` method to parent elements to create a text element without tspans
- updated `SVG.TSpan` to accept nested tspan elements, not unlike the `text()` method in `SVG.Text`
- removed the `relative()` method in favour of `dx()`, `dy()` and `dmove()`
- switched form objects to arrays in `SVG.PathArray` for compatibility with other libraries and better performance on parsing and rendering (up-to 48% faster than 1.0.0-rc.4)
- refined docs on element-specific methods and `SVG.PathArray` structure
- added `build()` to enable/disable build mode
- removed verbose style application to tspans
- reworked `leading()` implementation to be more font-size "aware"
- refactored the `attr` method on `SVG.Element`
- applied Helvetica as default font
- building `SVG.FX` class with `SVG.invent()` function

# 1.0.0-rc.4 (04/02/2014)

- switched to `MAJOR`.`MINOR`.`PATCH` versioning format to play nice with package managers
- made svg.pattern.js part of the core library
- automatic pattern creation by passing an image url or instance as `fill` attribute on elements
- added `loaded()` method to image tag
- fix in `animate('=').to()`
- added `pointAt()` method to `SVG.Path`, wrapping the native `getPointAtLength()`
- moved `length()` method to sugar module
- fix for arcs in patharray `toString()` method [thanks @dotnetCarpenter]

# v1.0rc3 (03/02/2014)

- fix for html-less documents
- added the `SVG.invent` function to ease invention of new elements
- using `SVG.invent` to generate core shapes as well for leaner code
- added second values for `animate('2s')`
- fix for arcs in patharray `toString()` method
- added `length()` mehtod to path, wrapping the native `getTotalLength()`

# v1.0rc2 (01/02/2014)

- added `index()` method to `SVG.Parent` and `SVG.Set`
- modified `cx()` and `cy()` methods on elements with native `x`, `y`, `width` and `height` attributes for better performance
- added `morph()` and `at()` methods to `SVG.Number` for unit morphing

# v1.0rc1 (31/01/2014)

- added `SVG.PathArray` for real path transformations
- removed `unbiased` system for paths
- enabled proportional resizing on `size()` method with `null` for either `width` or `height` values
- moved data module to separate file
- `data()` method now accepts object for for multiple key / value assignments
- added `bbox()` method to `SVG.Set`
- added `relative()` method for moves relative to the current position
- added `morph()` and `at()` methods to `SVG.Color` for color morphing

# v0.38 (28/01/2014)

- added `loop()` method to `SVG.FX`
- switched from `setInterval` to `requestAnimFrame` for animations

# v0.37 (26/01/2014)

- added `get()` to `SVG.Set`
- moved `SVG.PointArray` to a separate file

# v0.36 (25/01/2014)

- added `linkTo()`, `addTo()` and `putIn()` methods on `SVG.Element`
- provided more detailed documentation on parent elements

# v0.35 (23/01/2014)

- added `SVG.A` element with the `link()`

# v0.34 (23/01/2014)

- added `pause()` and `play()` to `SVG.FX`
- storing animation values in `situation` object

# v0.33 (22/01/2014)

- added `has()` method to `SVG.Set`
- added `width()` and `height()` as setter and getter methods on all shapes
- moved sub-pixel offset fix to be an optional method (e.g. `SVG('drawing').fixSubPixelOffset()`)
- added `replace()` method to elements
- added `radius()` method to `SVG.Rect` and `SVG.Ellipse`
- added reference to parent node in defs
- merged plotable.js and path.js

# v0.32

- added library to [cdnjs](http://cdnjs.com)