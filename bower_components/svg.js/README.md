# svg.js

A lightweight library for manipulating and animating SVG.

Svg.js has no dependencies and aims to be as small as possible.

Svg.js is licensed under the terms of the MIT License.

See [svgjs.com](http://svgjs.com) for an introduction, [documentation](http://documentup.com/wout/svg.js) and [some action](http://svgjs.com/test).

[![Wout on Gittip](http://files.wout.co.uk/github/gittip.png)](https://www.gittip.com/wout/)

## Usage

### Create a SVG document

Use the `SVG()` function to create a SVG document within a given html element:

```javascript
var draw = SVG('drawing').size(300, 300)
var rect = draw.rect(100, 100).attr({ fill: '#f06' })
```
The first argument can either be an id of the element or the selected element itself.
This will generate the following output:

```html
<div id="drawing">
	<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="300" height="300">
		<rect width="100" height="100" fill="#f06"></rect>
	</svg>
</div>
```

By default the svg drawing follows the dimensions of its parent, in this case `#drawing`:

```javascript
var draw = SVG('drawing').size('100%', '100%')
```

### Checking for SVG support

By default this library assumes the client's browser supports SVG. You can test support as follows:

```javascript
if (SVG.supported) {
  var draw = SVG('drawing')
  var rect = draw.rect(100, 100)
} else {
  alert('SVG not supported')
}
```


### SVG document
Svg.js also works outside of the HTML DOM, inside an SVG document for example:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<svg id="drawing" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" >
  <script type="text/javascript" xlink:href="svg.min.js"></script>
  <script type="text/javascript">
    <![CDATA[
      var draw = SVG('drawing')
      draw.rect(100,100).animate().fill('#f03').move(100,100)
    ]]>
  </script>
</svg>
```

### Sub pixel offset fix
By default sub pixel offset won't be corrected. To enable it, call the `fixSubPixelOffset()` method:

```javascript
var draw = SVG('drawing').fixSubPixelOffset()
```

## Parent elements

### Main svg document
The main svg.js initializer function creates a root svg node in the given element and retuns an instance of `SVG.Doc`:

```javascript
var draw = SVG('drawing')
```

__`returns`: `SVG.Doc`__

_Javascript inheritance stack: `SVG.Doc` < `SVG.Container` < `SVG.Parent`_

### Nested svg
With this feature you can nest svg documents within each other. Nested svg documents have exactly the same features as the main, top-level svg document:

```javascript
var nested = draw.nested()

var rect = nested.rect(200, 200)
```

__`returns`: `SVG.Nested`__

_Javascript inheritance stack: `SVG.Nested` < `SVG.Container` < `SVG.Parent`_

### Groups
Grouping elements is useful if you want to transform a set of elements as if it were one. All element within a group maintain their position relative to the group they belong to. A group has all the same element methods as the root svg document: 

```javascript
var group = draw.group()
group.path('M10,20L30,40')
```

Existing elements from the svg document can also be added to a group:

```javascript
group.add(rect)
```

__`returns`: `SVG.G`__

_Javascript inheritance stack: `SVG.G` < `SVG.Container` < `SVG.Parent`_

### Hyperlink
A hyperlink or `<a>` tag creates a container that enables a link on all children:

```javascript
var link = draw.link('http://svgjs.com')
var rect = link.rect(100, 100)
```

The link url can be updated with the `to()` method:

```javascript
link.to('http://apple.com')
```

Furthermore, the link element has a `show()` method to create the `xlink:show` attribute:

```javascript
link.show('replace')
```

And the `target()` method to create the `target` attribute:

```javascript
link.target('_blank')
```

Elements can also be linked the other way around with the `linkTo()` method:

```javascript
rect.linkTo('http://svgjs.com')
```

Alternatively a block can be passed instead of a url for more options on the link element:

```javascript
rect.linkTo(function(link) {
  link.to('http://svgjs.com').target('_blank')
})
```

__`returns`: `SVG.A`__

_Javascript inheritance stack: `SVG.A` < `SVG.Container` < `SVG.Parent`_

### Defs
The `<defs>` element is a container element for referenced elements. Elements that are descendants of a ‘defs’ are not rendered directly. The `<defs>` node lives in the main `<svg>` document and can be accessed with the `defs()` method:

```javascript
var defs = draw.defs()
```

The defs are also availabel on any other element through the `doc()` method:

```javascript
var defs = rect.doc().defs()
```

The defs node works exactly the same as groups.

__`returns`: `SVG.Defs`__

_Javascript inheritance stack: `SVG.Defs` < `SVG.Container` < `SVG.Parent`_

## Rect
Rects have two arguments, their `width` and `height`:

```javascript
var rect = draw.rect(100, 100)
```

__`returns`: `SVG.Rect`__

_Javascript inheritance stack: `SVG.Rect` < `SVG.Shape` < `SVG.Element`_

### radius()
Rects can also have rounded corners:

```javascript
rect.radius(10)
```

This will set the `rx` and `ry` attributes to `10`. To set `rx` and `ry` individually:

```javascript
rect.radius(10, 20)
```

__`returns`: `itself`__


## Ellipse
Ellipses, like rects, have two arguments, their `width` and `height`:

```javascript
var ellipse = draw.ellipse(200, 100)
```

__`returns`: `SVG.Ellipse`__

_Javascript inheritance stack: `SVG.Ellipse` < `SVG.Shape` < `SVG.Element`_

### radius()
Ellipses can also be redefined by their radii:

```javascript
rect.radius(75, 50)
```

__`returns`: `itself`__

## Circle
The only argument necessary for a circle is the diameter:

```javascript
var circle = draw.circle(100)
```

__`returns`: `SVG.Ellipse`__

_Javascript inheritance stack: `SVG.Ellipse` < `SVG.Shape` < `SVG.Element`_

_Note that this generates an `<ellipse>` element instead of a `<circle>`. This choice has been made to keep the size of the library down._

### radius()
Circles can also be redefined by their radius:

```javascript
rect.radius(75)
```

__`returns`: `itself`__

## Line
The line element always takes four arguments, `x1`, `y1`, `x2` and `y2`:

```javascript
var line = draw.line(0, 0, 100, 150).stroke({ width: 1 })
```

__`returns`: `SVG.Line`__

_Javascript inheritance stack: `SVG.Line` < `SVG.Shape` < `SVG.Element`_

### plot()
Updating a line is done with the `plot()` method:

```javascript
line.plot(50, 30, 100, 150)
```

__`returns`: `itself`__

## Polyline
The polyline element defines a set of connected straight line segments. Typically, polyline elements define open shapes:

```javascript
// polyline('x,y x,y x,y')
var polyline = draw.polyline('0,0 100,50 50,100').fill('none').stroke({ width: 1 })
```

Polyline strings consist of a list of points separated by spaces: `x,y x,y x,y`.

As an alternative an array of points will work as well:

```javascript
// polyline([[x,y], [x,y], [x,y]])
var polyline = draw.polyline([[0,0], [100,50], [50,100]]).fill('none').stroke({ width: 1 })
```

__`returns`: `SVG.Polyline`__

_Javascript inheritance stack: `SVG.Polyline` < `SVG.Shape` < `SVG.Element`_

### plot()
Polylines can be updated using the `plot()` method:

```javascript
polyline.plot([[0,0], [100,50], [50,100], [150,50], [200,50]])
```

The `plot()` method can also be animated:

```javascript
polyline.animate(3000).plot([[0,0], [100,50], [50,100], [150,50], [200,50], [250,100], [300,50], [350,50]])
```

__`returns`: `itself`__

## Polygon
The polygon element, unlike the polyline element, defines a closed shape consisting of a set of connected straight line segments:

```javascript
// polygon('x,y x,y x,y')
var polygon = draw.polygon('0,0 100,50 50,100').fill('none').stroke({ width: 1 })
```

Polygon strings are exactly the same as polyline strings. There is no need to close the shape as the first and last point will be connected automatically.

__`returns`: `SVG.Polygon`__

_Javascript inheritance stack: `SVG.Polygon` < `SVG.Shape` < `SVG.Element`_

### plot()
Like polylines, polygons can be updated using the `plot()` method:

```javascript
polygon.plot([[0,0], [100,50], [50,100], [150,50], [200,50]])
```

The `plot()` method can also be animated:

```javascript
polygon.animate(3000).plot([[0,0], [100,50], [50,100], [150,50], [200,50], [250,100], [300,50], [350,50]])
```

__`returns`: `itself`__

## Path
The path string is similar to the polygon string but much more complex in order to support curves:

```javascript
var path = draw.path('M10,20L30,40')
```

__`returns`: `SVG.Path`__

_Javascript inheritance stack: `SVG.Path` < `SVG.Shape` < `SVG.Element`_

For more details on path data strings, please refer to the SVG documentation:
http://www.w3.org/TR/SVG/paths.html#PathData

### plot()
Paths can be updated using the `plot()` method:

```javascript
path.plot('M100,200L300,400')
```

__`returns`: `itself`__

## Image
Creating images is as you might expect:

```javascript
var image = draw.image('/path/to/image.jpg')
```

If you know the size of the image, those parameters can be passed as the second and third arguments:

```javascript
var image = draw.image('/path/to/image.jpg', 200, 300)
```

__`returns`: `SVG.Image`__

_Javascript inheritance stack: `SVG.Image` < `SVG.Shape` < `SVG.Element`_

### load()
Loading another image can be done with the `load()` method:

```javascript
draw.image('/path/to/another/image.jpg')
```

__`returns`: `itself`__

### loaded()
If you don't know the size of the image, obviously you will have to wait for the image to be `loaded`:

```javascript
var image = draw.image('/path/to/image.jpg').loaded(function(loader) {
  this.size(loader.width, loader.height)
})
```

The returned `loader` object as first the argument of the loaded method contains four values:
- `width`
- `height`
- `ratio` (width / height)
- `url`

__`returns`: `itself`__


## Text
Unlike html, text in svg is much harder to tame. There is no way to create flowing text, so newlines should be entered manually. In svg.js there are two ways to create text elements.

The first and easiest method is to provide a string of text, split by newlines:

```javascript
var text = draw.text("Lorem ipsum dolor sit amet consectetur.\nCras sodales imperdiet auctor.")
```

This will automatically create a block of text and insert newlines where necessary.

The second method will give you much more control but requires a bit more code:

```javascript
var text = draw.text(function(add) {
  add.tspan('Lorem ipsum dolor sit amet ').newLine()
  add.tspan('consectetur').fill('#f06')
  add.tspan('.')
  add.tspan('Cras sodales imperdiet auctor.').newLine().dx(20)
  add.tspan('Nunc ultrices lectus at erat').newLine()
  add.tspan('dictum pharetra elementum ante').newLine()
})
```

If you want to go the other way and don't want to add tspans at all, just one line of text, you can use the `plain()` method instead:

```javascript
var text = draw.plain('Lorem ipsum dolor sit amet consectetur.')
```

This is a shortcut to the `plain` method on the `SVG.Text` instance which doesn't render newlines at all.

_Javascript inheritance stack: `SVG.Text` < `SVG.Shape` < `SVG.Element`_

__`returns`: `SVG.Text`__

### text()
Changing text afterwards is also possible with the `text()` method:

```javascript
text.text('Brilliant!')
```

__`returns`: `itself`__

To get the raw text content:

```javascript
text.text()
```

__`returns`: `string`__

### tspan()
Just adding one tspan is also possible:

```javascript
text.tspan(' on a train...').fill('#f06')
```

__`returns`: `SVG.TSpan`__

### plain()
If the content of the element doesn't need any stying or multiple lines, it might be sufficient to just add some plain text:

```javascript
text.plain('I do not have any expectations.')
```

__`returns`: `itself`__

### font()
The sugar.js module provides some syntax sugar specifically for this element type:

```javascript
text.font({
  family:   'Helvetica'
, size:     144
, anchor:   'middle'
, leading:  '1.5em'
})
```

__`returns`: `itself`__

### leading()
As opposed to html, where leading is defined by `line-height`, svg does not have a natural leading equivalent. In svg, lines are not defined naturally. They are defined by `<tspan>` nodes with a `dy` attribute defining the line height and a `x` value resetting the line to the `x` position of the parent text element. But you can also have many nodes in one line defining a different `y`, `dy`, `x` or even `dx` value. This gives us a lot of freedom, but also a lot more responsibility. We have to decide when a new line is defined, where it starts, what its offset is and what it's height is. The `leading()` method in svg.js tries to ease the pain by giving you behaviour that is much closer to html. In combination with newline separated text, it works just like html:

```javascript
var text = draw.text("Lorem ipsum dolor sit amet consectetur.\nCras sodales imperdiet auctor.")
text.leading(1.3)
```

This will render a text element with a tspan element for each line, with a `dy` value of `130%` of the font size.

Note that the `leading()` method assumes that every first level tspan in a text node represents a new line. Using `leading()` on text elements containing multiple tspans in one line (e.g. without a wrapping tspan defining a new line) will render scrambeled. So it is advisable to use this method with care, preferably only when throwing newline separated text at the text element or calling the `newLine()` method on every first level tspan added in the block passed as argument to the text element.

__`returns`: `itself`__

### build()
The `build()` can be used to enable / disable build mode. With build mode disabled, the `plain()` and `tspan()` methods will first call the `clear()` bethod before adding the new content. So when build mode is enabled, `plain()` and `tspan()` will append the new content to the existing content. When passing a block to the `text()` method, build mode is toggled automatically before and after the block is called. But in some cases it might be useful to be able to toggle it manually:


```javascript
var text = draw.text('This is just the start, ')

text.build(true)  // enables build mode

var tspan = text.tspan('something pink in the middle ').fill('#00ff97')
text.plain('and again boring at the end.')

text.build(false) // disables build mode

tspan.animate('2s').fill('#f06')
```

__`returns`: `itself`__

### rebuild()
This is an internal callback that probably never needs to be called manually. Basically it rebuilds the text element whenerver `font-size` and `x` attributes or the `leading()` of the text element are modified. This method also acts a setter to enable or disable rebuilding:

```javascript
text.rebuild(false) //-> disables rebuilding
text.rebuild(true)  //-> enables rebuilding and instantaneously rebuilds the text element
```

__`returns`: `itself`__

### clear()
Clear all the contents of the called text element:

```javascript
text.clear()
```

__`returns`: `itself`__

### lines
All added tspans are stored in the `lines` reference, which is an instance of `SVG.Set`.

### events
The text element has one event. It is fired every time the `rebuild()` method is called:

```javascript
text.on('rebuild', function() {
  // whatever you need to do after rebuilding
})
```

## TSpan
The tspan elements are only available inside text elements or inside other tspan elements. In svg.js they have a class of their own:

_Javascript inheritance stack: `SVG.TSpan` < `SVG.Shape` < `SVG.Element`_

### text()
Update the content of the tspan. This can be done by either passing a string:


```javascript
tspan.text('Just a string.')
```

Which will basicly call the `plain()` method.

Or by passing a block to add more specific content inside the called tspan:

```javascript
tspan.text(function(add) {
  add.plain('Just plain text.')
  add.tspan('Fancy text wrapped in a tspan.').fill('#f06')
  add.tspan(function(addMore) {
    addMore.tspan('And you can doo deeper and deeper...')
  })
})
```

__`returns`: `itself`__

### tspan()
Add a nested tspan:

```javascript
tspan.tspan('I am a child of my parent').fill('#f06')
```

__`returns`: `SVG.TSpan`__

### plain()
Just adds some plain text:

```javascript
tspan.plain('I do not have any expectations.')
```

__`returns`: `itself`__

### dx()
Define the dynamic `x` value of the element, much like a html element with `position:relative` and `left` defined:

```javascript
tspan.dx(30)
```

__`returns`: `itself`__

### dy()
Define the dynamic `y` value of the element, much like a html element with `position:relative` and `top` defined:

```javascript
tspan.dy(30)
```

__`returns`: `itself`__

### newLine()
The `newLine()` is a convenience method for adding a new line with a `dy` attribute using the current "leading":

```javascript
var text = draw.text(function(add) {
  add.tspan('Lorem ipsum dolor sit amet ').newLine()
  add.tspan('consectetur').fill('#f06')
  add.tspan('.')
  add.tspan('Cras sodales imperdiet auctor.').newLine().dx(20)
  add.tspan('Nunc ultrices lectus at erat').newLine()
  add.tspan('dictum pharetra elementum ante').newLine()
})
```

__`returns`: `itself`__

### clear()
Clear all the contents of the called tspan element:

```javascript
tspan.clear()
```

__`returns`: `itself`__

## TextPath
A nice feature in svg is the ability to run text along a path:

```javascript
var text = draw.text(function(add) {
  add.tspan('We go ')
  add.tspan('up').fill('#f09').dy(-40)
  add.tspan(', then we go down, then up again').dy(40)
})
text
  .path('M 100 200 C 200 100 300 0 400 100 C 500 200 600 300 700 200 C 800 100 900 100 900 100')
  .font({ size: 42.5, family: 'Verdana' })
```

When calling the `path()` method on a text element, the text element is mutated into an intermediate between a text and a path element. From that point on the text element will also feature a `plot()` method to update the path:

```javascript
text.plot('M 300 500 C 200 100 300 0 400 100 C 500 200 600 300 700 200 C 800 100 900 100 900 100')
```

Attributes specific to the `<textPath>` element can be applied to the textPath instance itself:

```javascript
text.textPath.attr('startOffset', 0.5)
```

And they can be animated as well of course:

```javascript
text.textPath.animate(3000).attr('startOffset', 0.8)
```

__`returns`: `SVG.TextPath`__

_Javascript inheritance stack: `SVG.TextPath` < `SVG.Element`_

### track
Referencing the linked path element directly:

```javascript
var path = text.track
```


## Use
The use element simply emulates another existing element. Any changes on the master element will be reflected on all the `use` instances. The usage of `use()` is very straightforward:

```javascript
var rect = draw.rect(100, 100).fill('#f09')
var use  = draw.use(rect).move(200, 200)
```

In the case of the example above two rects will appear on the svg drawing, the original and the `use` instance. In some cases you might want to hide the original element. the best way to do this is to create the original element in the defs node:

```javascript
var rect = draw.defs().rect(100, 100).fill('#f09')
var use  = draw.use(rect).move(200, 200)
```

In this way the rect element acts as a library element. You can edit it but it won't be rendered.

__`returns`: `SVG.Use`__

_Javascript inheritance stack: `SVG.Use` < `SVG.Shape` < `SVG.Element`_


## Referencing elements

### By id
If you want to get an element created by svg.js by its id, you can use the `SVG.get()` method:

```javascript
var element = SVG.get('my_element')

element.fill('#f06')
```

### By class name
There is no DOM querying system built into svg.js but [jQuery](http://jquery.com/) or [Zepto](http://zeptojs.com/) will help you achieve this. Here is an example:

```javascript
/* add elements */
var draw   = SVG('drawing')
var group  = draw.group().attr('class', 'my-group')
var rect   = group.rect(100,100).attr('class', 'my-element')
var circle = group.circle(100).attr('class', 'my-element').move(100, 100)

/* get elements in group */
var elements = $('#drawing g.my-group .my-element').each(function() {
  this.instance.animate().fill('#f09')
})
```

## Circular reference
Every element instance within svg.js has a reference to the actual `node`:

### node
```javascript
element.node
```
__`returns`: `node`__

### instance
Similarly, the node carries a reference to the svg.js `instance`:

```javascript
node.instance
```
__`returns`: `element`__

## Parent reference
Every element has a reference to its parent:

### parent

```javascript
element.parent
```

__`returns`: `element`__

Even the main svg document:

```javascript
var draw = SVG('drawing')

draw.parent //-> returns the wrappig html element with id 'drawing'
```

__`returns`: `node`__


### doc()
For more specific parent filtering the `doc()` method can be used:

```javascript
var draw = SVG('drawing')
var rect = draw.rect(100, 100)

rect.doc() //-> returns draw
```

Alternatively a class can be passed as the first argument:

```javascript
var draw   = SVG('drawing')
var nested = draw.nested()
var group  = nested.group()
var rect   = group.rect(100, 100)

rect.doc()           //-> returns draw
rect.doc(SVG.Doc)    //-> returns draw
rect.doc(SVG.Nested) //-> returns nested
rect.doc(SVG.G)      //-> returns group
```
__`returns`: `element`__

## Child references

### first()
To get the first child of a parent element:

```javascript
draw.first()
```
__`returns`: `element`__

### last()
To get the last child of a parent element:

```javascript
draw.last()
```
__`returns`: `element`__

### children()
An array of all children will can be retreives with the `children` method:

```javascript
draw.children()
```
__`returns`: `array`__

### each()
The `each()` allows you to iterate over the all children of a parent element:

```javascript
draw.each(function(i, children) {
  this.fill({ color: '#f06' })
})
```

Deep traversing is also possible by passing true as the second argument:

```javascript
// draw.each(block, deep)
draw.each(function(i, children) {
  this.fill({ color: '#f06' })
}, true)
```

Note that `this` refers to the current child element.

__`returns`: `itself`__

### has()
Checking the existence of an element within a parent:

```javascript
var rect  = draw.rect(100, 50)
var group = draw.group()

draw.has(rect)  //-> returns true
group.has(rect) //-> returns false
```
__`returns`: `boolean`__

### index()
Returns the index of given element and retuns -1 when it is not a child:

```javascript
var rect  = draw.rect(100, 50)
var group = draw.group()

draw.index(rect)  //-> returns 0
group.index(rect) //-> returns -1
```
__`returns`: `number`__

### get()
Get an element on a given position in the children array:

```javascript
var rect   = draw.rect(20, 30)
var circle = draw.circle(50)

draw.get(0) //-> returns rect
draw.get(1) //-> returns circle
```
__`returns`: `element`__

### clear()
To remove all elements from a parent element:

```javascript
draw.clear()
```
__`returns`: `itself`__


## Manipulating elements

### attr()
You can get and set an element's attributes directly using `attr()`.

Get a single attribute:
```javascript
rect.attr('x')
```

Set a single attribute:
```javascript
rect.attr('x', 50)
```

Set multiple attributes at once:
```javascript
rect.attr({
  fill: '#f06'
, 'fill-opacity': 0.5
, stroke: '#000'
, 'stroke-width': 10
})
```

Set an attribute with a namespace:
```javascript
rect.attr('x', 50, 'http://www.w3.org/2000/svg')
```

Explicitly remove an attribute:
```javascript
rect.attr('fill', null)
```

`getter`__`returns`: `value`__

`setter`__`returns`: `itself`__


### transform()
With the `transform()` method elements can be scaled, rotated, translated and skewed:

```javascript
rect.transform({
  rotation: 45
, cx:       100
, cy:       100
})
```

You can also provide two arguments as property and value:

```javascript
rect.transform('matrix', '1,0.5,0.5,1,0,0')
```

All available transformations are:

```javascript
rect.transform({
  x:        [translation on x-axis]
, y:        [translation on y-axis]

, rotation: [degrees]
, cx:       [x rotation point]
, cy:       [y rotation point]

, scaleX:   [scaling on x-axis]
, scaleY:   [scaling on y-axis]

, skewX:    [skewing on x-axis]
, skewY:    [skewing on y-axis]

, matrix:   [a 6-digit matrix string; e.g. '1,0,0,1,0,0']
, a:        [the first matrix digit]
, b:        [the second matrix digit]
, c:        [the third matrix digit]
, d:        [the fourth matrix digit]
, e:        [the fifth matrix digit]
, f:        [the sixth matrix digit]
})
```

Note that you can also apply transformations directly using the `attr()` method:

```javascript
rect.attr('transform', 'matrix(1,0.5,0.5,1,0,0)')
```

Although that would mean you can't use the `transform()` method because it would overwrite any manually applied transformations. You should only go down this route if you know exactly what you are doing and you want to achieve an effect that is not achievable with the `transform()` method.

`getter`__`returns`: `number`__

`setter`__`returns`: `itself`__

### style()
With the `style()` method the `style` attribute can be managed like attributes with `attr`:

```javascript
rect.style('cursor', 'pointer')
```

Multiple styles can be set at once using an object:

```javascript
rect.style({ cursor: 'pointer', fill: '#f03' })
```

Or a css string:

```javascript
rect.style('cursor:pointer;fill:#f03;')
```

Similarly to `attr()` the `style()` method can also act as a getter:

```javascript
rect.style('cursor')
// => pointer
```

Or even a full getter:

```javascript
rect.style()
// => 'cursor:pointer;fill:#f03;'
```

Explicitly deleting individual style definitions works the same as with the `attr()` method:

```javascript
rect.style('cursor', null)
```

`getter`__`returns`: `value`__

`setter`__`returns`: `itself`__

### classes()
Fetches an array of css classes on the node:

```javascript
rect.classes()
```

`getter`__`returns`: `array`__

### hasClass()
Test the presence of a given css class:

```javascript
rect.hasClass('purple-rain')
```

`getter`__`returns`: `boolean`__

### addClass()
Adds a given css class:

```javascript
rect.addClass('pink-flower')
```

`setter`__`returns`: `itself`__

### removeClass()
Removes a given css class:

```javascript
rect.removeClass('pink-flower')
```

`setter`__`returns`: `itself`__

### toggleClass()
Toggles a given css class:

```javascript
rect.toggleClass('pink-flower')
```

`setter`__`returns`: `itself`__

### move()
Move the element to a given `x` and `y` position by its upper left corner:

```javascript
rect.move(200, 350)
```

Note that you can also use the following code to move some elements (like images and rects) around:

```javascript
rect.attr({ x: 20, y: 60 })
``` 

Although `move()` is much more convenient because it will always use the upper left corner as the position reference, whereas with using `attr()` the `x` and `y` reference differ between element types. For example, rect uses the upper left corner with the `x` and `y` attributes, circle and ellipse use their center with the `cx` and `cy` attributes and thereby simply ignoring the `x` and `y` values you might assign.

__`returns`: `itself`__

### x()
Move element only along x-axis by its upper left corner:

```javascript
rect.x(200)
```

Without an argument the `x()` method serves as a getter as well:

```javascript
rect.x() //-> returns 200
```

`getter`__`returns`: `value`__

`setter`__`returns`: `itself`__

### y()
Move element only along y-axis by its upper left corner:

```javascript
rect.y(350)
```

Without an argument the `y()` method serves as a getter as well:

```javascript
rect.y() //-> returns 350
```

`getter`__`returns`: `value`__

`setter`__`returns`: `itself`__

### dmove()
Move the element to a given `x` and `y` position relative to its current position:

```javascript
rect.dmove(10, 30)
```

__`returns`: `itself`__

### dx()
Move element only along x-axis relative to its current position:

```javascript
rect.dx(200)
```

__`returns`: `itself`__

### dy()
Move element only along y-axis relative to its current position:

```javascript
rect.dy(200)
```

__`returns`: `itself`__

### center()
This is an extra method to move an element by its center:

```javascript
rect.center(150, 150)
```

__`returns`: `itself`__

### cx()
Move element only along x-axis by its center:

```javascript
rect.cx(200)
```

Without an argument the `cx()` method serves as a getter as well:

```javascript
rect.cx() //-> returns 200
```

`getter`__`returns`: `value`__

`setter`__`returns`: `itself`__

### cy()
Move element only along y-axis by its center:

```javascript
rect.cy(350)
```

Without an argument the `cy()` method serves as a getter as well:

```javascript
rect.cy() //-> returns 350
```

`getter`__`returns`: `value`__

`setter`__`returns`: `itself`__

### size()
Set the size of an element by a given `width` and `height`:

```javascript
rect.size(200, 300)
```

Proporional resizing is also possible by leaving out `height`:

```javascript
rect.size(200)
```

Or by passing `null` as the value for `width`:

```javascript
rect.size(null, 200)
```

Same as with `move()` the size of an element could be set by using `attr()`. But because every type of element is handles its size differently the `size()` method is much more convenient.

There is one exceptions though, the `SVG.Text` only takes one argument and applies the given value to the `font-size` attribute.

__`returns`: `itself`__

### width()
Set only width of an element:

```javascript
rect.width(200)
```

This method also acts as a getter:

```javascript
rect.width() //-> returns 200
```

`getter`__`returns`: `value`__

`setter`__`returns`: `itself`__

### height()
Set only height of an element:

```javascript
rect.height(325)
```

This method also acts as a getter:

```javascript
rect.height() //-> returns 325
```

`getter`__`returns`: `value`__

`setter`__`returns`: `itself`__

### hide()
Hide element:

```javascript
rect.hide()
```

__`returns`: `itself`__

### show()
Show element:

```javascript
rect.show()
```

__`returns`: `itself`__

### visible()
To check if the element is visible:

```javascript
rect.visible()
```

__`returns`: `boolean`__

### clone()
To make an exact copy of an element the `clone()` method comes in handy:

```javascript
var clone = rect.clone()
```

__`returns`: `element`__

This will create an new, unlinked copy. If you want to make a linked clone have a look at the [use](#elements/use) element.

### remove()
Pretty straightforward:

```javascript
rect.remove()
```

__`returns`: `itself`__

### replace()
This method will replace the called element with the given element in the same position in the stack:

```javascript
rect.replace(draw.circle(100))
```

__`returns`: `element`__


## Inserting elements

### add()
Elements can be moved between parents via the `add()` method on any parent:

```javascript
var rect = draw.rect(100, 100)
var group = draw.group()

group.add(rect) //-> returns group
```

__`returns`: `itself`__

### put()
Where the `add()` method returns the parent itself, the `put()` method returns the given element:

```javascript
group.put(rect) //-> returns rect
```

__`returns`: `element`__

### addTo()
Similarly to the `add()` method on a parent element, elements have the `addTo()` method:

```javascript
rect.addTo(group) //-> returns rect
```

__`returns`: `itself`__

### putIn()
Similarly to the `put()` method on a parent element, elements have the `putIn()` method:

```javascript
rect.putIn(group) //-> returns group
```

__`returns`: `element`__

## Geometry

### viewbox()

The `viewBox` attribute of an `<svg>` element can be managed with the `viewbox()` method. When supplied with four arguments it will act as a setter:

```javascript
draw.viewbox(0, 0, 297, 210)
```

Alternatively you can also supply an object as the first argument:

```javascript
draw.viewbox({ x: 0, y: 0, width: 297, height: 210 })
```

Without any arguments an instance of `SVG.ViewBox` will be returned:

```javascript
var box = draw.viewbox()
```

But the best thing about the `viewbox()` method is that you can get the zoom of the viewbox:

```javascript
var box = draw.viewbox()
var zoom = box.zoom
```

If the size of the viewbox equals the size of the svg drawing, the zoom value will be 1.

`getter`__`returns`: `SVG.ViewBox`__

`setter`__`returns`: `itself`__

### bbox()

```javascript
path.bbox()
```
This will return an instance of `SVG.BBox` containing the following values:

```javascript
{ width: 20, height: 20, x: 10, y: 20, cx: 20, cy: 30, x2: 30, y2: 40 } 
```

As opposed to the native `getBBox()` method any translations used with the `transform()` method will be taken into account.

The `SVG.BBox` has one other nifty little feature, enter the `merge()` method. With `merge()` two `SVG.BBox` instances can be merged into one new instance, basically being the bounding box of the two original bounding boxes:

```javascript
var box1 = draw.rect(100,100).move(50,50)
var box2 = draw.rect(100,100).move(200,200)
var box3 = box1.merge(box2)
```

__`returns`: `SVG.BBox`__

### rbox()
Is similar to `bbox()` but will give you the box around the exact representation of the element, taking all transformations into account.

```javascript
path.rbox()
```

__`returns`: `SVG.RBox`__

### inside()
To check if a given point is inside the bounding box of an element you can use the `inside()` method:

```javascript
var rect = draw.rect(100, 100).move(50, 50)

rect.inside(25, 30) //-> returns false
rect.inside(60, 70) //-> returns true
```

Note: the `x` and `y` positions are tested against the relative position of the element. Any offset on the parent element is not taken into account.

__`returns`: `boolean`__

### length()
Get the total length of a path element:

```javascript
var length = path.length()
```

__`returns`: `number`__

### pointAt()
Get get point on a path at given length:

```javascript
var point = path.pointAt(105) //-> returns { x : 96.88497924804688, y : 58.062747955322266 }
```

__`returns`: `object`__


## Animating elements

### Animatable method chain
Note that the `animate()` method will not return the targeted element but an instance of SVG.FX which will take the following methods:

Of course `attr()`:
```javascript
rect.animate().attr({ fill: '#f03' })
```

The `x()`, `y()` and `move()` methods:
```javascript
rect.animate().move(100, 100)
```

And the `cx()`, `cy()` and `center()` methods:
```javascript
rect.animate().center(200, 200)
```

If you include the sugar.js module, `fill()`, `stroke()`, `rotate()`, `skew()`, `scale()`, `matrix()`, `opacity()`, `radius()` will be available as well:
```javascript
rect.animate().rotate(45).skew(25, 0)
```

You can also animate non-numeric unit values unsing the `attr()` method:
```javascript
rect.attr('x', '10%').animate().attr('x', '50%')
```

### easing
All available ease types are:

- `<>`: ease in and out
- `>`: ease out
- `<`: ease in
- `-`: linear
- `=`: external control
- a function

For the latter, here is an example of the default `<>` function:

```javascript
function(pos) { return (-Math.cos(pos * Math.PI) / 2) + 0.5 }
```

For more easing equations, have a look at the [svg.easing.js](https://github.com/wout/svg.easing.js) plugin.

### animate()
Animating elements is very much the same as manipulating elements, the only difference is you have to include the `animate()` method:

```javascript
rect.animate().move(150, 150)
```

The `animate()` method will take three arguments. The first is `duration`, the second `ease` and the third `delay`:

```javascript
rect.animate(2000, '>', 1000).attr({ fill: '#f03' })
```

Alternatively you can pass an object as the first argument:

```javascript
rect.animate({ ease: '<', delay: '1.5s' }).attr({ fill: '#f03' })
```

By default `duration` will be set to `1000`, `ease` will be set to `<>`.

__`returns`: `SVG.FX`__


### pause()
Pausing an animations is fairly straightforward:

```javascript
rect.animate().move(200, 200)

rect.mouseenter(function() { this.pause() })
```

__`returns`: `itself`__

### play()
Will start playing a paused animation:

```javascript
rect.animate().move(200, 200)

rect.mouseenter(function() { this.pause() })
rect.mouseleave(function() { this.play() })
```
__`returns`: `itself`__

### stop()
Animations can be stopped in two ways.

By calling the `stop()` method:
```javascript
rect.animate().move(200, 200)

rect.stop()
```

Or by invoking another animation:
```javascript
rect.animate().move(200, 200)

rect.animate().center(200, 200)
```

By calling `stop()`, the transition is left at its current position. By passing `true` as the first argument to `stop()`, the animation will be fulfilled instantly:

```javascript
rect.animate().move(200, 200)

rect.stop(true)
```

Stopping an animation is irreversable.

__`returns`: `itself`__

### during()
If you want to perform your own actions during the animations you can use the `during()` method:

```javascript
var position
  , from = 100
  , to   = 300

rect.animate(3000).move(100, 100).during(function(pos) {
  position = from + (to - from) * pos 
})
```
Note that `pos` is `0` in the beginning of the animation and `1` at the end of the animation.

To make things easier a morphing function is passed as the second argument. This function accepts a `from` and `to` value as the first and second argument and they can be a number, unit or hex color:

```javascript
var ellipse = draw.ellipse(100, 100).attr('cx', '20%').fill('#333')

rect.animate(3000).move(100, 100).during(function(pos, morph) {
  /* numeric values */
  ellipse.size(morph(100, 200), morph(100, 50))
  
  /* unit strings */
  ellipse.attr('cx', morph('20%', '80%'))
  
  /* hex color strings */
  ellipse.fill(morph('#333', '#ff0066'))
})
```

__`returns`: `SVG.FX`__

### loop()
By default the `loop()` method creates and eternal loop:

```javascript
rect.animate(3000).move(100, 100).loop()
```

But the loop can also be a predefined number of times:

```javascript
rect.animate(3000).move(100, 100).loop(5)
```

__`returns`: `SVG.FX`__

### after()
Finally, you can add callback methods using `after()`:

```javascript
rect.animate(3000).move(100, 100).after(function() {
  this.animate().attr({ fill: '#f06' })
})
```

Note that the `after()` method will never be called if the animation is looping eternally. 

__`returns`: `SVG.FX`__

### to()
Say you want to control the position of an animation with an external event, then the `to()` method will proove very useful:

```javascript
var animate = draw.rect(100, 100).move(50, 50).animate('=').move(200, 200)

document.onmousemove = function(event) {
  animate.to(event.clientX / 1000)
}
```

In order to be able use the `to()` method the duration of the animation should be set to `'='`. The value passed as the first argument of `to()` should be a number between `0` and `1`, `0` being the beginning of the animation and `1` being the end. Note that any values below `0` and above `1` will be normalized.

_This functionality requires the fx.js module which is included in the default distribution._

__`returns`: `SVG.FX`__


## Syntax sugar

Fill and stroke are used quite often. Therefore two convenience methods are provided:

### fill()
The `fill()` method is a pretty alternative to the `attr()` method:

```javascript
rect.fill({ color: '#f06', opacity: 0.6 })
```

A single hex string will work as well:

```javascript
rect.fill('#f06')
```

Last but not least, you can also use an image as fill, simply by passing an image url:

```javascript
rect.fill('images/shade.jpg')
```

Or if you want more control over the size of the image, you can pass an image instance as well:

```javascript
rect.fill(draw.image('images/shade.jpg', 20, 20))
```

__`returns`: `itself`__

### stroke()
The `stroke()` method is similar to `fill()`:

```javascript
rect.stroke({ color: '#f06', opacity: 0.6, width: 5 })
```

Like fill, a single hex string will work as well:

```javascript
rect.stroke('#f06')
```

Not unlike the `fill()` method, you can also use an image as stroke, simply by passing an image url:

```javascript
rect.stroke('images/shade.jpg')
```

Or if you want more control over the size of the image, you can pass an image instance as well:

```javascript
rect.stroke(draw.image('images/shade.jpg', 20, 20))
```

__`returns`: `itself`__

### opacity()
To set the overall opacity of an element:

```javascript
rect.opacity(0.5)
```

__`returns`: `itself`__

### rotate()
The `rotate()` method will automatically rotate elements according to the center of the element:

```javascript
// rotate(degrees)
rect.rotate(45)
```

Although you can also define a specific rotation point:

```javascript
// rotate(degrees, cx, cy)
rect.rotate(45, 50, 50)
```

__`returns`: `itself`__

### skew()
The `skew()` method will take an `x` and `y` value:

```javascript
// skew(x, y)
rect.skew(0, 45)
```

__`returns`: `itself`__

### scale()
The `scale()` method will take an `x` and `y` value:

```javascript
// scale(x, y)
rect.scale(0.5, -1)
```

__`returns`: `itself`__

### translate()
The `translate()` method will take an `x` and `y` value:

```javascript
// translate(x, y)
rect.translate(0.5, -1)
```

### radius()
Rects and ellipses have a `radius()` method. On rects it defines rounded corners, on ellipses the radii:

```javascript
rect.radius(10)
```

This will set the `rx` and `ry` attributes to `10`. To set `rx` and `ry` individually:

```javascript
rect.radius(10, 20)
```

_This functionality requires the sugar.js module which is included in the default distribution._

__`returns`: `itself`__


## Masking elements

### maskWith()
The easiest way to mask is to use a single element:

```javascript
var ellipse = draw.ellipse(80, 40).move(10, 10).fill({ color: '#fff' })

rect.maskWith(ellipse)
```

__`returns`: `itself`__

### mask()
But you can also use multiple elements:

```javascript
var ellipse = draw.ellipse(80, 40).move(10, 10).fill({ color: '#fff' })
var text = draw.text('SVG.JS').move(10, 10).font({ size: 36 }).fill({ color: '#fff' })

var mask = draw.mask().add(text).add(ellipse)

rect.maskWith(mask)
```

If you want the masked object to be rendered at 100% you need to set the fill color of the masking object to white. But you might also want to use a gradient:

```javascript
var gradient = draw.gradient('linear', function(stop) {
  stop.at({ offset: 0, color: '#000' })
  stop.at({ offset: 1, color: '#fff' })
})

var ellipse = draw.ellipse(80, 40).move(10, 10).fill({ color: gradient })

rect.maskWith(ellipse)
```

__`returns`: `SVG.Mask`__

### unmask()
Unmasking the elements can be done with the `unmask()` method:

```javascript
rect.unmask()
```

The `unmask()` method returns the masking element.

__`returns`: `itself`__

### remove()
Removing the mask alltogether will also `unmask()` all masked elements as well:

```javascript
mask.remove()
```

__`returns`: `itself`__

### masker
For your convenience, the masking element is also referenced in the masked element. This can be useful in case you want to change the mask:

```javascript
rect.masker.fill('#fff')
```

_This functionality requires the mask.js module which is included in the default distribution._


## Clipping elements
Clipping elements works exactly the same as masking elements. The only difference is that clipped elements will adopt the geometry of the clipping element. Therefore events are only triggered when entering the clipping element whereas with masks the masked element triggers the event. Another difference is that masks can define opacity with their fill color and clipPaths don't.

### clipWith()
```javascript
var ellipse = draw.ellipse(80, 40).move(10, 10)

rect.clipWith(ellipse)
```

__`returns`: `itself`__

### clip()
Clip multiple elements:

```javascript
var ellipse = draw.ellipse(80, 40).move(10, 10)
var text = draw.text('SVG.JS').move(10, 10).font({ size: 36 })

var clip = draw.clip().add(text).add(ellipse)

rect.clipWith(clip)
```

__`returns`: `SVG.Clip`__

### unclip()
Unclipping the elements can be done with the `unclip()` method:

```javascript
rect.unclip()
```

__`returns`: `itself`__

### remove()
Removing the clip alltogether will also `unclip()` all clipped elements as well:

```javascript
clip.remove()
```

__`returns`: `itself`__

### clipper
For your convenience, the clipping element is also referenced in the clipped element. This can be useful in case you want to change the clipPath:

```javascript
rect.clipper.move(10, 10)
```

_This functionality requires the clip.js module which is included in the default distribution._


## Arranging elements
You can arrange elements within their parent SVG document using the following methods.

### front()
Move element to the front:

```javascript
rect.front()
```

__`returns`: `itself`__

### back()
Move element to the back:

```javascript
rect.back()
```

__`returns`: `itself`__

### forward()
Move element one step forward:

```javascript
rect.forward()
```

__`returns`: `itself`__

### backward()
Move element one step backward:

```javascript
rect.backward()
```

__`returns`: `itself`__

### siblings()
The arrange.js module brings some additional methods. To get all siblings of rect, including rect itself:

```javascript
rect.siblings()
```

__`returns`: `array`__

### position()
Get the position (a number) of rect between its siblings:

```javascript
rect.position()
```

__`returns`: `number`__

### next()
Get the next sibling:

```javascript
rect.next()
```

__`returns`: `element`__

### previous()
Get the previous sibling:

```javascript
rect.previous()
```

__`returns`: `element`__

### before()
Insert an element before another:

```javascript
// inserts circle before rect
rect.before(circle)
```

__`returns`: `itself`__

### after()
Insert an element after another:

```javascript
// inserts circle after rect
rect.after(circle)
```

__`returns`: `itself`__

_This functionality requires the arrange.js module which is included in the default distribution._


## Sets
Sets are very useful if you want to modify or animate multiple elements at once. A set will accept all the same methods accessible on individual elements, even the ones that you add with your own plugins! Creating a set is exactly as you would expect:

```javascript
// create some elements
var rect = draw.rect(100,100)
var circle = draw.circle(100).move(100,100).fill('#f09')

// create a set and add the elements
var set = draw.set()
set.add(rect).add(circle)

// change the fill of all elements in the set at once
set.fill('#ff0')
```

A single element can be a member of many sets. Sets also don't have a structural representation, in fact they are just fancy array's.

### add()
Add an element to a set:

```javascript
set.add(rect)
```

Quite a useful feature of sets is the ability to accept multiple elements at once:

```javascript
set.add(rect, circle)
```

__`returns`: `itself`__

### each()
Iterating over all members in a set is the same as with svg containers:

```javascript
set.each(function(i) {
  this.attr('id', 'shiny_new_id_' + i)
})
```

Note that `this` refers to the current child element.

__`returns`: `itself`__

### has()
Determine if an element is member of the set:

```javascript
set.has(rect)
```

__`returns`: `boolean`__

### index()
Returns the index of a given element in the set.

```javascript
set.index(rect) //-> -1 if element is not a member
```

__`returns`: `number`__

### get()
Get the element at a given index:

```javascript
set.get(1)
```

__`returns`: `element`__

### bbox()
Get the bounding box of all elements in the set:

```javascript
set.bbox()
```

__`returns`: `SVG.BBox`__

### remove()
To remove an element from a set:

```javascript
set.remove(rect)
```

__`returns`: `itself`__

### clear()
Or to remove all elements from a set:

```javascript
set.clear()
```

__`returns`: `itself`__

### animate()
Sets work with animations as well:

```javascript
set.animate(3000).fill('#ff0')
```

__`returns`: `SVG.SetFX`__


## Gradients

### gradient()
There are linear and radial gradients. The linear gradient can be created like this:

```javascript
var gradient = draw.gradient('linear', function(stop) {
  stop.at(0, '#333')
  stop.at(1, '#fff')
})
```

__`returns`: `SVG.Gradient`__

### at()
The `offset` and `color` parameters are required for stops, `opacity` is optional. Offset is float between 0 and 1, or a percentage value (e.g. `33%`). 

```javascript
stop.at(0, '#333')
```

or

```javascript
stop.at({ offset: 0, color: '#333', opacity: 1 })
```

__`returns`: `itself`__

### from()
To define the direction you can set from `x`, `y` and to `x`, `y`:

```javascript
gradient.from(0, 0).to(0, 1)
```

The from and to values are also expressed in percent.

__`returns`: `itself`__

### to()
To define the direction you can set from `x`, `y` and to `x`, `y`:

```javascript
gradient.from(0, 0).to(0, 1)
```

The from and to values are also expressed in percent.

__`returns`: `itself`__

### radius()
Radial gradients have a `radius()` method to define the outermost radius to where the inner color should develop:

```javascript
var gradient = draw.gradient('radial', function(stop) {
  stop.at(0, '#333')
  stop.at(1, '#fff')
})

gradient.from(0.5, 0.5).to(0.5, 0.5).radius(0.5)
```

__`returns`: `itself`__

### update()
A gradient can also be updated afterwards:

```javascript
gradient.update(function(stop) {
  stop.at(0.1, '#333', 0.2)
  stop.at(0.9, '#f03', 1)
})
```

And even a single stop can be updated:

```javascript
var s1, s2, s3

draw.gradient('radial', function(stop) {
  s1 = stop.at(0, '#000')
  s2 = stop.at(0.5, '#f03')
  s3 = stop.at(1, '#066')
})

s1.update(0.1, '#0f0', 1)
```

__`returns`: `itself`__

### get()
The `get()` method makes it even easier to get a stop from an existing gradient:

```javascript
var gradient = draw.gradient('radial', function(stop) {
  stop.at({ offset: 0, color: '#000', opacity: 1 })   // -> first
  stop.at({ offset: 0.5, color: '#f03', opacity: 1 }) // -> second
  stop.at({ offset: 1, color: '#066', opacity: 1 })   // -> third
})

var s1 = gradient.get(0) // -> returns "first" stop
```

__`returns`: `SVG.Stop`__

### fill()
Finally, to use the gradient on an element:

```javascript
rect.attr({ fill: gradient })
```

Or:

```javascript
rect.fill(gradient)
```

By passing the gradient instance as the fill on any element, the `fill()` method will be called:

```javascript
gradient.fill() //-> returns 'url(#SvgjsGradient1234)'
```

[W3Schools](http://www.w3schools.com/svg/svg_grad_linear.asp) has a great example page on how
[linear gradients](http://www.w3schools.com/svg/svg_grad_linear.asp) and
[radial gradients](http://www.w3schools.com/svg/svg_grad_radial.asp) work.

_This functionality requires the gradient.js module which is included in the default distribution._

__`returns`: `value`__


## Patterns

### pattern()
Creating a pattern is very similar to creating gradients

```javascript
var pattern = draw.pattern(20, 20, function(add) {
  add.rect(20,20).fill('#f06')
  add.rect(10,10)
  add.rect(10,10).move(10,10)
})
```

This creates a checkered pattern of 20 x 20 pixels. You can add any available element to your pattern.

__`returns`: `SVG.Pattern`__


### update()
A pattern can also be updated afterwards:

```javascript
pattern.update(function(add) {
  add.circle(15).center(10,10)
})
```

__`returns`: `itself`__


### fill()
Finally, to use the pattern on an element:

```javascript
rect.attr({ fill: pattern })
```

Or:

```javascript
rect.fill(pattern)
```

By passing the pattern instance as the fill on any element, the `fill()` method will be called on th pattern instance:

```javascript
pattern.fill() //-> returns 'url(#SvgjsPattern1234)'
```

__`returns`: `value`__


## Data

### Setting
The `data()` method allows you to bind arbitrary objects, strings and numbers to SVG elements:

```javascript
rect.data('key', { value: { data: 0.3 }})
```

Or set multiple values at once:

```javascript
rect.data({
  forbidden: 'fruit'
, multiple: {
    values: 'in'
  , an: 'object'
  }
})
```

__`returns`: `itself`__

### Getting
Fetching the values is similar to the `attr()` method:

```javascript
rect.data('key')
```

__`returns`: `itself`__

### Removing
Removing the data altogether:

```javascript
rect.data('key', null)
```

__`returns`: `itself`__

### Sustaining data types
Your values will always be stored as JSON and in some cases this might not be desirable. If you want to store the value as-is, just pass true as the third argument:

```javascript
rect.data('key', 'value', true)
```

__`returns`: `itself`__


## Memory

### remember() 
Storing data in-memory is very much like setting attributes:

```javascript
rect.remember('oldBBox', rect.bbox())
```

Multiple values can also be remembered at once:

```javascript
rect.remember({
  oldFill:    rect.attr('fill')
, oldStroke:  rect.attr('stroke')
})
```

To retrieve a memory

```javascript
rect.remember('oldBBox')
```

__`returns`: `itself`__

### forget()
Erasing a single memory:

```javascript
rect.forget('oldBBox')
```

Or erasing multiple memories at once:


```javascript
rect.forget('oldFill', 'oldStroke')
```

And finally, just erasing the whole memory:

```javascript
rect.forget()
```

__`returns`: `itself`__

## Events

### Basic events
Events can be bound to elements as follows:

```javascript
rect.click(function() {
  this.fill({ color: '#f06' })
})
```

Removing it is quite as easy:

```javascript
rect.click(null)
```

All available evenets are: `click`, `dblclick`, `mousedown`, `mouseup`, `mouseover`, `mouseout`, `mousemove`, `mouseenter`, `mouseleave`, `touchstart`, `touchmove`, `touchleave`, `touchend` and `touchcancel`.

__`returns`: `itself`__

### Event listeners
You can also bind event listeners to elements:

```javascript
var click = function() {
  this.fill({ color: '#f06' })
}

rect.on('click', click)
```

__`returns`: `itself`__

Unbinding events is just as easy:

```javascript
rect.off('click', click)
```

__`returns`: `itself`__

But there is more to event listeners. You can bind events to html elements as well:

```javascript
SVG.on(window, 'click', click)
```

Obviously unbinding is practically the same:

```javascript
SVG.off(window, 'click', click)
```

### Custom events
You can even create your own events.

The only thing you need to do is register your own event:

```javascript
SVG.registerEvent('my:event')
```

Next you can add an event listener for your newly created event:
```javascript
rect.on('my:event', function() {
  alert('ta-da!')
})
```

Now you are ready to fire the event whenever you need:

```javascript
function whenSomethingHappens() {
  rect.fire('my:event') 
}
```

_Important: always make sure you namespace your event to avoid conflicts. Preferably use something very specific. So `wicked:event` for example would be better than something generic like `svg:event`._

## Numbers

Numbers in svg.js have a dedicated number class to be able to process string values. Creating a new number is simple:

```javascript
var number = new SVG.Number('78%')
number.plus('3%').toString() //-> returns '81%'
number.valueOf() //-> returns 0.81
```

Operators are defined as methods on the `SVG.Number` instance.

### plus()
Addition:

```javascript
number.plus('3%')
```

__`returns`: `itself`__

### minus()
Subtraction:

```javascript
number.minus('3%')
```

__`returns`: `itself`__

### times()
Multiplication:

```javascript
number.times(2)
```

__`returns`: `itself`__

### divide()
Division:

```javascript
number.divide('3%')
```

__`returns`: `itself`__

### to()
Change number to another unit:

```javascript
number.to('px')
```

__`returns`: `itself`__

### morph()
Make a number morphable:

```javascript
number.morph('11%')
```

__`returns`: `itself`__


### at()
Get morphable number at given position:

```javascript
var number = new SVG.Number('79%').morph('3%')
number.at(0.55).toString() //-> '37.2%'
```

__`returns`: `SVG.Number`__


## Colors

Svg.js has a dedicated color class handling different types of colors. Accepted values are:

- hex string; three based (e.g. #f06) or six based (e.g. #ff0066) `new SVG.Color('#f06')`
- rgb string; e.g. rgb(255, 0, 102) `new SVG.Color('rgb(255, 0, 102)')`
- rgb object; e.g. { r: 255, g: 0, b: 102 } `new SVG.Color({ r: 255, g: 0, b: 102 })`

Note that when working with objects is important to provide all three values every time.

The `SVG.Color` instance has a few methods of its own.

### toHex()
Get hex value:

```javascript
color.toHex() //-> returns '#ff0066'
```

__`returns`: hex color string__

### toRgb()
Get rgb string value:

```javascript
color.toRgb() //-> returns 'rgb(255,0,102)'
```

__`returns`: rgb color string__

### brightness()
Get the brightness of a color:

```javascript
color.brightness() //-> returns 0.344
```

This is the perceived brighness where `0` is black and `1` is white.

__`returns`: `number`__

### morph()
Make a color morphable:

```javascript
color.morph('#000')
```

__`returns`: `itself`__

### at()
Get morphable color at given position:

```javascript
var color = new SVG.Color('#ff0066').morph('#000')
color.at(0.5).toHex() //-> '#7f0033'
```

__`returns`: `SVG.Color`__


## Arrays
In svg.js every value list string can be cast and passed as an array. This makes writing them more convenient but also adds a lot of key functionality to them.

### SVG.Array
Is for simple, whitespace separated value strings:

```javascript
'0.343 0.669 0.119 0 0 0.249 -0.626 0.13 0 0 0.172 0.334 0.111 0 0 0 0 0 1 0'
```

Can also be passed like this in a more manageable format:

```javascript
new SVG.Array([ .343,  .669, .119, 0,   0 
              , .249, -.626, .130, 0,   0
              , .172,  .334, .111, 0,   0
              , .000,  .000, .000, 1,  -0 ])
```

### SVG.PointArray 
Is a bit more complex and is used for polyline and polygon elements. This is a poly-point string:

```javascript
'0,0 100,100'
```

The dynamic representation:

```javascript
[
  [0, 0]
, [100, 100]
]
```

Precompiling it as a `SVG.PointArray`:

```javascript
new SVG.PointArray([
  [0, 0]
, [100, 100]
])
```

Note that every instance of `SVG.Polyline` and `SVG.Polygon` carries a reference to the `SVG.PointArray` instance:

```javascript
polygon.array //-> returns the SVG.PointArray instance
```

_Javascript inheritance stack: `SVG.PointArray` < `SVG.Array`_

### SVG.PathArray
Path arrays carry arrays representing every segment in a path string:

```javascript
'M0 0L100 100z'
```

The dynamic representation:

```javascript
[
  ['M', 0, 0]
, ['L', 100, 100]
, ['z']
]
```

Precompiling it as a `SVG.PathArray`:

```javascript
new SVG.PathArray([
  ['M', 0, 0]
, ['L', 100, 100]
, ['z']
])
```

Note that every instance of `SVG.Path` carries a reference to the `SVG.PathArray` instance:

```javascript
path.array //-> returns the SVG.PathArray instance
```

#### Syntax
The syntax for patharrays is very predictable. They are basically literal representations in the form of two dimentional arrays.

##### Move To
Original syntax is `M0 0` or `m0 0`. The svg.js syntax `['M',0,0]` or `['m',0,0]`.

##### Line To
Original syntax is `L100 100` or `l100 100`. The svg.js syntax `['L',100,100]` or `['l',100,100]`.

##### Horizontal line
Original syntax is `H200` or `h200`. The svg.js syntax `['H',200]` or `['h',200]`.

##### Vertical line
Original syntax is `V300` or `v300`. The svg.js syntax `['V',300]` or `['v',300]`.

##### Bezier curve
Original syntax is `C20 20 40 20 50 10` or `c20 20 40 20 50 10`. The svg.js syntax `['C',20,20,40,20,50,10]` or `['c',20,20,40,20,50,10]`.

Or mirrored with `S`:

Original syntax is `S40 20 50 10` or `s40 20 50 10`. The svg.js syntax `['S',40,20,50,10]` or `['s',40,20,50,10]`.

Or quadratic with `Q`:

Original syntax is `Q20 20 50 10` or `q20 20 50 10`. The svg.js syntax `['Q',20,20,50,10]` or `['q',20,20,50,10]`.

Or a complete shortcut with `T`:

Original syntax is `T50 10` or `t50 10`. The svg.js syntax `['T',50,10]` or `['t',50,10]`.

##### Arc
Original syntax is `A 30 50 0 0 1 162 163` or `a 30 50 0 0 1 162 163`. The svg.js syntax `['A',30,50,0,0,1,162,163]` or `['a',30,50,0,0,1,162,163]`.

##### Close
Original syntax is `Z` or `z`. The svg.js syntax `['Z']` or `['z']`.

The best documentation on paths can be found at https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths.


_Javascript inheritance stack: `SVG.PathArray` < `SVG.Array`_

### morph()
In order to animate array values the `morph()` method lets you pass a destination value. This can be either the string value, a plain array or an instance of the same type of svg.js array:

```javascript
var array = new SVG.PointArray([[0, 0], [100, 100]])
array.morph('100,0 0,100 200,200')
```

This method will prepare the array ensuring both the source and destination arrays have the same length.

Note that this method is currently not available on `SVG.PathArray` but will be soon.

__`returns`: `itself`__

### at()
This method will morph the array to a given position between `0` and `1`. Continuing with the previous example:

```javascript
array.at(0.27).toString() //-> returns '27,0 73,100 127,127'
```

Note that this method is currently not available on `SVG.PathArray` but will be soon.

__`returns`: new instance__

### settle()
When morphing is done the `settle()` method will eliminate any transitional points like duplicates:

```javascript
array.settle()
```

Note that this method is currently not available on `SVG.PathArray` but will be soon.

__`returns`: `itself`__

### move()
Moves geometry of the array with the given `x` and `y` values:

```javascript
var array = new SVG.PointArray([[0, 0], [100, 100]])
array.move(33,75)
array.toString() //-> returns '33,75 133,175'
```

Note that this method is only available on `SVG.PointArray` and `SVG.PathArray`

__`returns`: `itself`__

### size()
Resizes geometry of the array by the given `width` and `height` values:

```javascript
var array = new SVG.PointArray([[0, 0], [100, 100]])
array.move(100,100).size(222,333)
array.toString() //-> returns '100,100 322,433'
```

Note that this method is only available on `SVG.PointArray` and `SVG.PathArray`

__`returns`: `itself`__

### reverse()
Reverses the order of the array:

```javascript
var array = new SVG.PointArray([[0, 0], [100, 100]])
array.reverse()
array.toString() //-> returns '100,100 0,0'
```

__`returns`: `itself`__

### bbox()
Gets the bounding box of the geometry of the array:

```javascript
array.bbox()
```

Note that this method is only available on `SVG.PointArray` and `SVG.PathArray`

__`returns`: `object`__


## Extending functionality

### SVG.invent()
Creating your own custom elements with svg.js is piece of cake thanks to the `SVG.invent` function. For the sake of this example, lets "invent" a shape. We want a `rect` with rounded corners that are always proportional to the height of the element. The new shape lives in the `SVG` namespace and is called `Rounded`. Here is how we achieve that.

```javascript
SVG.Rounded = SVG.invent({
  // Define the type of element that should be created
  create: 'rect'

  // Specify from which existing class this shape inherits
, inherit: SVG.Shape

  // Add custom methods to invented shape
, extend: {
    // Create method to proportionally scale the rounded corners
    size: function(width, height) {
      return this.attr({
        width:  width
      , height: height
      , rx:     height / 5
      , ry:     height / 5
      })
    }
  }

  // Add method to parent elements
, construct: {
    // Create a rounded element
    rounded: function(width, height) {
      return this.put(new SVG.Rounded).size(width, height)
    }
    
  }
})
```

To create the element in your drawing:

```javascript
var rounded = draw.rounded(200, 100)
```

That's it, the invention is now ready to be used!

#### Accepted values
The `SVG.invent()` function always expectes an object. The object can have the following configuration values:

- `create`: can be either a string with the node name (e.g. `rect`, `ellipse`, ...) or a custom initializer function; `[required]`
- `inherit`: the desired svg.js class to inherit from (e.g. `SVG.Shape`, `SVG.Element`, `SVG.Container`, `SVG.Rect`, ...); `[optional but recommended]`
- `extend`: an object with the methods that should be applied to the element's prototype; `[optional]`
- `construct`: an objects with the methods to create the element on the parent element; `[optional]`
- `parent`: an svg.js parent class on which the methods in the passed `construct` object should be available; `[optional]`

Svg.js uses the `SVG.invent()` function to create all internal elements, so have a look at the source to see how this function is used in various ways.


### SVG.extend()
Svg.js has a modular structure. It is very easy to add you own methods at different levels. Let's say we want to add a method to all shape types then we would add our method to SVG.Shape:

```javascript
SVG.extend(SVG.Shape, {
  paintRed: function() {
    return this.fill('red')
  }
})
```

Now all shapes will have the paintRed method available. Say we want to have the paintRed method on an ellipse apply a slightly different color:

```javascript
SVG.extend(SVG.Ellipse, {
  paintRed: function() {
    return this.fill('orangered')
  }
})

```
The complete inheritance stack for `SVG.Ellipse` is:

_`SVG.Ellipse` < `SVG.Shape` < `SVG.Element`_

The SVG document can be extended by using:

```javascript
SVG.extend(SVG.Doc, {
  paintAllPink: function() {
    this.each(function() {
      this.fill('pink')
    })
  }
})
```

You can also extend multiple elements at once:
```javascript
SVG.extend(SVG.Ellipse, SVG.Path, SVG.Polygon, {
  paintRed: function() {
    return this.fill('orangered')
  }
})
```


## Plugins
Here are a few nice plugins that are available for svg.js:

### absorb
[svg.absorb.js](https://github.com/wout/svg.absorb.js) absorb raw SVG data into a svg.js instance.

### draggable
[svg.draggable.js](https://github.com/wout/svg.draggable.js) to make elements draggable.

### easing
[svg.easing.js](https://github.com/wout/svg.easing.js) for more easing methods on animations.

### export
[svg.export.js](https://github.com/wout/svg.export.js) export raw SVG.

### filter
[svg.filter.js](https://github.com/wout/svg.filter.js) adding svg filters to elements.

### foreignobject
[svg.foreignobject.js](https://github.com/john-memloom/svg.foreignobject.js) foreignObject implementation (by john-memloom).

### import
[svg.import.js](https://github.com/wout/svg.import.js) import raw SVG data.

### math
[svg.math.js](https://github.com/otm/svg.math.js) a math extension (by Nils Lagerkvist).

### path
[svg.path.js](https://github.com/otm/svg.path.js) for manually drawing paths (by Nils Lagerkvist).

### shapes
[svg.shapes.js](https://github.com/wout/svg.shapes.js) for more polygon based shapes.

### topath
[svg.topath.js](https://github.com/wout/svg.topath.js) to convert any other shape to a path.


## Contributing
All contributions are very welcome but please make sure you:

- maintain the coding style
  - __indentation__ of 2 spaces
  - no tailing __semicolons__
  - single __quotes__
  - use one line __comments__ to describe any additions
  - look around and you'll know what to do
- write at least one spec example per implementation or modification

Before running the specs you will need to build the library.
Be aware that pull requests without specs will be declined.


## Building
Starting out with the default distribution of svg.js is good. Although you might want to remove some modules to keep the size at minimum.

You will need ruby, RubyGems, and rake installed on your system.

``` sh
# dependencies:
$ ruby -v
$ gem -v
$ rake -V

# required to generate the minified version:
$ gem install uglifier
```

Build svg.js by running `rake`:

``` sh
$ rake
Original version: 32.165k
Minified: 14.757k
Minified and gzipped: 4.413k, compression factor 7.289
```

The resulting files are:

1. `dist/svg.js`
2. `dist/svg.min.js`

To include optional modules and remove default ones, use the `concat` task. In
this example, 'clip' is removed, but 'group' and 'arrange' are added:

``` sh
$ rake concat[-clip:group:arrange] dist
```

To build the base library only including shapes:

``` sh
rake concat[-fx:-event:-group:-arrange:-mask:-gradient:-nested:-sugar] dist
```


## Compatibility

### Desktop
- Firefox 3+
- Chrome 4+
- Safari 3.2+
- Opera 9+
- IE9 +

### Mobile
- iOS Safari 3.2+
- Android Browser 3+
- Opera Mobile 10+
- Chrome for Android 18+
- Firefox for Android 15+

Visit the [svg.js test page](http://svgjs.com/test) if you want to check compatibility with different browsers.

Important: this library is still in beta, therefore the API might be subject to change in the course of development.
