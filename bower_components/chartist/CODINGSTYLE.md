# Web Styleguide - Style guide to harmonize HTML, Javascript and CSS / Sass coding style

This document defines formatting and style rules for HTML, Javascript and CSS / SCSS. It aims at improving
collaboration, code quality, and enabling supporting infrastructure. It applies to raw, working files that use HTML,
Javascript and CSS, including Sass (SCSS) files.

If a group of developers start to use a style guide, errors become more obvious. If a certain parts of code are not
complying with the style guide it could be a style error but it could also be a bug. This makes it easier to review
code and to ensure errors are spotted more easily.

Tools are free to obfuscate, minify, and compile as long as the general code quality is maintained
and the raw files developers need to work with comply with the style guide.

You can also contribute to this style guide!

***

## General style rules

This section covers some general style rules that can be applied for HTML, Javascript and CSS / SCSS.

***

### File / Resource names

All file names in a web project should follow the same naming conventions. For readability purpose the minus (-) sign
is ideal for separating parts in a file name. Also it's a common separator in canonical URL and URL slugs
(i.e. `//example.com/blog/my-blog-entry` or `//s.example.com/images/big-black-background.jpg`). Therefore it's quite obvious
that the minus sign should be used to separate parts in a resource name.

Always start a file name with a letter and avoid numbers (except versions in the post-fix as outlined in the post-fix
note) where possible. There are special allowed cases where you need to start a filename with a special sign in order to
flag it for a special purpose (i.e. underscore for compass to ignore a certain file for direct css compilation).

All letters in a resource name should be lower case. This is a best practice as some operating systems support case
sensitive file names and we should not mix the cases to minimize confusion and possible sources for human errors.

There are cases where you will need to include some post- or pre-fixes or extensions (i.e. .min.js, .min.css) or
reeving which includes some pre-fixes (i.e. file hashes like 3fa89b.main.min.css). In those cases we recommend to use
dot's to separate the clear purpose of this additional meta-data in a filename.

**Not recommended**
```
MyScript.js
myCamelCaseName.css
i_love_underscores.html
1001-scripts.js
my-file-min.css
```

**Recommended**
```
my-script.js
my-camel-case-name.css
i-love-underscores.html
thousand-and-one-scripts.js
my-file.min.css
```

***

### Protocol

Omit the protocol from embedded resources.

Omit the protocol portion (`http:`, `https:`) from URLs pointing to images and other media files, style sheets, and
scripts unless the respective files are not available over both protocols.

Omitting the protocol—which makes the URL relative—prevents mixed content issues and results in minor file size savings.

**Not recommended**
```
<script src="http://cdn.com/foundation.min.js"></script>
```

**Recommended**
```
<script src="//cdn.com/foundation.min.js"></script>
```

**Not recommended**
```
.example {
  background: url(http://static.example.com/images/bg.jpg);
}
```

**Recommended**
```
.example {
  background: url(//static.example.com/images/bg.jpg);
}
```

***

### Text indentation

Indent by 2 spaces at a time.

```
<ul>
  <li>Fantastic</li>
  <li>Great</li>
  <li>
    <a href="#">Test</a>
  </li>
</ul>
```

```
@media screen and (min-width: 1100px) {
  body {
    font-size: 100%;
  }
}
```

```
(function(){
  var x = 10;

  function y(a, b) {
    return {
      result: (a + b) * x
    }

  }
}());
```

***

### Comments

Comments are the only way others and **YOURSELF** know why a particular code was written and why it was written in the
way it was. It's crucial that you comment your code parts and specially code that is not trivial.

Self explaining code is a **MYTH**. There is no such thing as self explaining code. Also there is no such thing as too
many comments. There is only too little comments.

When you comment code don't comment what's coded, comment why it was coded this way and comment the thinking behind.
Also include links in your comments to open issues, specifications etc.

**Not recommended**
```
var offset = 0;

if(includeLabels) {
  // Add offset of 20
  offset = 20;
}
```

**Recommended**
```
var offset = 0;

if(includeLabels) {
  // If the labels are included we need to have a minimum offset of 20 pixels
  // We need to set it explicitly because of the following bug: http://somebrowservendor.com/issue-tracker/ISSUE-1
  offset = 20;
}
```

Consider using annotations in your comments that help to structure commends and add meta information. For Javascript
use [JSDoc](http://usejsdoc.org/) or [YUIDoc](http://yui.github.io/yuidoc/). You can also use tools to generate
documentation from these comments. This is also a great way to encourage developers to write comments. Once comments
will be used to generate a living documentation they often start to spend more time for detailed comments.

***

### Code linting

For programming languages with less strictness it's important to enforce style rules and formatting guidelines.
Writing and following a style guide is a good practice but having an automated process that is enforcing it is even
better. Trust is good, control is better.

For Javascript we recommend to use JSLint / JSHint. In the repository for this styleguide you can also find a
[dotfile for jshint (.jshintrc)](.jshintrc). You can use this file with JSHint to enforce style
checking in your Javascript projects.

***

## HTML style rules

***

### Document type

HTML5 (HTML syntax) is preferred for all HTML documents: `<!DOCTYPE html>`.

(It’s recommended to use HTML, as text/html. Do not use XHTML. XHTML, as application/xhtml+xml,
lacks both browser and infrastructure support and offers less room for optimization than HTML.)

Although fine with HTML, do not close void elements, i.e. write `<br>`, not `<br />`.

***

### HTML validity

Use valid HTML code unless that is not possible due to otherwise unattainable performance goals regarding file size.

Use tools such as the W3C HTML validator to test.

Using valid HTML is a measurable baseline quality attribute that contributes to learning about technical requirements
and constraints, and that ensures proper HTML usage.

**Not recommended**
```
<title>Test</title>
<article>This is only a test.
```

**Recommended**
```
<!DOCTYPE html>
<meta charset="utf-8">
<title>Test</title>
<article>This is only a test.</article>
```

***

### Optional Tags

The HTML5 specification defines what tags can be omitted in the HTML markup. For readability purpose the raw source
file should **NOT** omit optional tags. Omitting optional tags can lead to readability and scannability issues, and
therefore should not be used in the raw source files.

Omitting tags can lead to significant page size reductions specially on large scale sites. For this purpose you should
consider an HTML minification post processing of your raw files for distribution purpose.

***

### Script loading

For performance reasons it's important to load scripts asynchronously. A script loaded in the `<head>` like this
`<script src="main.js"></script>` will block the whole DOM parsing until the script has fully loaded and executed. This
will delay the page to be displayed until the script has fully loaded. With larger scripts this can have a big impact
on user experience.

Asynchronous script loading helps to minimize this performance impact. If browser support is only concerned about IE10+
the HTML5 async attribute on scripts should be used. This will prevent DOM parser blocking and you can even place your
script element into the `<head>` element.

If you need to support older browsers it's common practice to use script loaders that will make use of dynamic script
injection. You should consider [yepnope](http://yepnopejs.com/) or [labjs](http://labjs.com/). The problem with injected
scripts though is that [they will not start loading until CSS Object Model is ready](https://www.igvita.com/2014/05/20/script-injected-async-scripts-considered-harmful/)
(shortly after the CSS from the head is loaded). This can also load to delay of your behavior added by these javascript
which can again affect the user experience.

As a result of the above described behaviors you should always consider the following best practice if you need to
support old browsers (IE9-).

Add your script element just before the body close tag and add them with a async attribute. This will not load the
scripts asynchronously on old browsers but they will only block the DOM parser just before the body close which is not
affecting the user experience too much. On modern browsers this will delay the script load until the DOM parser
discovers the script element at the end of the body, but they will then asynchronously load the script and don't wait
for CSSOM to complete before loading (execution will still happen after CSSOM).

**Recommended for modern and old browsers**
```
<html>
  <head>
    <link rel="stylesheet" href="main.css">
  </head>
  <body>
    <!-- body goes here -->

    <script src="main.js" async></script>
  </body>
</html>
```

**Recommended for only modern browsers**
```
<html>
  <head>
    <link rel="stylesheet" href="main.css">
    <script src="main.js" async></script>
  </head>
  <body>
    <!-- body goes here -->
  </body>
</html>
```

***

### Semantics

Use elements (sometimes incorrectly called “tags”) for what they have been created for. For example, use heading
elements for headings, p elements for paragraphs, a elements for anchors, etc.

Using HTML according to its purpose is important for accessibility, reuse, and code efficiency reasons.

The following bad / good example should outline some of the major important semantic HTML cases:

**Not recommended**
```
<b>My page title</b>
<div class="top-navigation">
  <div class="nav-item"><a href="#home">Home</a></div>
  <div class="nav-item"><a href="#news">News</a></div>
  <div class="nav-item"><a href="#about">About</a></div>
</div>

<div class="news-page">
  <div class="page-section news">
    <div class="title">All news articles</div>
    <div class="news-article">
      <h2>Bad article</h2>
      <div class="intro">Introduction sub-title</div>
      <div class="content">This is a very bad example for HTML semantics</div>
      <div class="article-side-notes">I think I'm more on the side and should not receive the main credits</div>
      <div class="article-foot-notes">
        This article was created by David <div class="time">2014-01-01 00:00</div>
      </div>
    </div>

    <div class="section-footer">
      Related sections: Events, Public holidays
    </div>
  </div>
</div>

<div class="page-footer">
  Copyright 2014
</div>
```

**Recommended**
```
<!-- The page header should go into a header element -->
<header>
  <!-- As this title belongs to the page structure it's a heading and h1 should be used -->
  <h1>My page title</h1>
</header>

<!-- All navigation should go into a nav element -->
<nav class="top-navigation">
  <!-- A listing of elements should always go to UL (OL for ordered listings) -->
  <ul>
    <li class="nav-item"><a href="#home">Home</a></li>
    <li class="nav-item"><a href="#news">News</a></li>
    <li class="nav-item"><a href="#about">About</a></li>
  </ul>
</nav>

<!-- The main part of the page should go into a main element (also use role="main" for accessibility) -->
<main class="news-page" role="main">
  <!-- A section of a page should go into a section element. Divide a page into sections with semantic elements. -->
  <section class="page-section news">
    <!-- A section header should go into a section element -->
    <header>
      <!-- As a page section belongs to the page structure heading elements should be used (in this case h2) -->
      <h2 class="title">All news articles</h2>
    </header>

    <!-- If a section / module can be seen as an article (news article, blog entry, products teaser, any other
     re-usable module / section that can occur multiple times on a page) a article element should be used -->
    <article class="news-article">
      <!-- An article can contain a header that contains the summary / introduction information of the article -->
      <header>
        <!-- As a article title does not belong to the overall page structure there should not be any heading tag! -->
        <div class="article-title">Good article</div>
        <!-- Small can optionally be used to reduce importance -->
        <small class="intro">Introduction sub-title</small>
      </header>

      <!-- For the main content in a section or article there is no semantic element -->
      <div class="content">
        <p>This is a good example for HTML semantics</p>
      </div>
      <!-- For content that is represented as side note or less important information in a given context use aside -->
      <aside class="article-side-notes">
        <p>I think I'm more on the side and should not receive the main credits</p>
      </aside>
      <!-- Articles can also contain footers. If you have footnotes for an article place them into a footer element -->
      <footer class="article-foot-notes">
        <!-- The time element can be used to annotate a timestamp. Use the datetime attribute to specify ISO time
         while the actual text in the time element can also be more human readable / relative -->
        <p>This article was created by David <time datetime="2014-01-01 00:00" class="time">1 month ago</time></p>
      </footer>
    </article>

    <!-- In a section, footnotes or similar information can also go into a footer element -->
    <footer class="section-footer">
      <p>Related sections: Events, Public holidays</p>
    </footer>
  </section>
</main>

<!-- Your page footer should go into a global footer element -->
<footer class="page-footer">
  Copyright 2014
</footer>

```

***

### Multimedia fallback

For multimedia, such as images, videos, animated objects via canvas, make sure to offer alternative access. For images
that means use of meaningful alternative text (alt) and for video and audio transcripts and captions, if available.

Providing alternative contents is important for accessibility reasons: A blind user has few cues to tell what an
image is about without @alt, and other users may have no way of understanding what video or audio contents are about
either.

(For images whose alt attributes would introduce redundancy, and for images whose purpose is purely decorative which
you cannot immediately use CSS for, use no alternative text, as in alt="".)

**Not recommended**
```
<img src="luke-skywalker.jpg">
```

**Recommended**
```
<img src="luke-skywalker.jpg" alt="Luke skywalker riding an alien horse">
```

When writing alt tags always try to describe the image as if you'd need to describe what's on the image to somebody
over the phone or who can't see the real picture.

**Not recommended**
```
<img src="huge-spaceship-approaching-earth.jpg" alt="Header image">
```

**Recommended**
```
<img src="huge-spaceship-approaching-earth.jpg" alt="A huge spaceship that is approaching the earth">
```

***

### Separation of Concerns

It's very important that you understand the different concerns in web and that you know how to and why to separate them.
In the web we have information (html markup), appearance (css) and behavior (Javascript) and we need to separate them as
far as possible in order to keep a maintainable and clean code.

Strictly keep structure (markup), presentation (styling), and behavior (scripting) apart, and try to keep the
interaction between the three to an absolute minimum.

That is, make sure documents and templates contain only HTML and HTML that is solely serving structural purposes.
Move everything presentational into style sheets, and everything behavioral into scripts.

In addition, keep the contact area as small as possible by linking as few style sheets and scripts as possible from
documents and templates.

Clean separation of concerns implies the following things:

1.  Don't use more than one or two stylesheets (i.e. main.css, vendor.css)
1.  Don't use more than one or two scripts (use concatination)
1.  Don't use inline styles (`<style>.no-good {}</style>`)
1.  Don't use element style attributes (`<hr style="border-top: 5px solid black">`)
1.  Don't use inline scripts (`<script>alert('no good')</script>`)
1.  Don't use presentational elements (i.e. `<b>`, `<u>`, `<center>`, `<font>`, `<b>`
1.  Don't use presentational class names (i.e. red, left, center)

**Not recommended**
```
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="base.css">
  <link rel="stylesheet" href="grid.css">
  <link rel="stylesheet" href="type.css">
  <link rel="stylesheet" href="modules/teaser.css">
</head>
<body>
  <h1 style="font-size: 3rem"></h1>
  <b>I'm a subtitle and I'm bold!</b>
  <center>Dare you center me!</center>
  <script>
    alert('Just dont...');
  </script>
  <div class="red">I'm important!</div>
</body>
</html>
```

**Recommended**
```
<!DOCTYPE html>
<html>
<head>
  <!-- Concatinate your style sheets into a single one -->
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <!-- Don't use style attributes but assign sensible classes and apply styles in the stylesheet -->
  <h1 class="title"></h1>
  <!-- Don't use presentational elements and assign sensible classes -->
  <div class="sub-title">I'm a subtitle and I'm bold!</div>
  <!-- Maybe your comments get centered in your presentation but that decision is up to the stylesheet -->
  <span class="comment">Dare you center me!</span>
  <!-- You wanted to make it red because it's important so then also name the class important and decide in the stylesheet
   what you want to do with it -->
  <div class="important">I'm important!</div>

  <!-- Put all your scripts into files and concatinate them into a single one -->
  <script async src="main.js"></script>
</body>
</html>
```

***

### HTML is content only

Don't pollute your HTML markup with non-content information. There is a tendency to solve design problems at
the information's cost. The HTML markup should only contain content relevant information and design problems should
never be solved within the markup.

The only purpose of HTML markup is to represent content information.

- Don't introduce a specific HTML structure just to solve some visual design problems
- Don't use `<img>` elements for visual design elements

The following examples show two common things that are done wrong when it comes to solving design problems.

**Not recommended**
```
<!-- We should not introduce an additional element just to solve a design problem  -->
<span class="text-box">
  <span class="square"></span>
  See the square next to me?
</span>

```
```
.text-box > .square {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  background-color: red;
}
```


**Recommended**
```
<!-- That's clean markup! -->
<span class="text-box">
  See the square next to me?
</span>

```
```
// We use a :before pseudo element to solve the design problem of placing a colored square in front of the text content
.text-box:before {
  content: "";
  display: inline-block;
  width: 1rem;
  height: 1rem;
  background-color: red;
}
```

The only reason for images and svg graphics to be included in the markup is because they represent content relevant
information.

**Not recommended**
```
<!-- Content images should never be used for design elements!  -->
<span class="text-box">
  <img src="square.svg" alt="Square" />
  See the square next to me?
</span>
```

**Recommended**
```
<!-- That's clean markup! -->
<span class="text-box">
  See the square next to me?
</span>

```
```
// We use a :before pseudo element with a background image to solve the problem
.text-box:before {
  content: "";
  display: inline-block;
  width: 1rem;
  height: 1rem;
  background: url(square.svg) no-repeat;
  background-size: 100%;
}
```

***

### Type attributes

Omit type attributes for style sheets and scripts. Do not use type attributes for style sheets (unless not using CSS)
and scripts (unless not using JavaScript). Specifying type attributes in these contexts is not necessary as
HTML5 implies text/css and text/javascript as defaults. This can be safely done even for older browsers.

**Not recommended**
```
<link rel="stylesheet" href="main.css" type="text/css">
<script src="main.js" type="text/javascript"></script>
```

**Recommended**
```
<link rel="stylesheet" href="main.css">
<script src="main.js"></script>
```

***

### General Accessibility

If you use proper HTML5 semantics a lot of accessibility issues are already solved. ARIA is using some default roles
for most of the semantic elements which, if used correctly, solves a lot of the issues already. If you use `nav`,
`aside`, `main`, `footer` etc. ARIA will use some related default roles. For more details you can reference the
[ARIA specification](http://rawgit.com/w3c/aria-in-html/master/index.html#recommendations-table) recommendation table
which contains the defaults for the HTML semantic elements.

Additional roles can be used to give more accessibility context (i.e. `role="tab"`).

***

### Tab Index for Accessibility

Check your document for tab order and assign tabindex values in order to change the tab flow based on priority. You
can disable the tab index of an element by setting `tabindex="-1"` on any element.

If you add functionality to a element that is not focusable by default, you should always add a `tabindex` in order to
make the element focusable. This will also enable the CSS pseudo selector `:focus`. Choose an appropriate index value
for `tabindex` or use `tabindex="0"` to group elements into one tab order level and enforce ordering in natural reading
order.

***

### Microdata for SEO and Accessibility

If the SEO relevance and / or accessibility environment is given then you should consider to use microdata where
possible. Microdata is a way to annotate your data in your markup that follows some specific semantics.

Google, Microsoft and Yahoo! have more or less agreed on how to use this additional data and using it correctly has
great influence on your searches.

You can visit [schema.org](http://schema.org/) for more details.

Simple example of a movie on a web page:

**Without microdata**
```
<div>
 <h1>Avatar</h1>
 <span>Director: James Cameron (born August 16, 1954)</span>
 <span>Science fiction</span>
 <a href="../movies/avatar-theatrical-trailer.html">Trailer</a>
</div>
```

**With microdata**
```
<div itemscope itemtype ="http://schema.org/Movie">
  <h1 itemprop="name">Avatar</h1>
  <div itemprop="director" itemscope itemtype="http://schema.org/Person">
  Director: <span itemprop="name">James Cameron</span> (born <span itemprop="birthDate">August 16, 1954)</span>
  </div>
  <span itemprop="genre">Science fiction</span>
  <a href="../movies/avatar-theatrical-trailer.html" itemprop="trailer">Trailer</a>
</div>
```

***

### IDs for anchors

It's generally a good practice to give all headings on a page a ID. With these ID's on headings you can use the
browsers default behavior and include the ID names as hash tags in the URL. By default this causes the browser to scroll
to the position this element.

If you'd enter the URL `http://your-site.com/about#best-practices` in your browser then the browser would scroll down
so that the H3 below would be scrolled into the view.

```
<h3 id="best-practices">Best practices</h3>
```

***

### General formatting

Use a new line for every block, list, or table element, and indent every such child element.
Independent of the styling of an element (as CSS allows elements to assume a different role per display property),
put every block, list, or table element on a new line.

Also, indent them if they are child elements of a block, list, or table element.

(If you run into issues around whitespace between list items it’s acceptable to put all li elements in one line.
A linter is encouraged to throw a warning instead of an error.)

**Recommended**
```
<blockquote>
  <p><em>Space</em>, the final frontier.</p>
</blockquote>

<ul>
  <li>Moe</li>
  <li>Larry</li>
  <li>Curly</li>
</ul>

<table>
  <thead>
    <tr>
      <th scope="col">Income</th>
      <th scope="col">Taxes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>$ 5.00</td>
      <td>$ 4.50</td>
    </tr>
  </tbody>
</table>
```

***

### HTML quotation marks

When quoting attributes values, use double quotation marks. Use double ("") rather than single quotation marks ('')
around attribute values.

**Not recommended**
```
<div class='news-article'></div>
```

**Recommended**
```
<div class="news-article"></div>
```

***

## Javascript style guide

***

### Global namespace pollution and IIFE

Always wrap your code into a IIFE (Immediately-Invoked Function Expression) in order to create an isolated closure
scope. This prevents you from polluting the global namespace.

IIFE can also secure your code from modifications that happened in the global namespace (i.e. 3rd party libraries,
window reference, overridden undefined keyword etc.)

**Not recommended**
```
var x = 10,
    y = 100;

// Declaring variables in the global scope is resulting in global scope pollution. All variables declared like this
// will be stored in the window object. This is very unclean and needs to be avoided.
console.log(window.x + ' ' + window.y);
```

**Recommended**
```
// We declare a IIFE and pass parameters into the function that we will use from the global space
(function(log, w, undefined){
  'use strict';

  var x = 10,
      y = 100;

  // Will output 'true true'
  log((w.x === undefined) + ' ' + (w.y === undefined));

}(window.console.log, window));
```

***

### IIFE (Immediately-Executed Function Expression)

Use IIFE whenever you want to create a new closure scope. This can be used to create privacy and to keep memory clean.

Every javascript file should start with an IIFE.

The IIFE should be written so you're keeping the execution brackets inside of the surrounding brackets. Although the
writing the executing brackets outside of the surrounding brackets is valid the second example should be used as this
sets clear boundaries for the IIFE as the surrounding brackets isolate the whole IIFE.

**Not recommended**
```
(function(){})();
```

**Recommended**
```
(function(){}());
```

The following pattern should be used to format your IIFE:

```
(function(){
  'use strict';

  // Code goes here

}());
```

If you want to use global variables or variables form an outer IIFE you should pass them as parameters to your IIFE:
```
(function($, w, d){
  'use strict';

  $(function() {
    w.alert(d.querySelectorAll('div').length);
  });
}(jQuery, window, document));
```

***

### Strict mode

ECMAScript 5 strict mode can be enabled globally in your script or on function level. It enables more strict error
handling as well different javascript semantics. Strict mode also enforces a syntax that allows engines to optimize
the javascript better and strict more scripts can run faster than normal scripts.

Strict mode also blocks the usage of reserved words that possibly get introduced in the future.

You should always enforce strict mode in your scripts. Do so by applying it in your isolation IIFE. Don't apply it to
your whole script by include it as first statement in your script. This could possibly cause issues with 3rd party
libraries.

**Not recommended**
```
// Script starts here
'use strict';

(function(){

  // Your code starts here

}());
```

**Recommended**
```
(function(){
  'use strict';

  // Your code starts here

}());
```

***

### Variable declarations

Always use `var` to declare your variables. When you fail to specify var, the variable gets placed in the global
context, potentially clobbering existing values. Also, if there's no declaration, it's hard to tell in what scope a
variable lives (e.g., it could be in the Document or Window just as easily as in the local scope).
So always declare with var.

Using strict mode can help to identify issues where you might mistyped a variable name resulting in a ReferenceError.

**Not recommended**
```
x = 10;
y = 100;
```

**Recommended**
```
var x = 10,
    y = 100;
```

***

### Understand Javascript scope and hoisting

In Javascript variable and function declarations will be hoisted before execution. Javascript only knows function scope
and there is no block scope as you know it from other programming languages. This means that if you declare a variable
inside a if statement or for loop this variable is declared for the whole function scope and not only locally in the
block statement.

To illustrate this check the following example that will show how a javascript interpreter is hoisting the declarations
in a function scope:

**Raw function**
```
(function(log){
  'use strict';

  var a = 10;

  for(var i = 0; i < a; i++) {
    var b = i * i;
    log(b);
  }

  if(a === 10) {
    var f = function() {
      log(a);
    };
    f();
  }

  function x() {
    log('Mr. X!');
  }
  x();

}(window.console.log));
```

**Hoisted by Javscript engine**
```
(function(log){
  'use strict';
  // All variables used in the closure will be hoisted to the top of the function
  var a,
      i,
      b,
      f;
  // All functions in the closure will be hoisted to the top
  function x() {
    log('Mr. X!');
  }

  a = 10;

  for(i = 0; i < a; i++) {
    b = i * i;
    log(b);
  }

  if(a === 10) {
    // Function assignments will only result in hoisted variables but the function body will not be hoisted
    // Only by using a real function declaration the whole function will be hoisted with its body
    f = function() {
      log(a);
    };
    f();
  }

  x();

}(window.console.log));
```

Considering now the hoisting above you can now see that you could also run the following code without any exceptions:

**Valid code**
```
(function(log){
  'use strict';

  var a = 10;

  i = 5;

  x();

  for(var i; i < a; i++) {
    log(b);
    var b = i * i;
  }

  if(a === 10) {
    f = function() {
      log(a);
    };
    f();

    var f;
  }

  function x() {
    log('Mr. X!');
  }

}(window.console.log));
```

As you can see this looks very confusing and misunderstanding hoisting can lead to unexpected results. To minimize the
risk of errors and bugs that resulted from misunderstanding hoisting your should follow the style rule of hoisted
declarations in the next section.

***

### Use hoisted declarations

To minimize risk of misunderstanding and misinterpreting results from hoisted variable and function declarations (see
previous section) you should always try to hoist your variable and function declarations manually. This means that
you should declare all your variables that you're using in a function as a fist statement in the function.

Use only one `var` keyword and comma separate multiple declarations.

**Not recommended**
```
(function(log){
  'use strict';

  var a = 10;
  var b = 10;

  for(var i = 0; i < 10; i++) {
    var c = a * b * i;
  }

  function f() {

  }

  var d = 100;
  var x = function() {
    return d * d;
  };
  log(x());

}(window.console.log));
```

**Recommended**
```
(function(log){
  'use strict';

  var a = 10,
      b = 10,
      i,
      c,
      d,
      x;

  function f() {

  }

  for(i = 0; i < 10; i++) {
    c = a * b * i;
  }



  d = 100;
  x = function() {
    return d * d;
  };
  log(x());

}(window.console.log));
```

Being pragmatic you should directly initialize your variables during hoisted declaration.

**Not recommended**
```
var a,
    b,
    c;

a = 10;
b = 10;
c = 100;
```

**Recommended**
```
var a = 10,
    b = 10,
    c = 100;
```

***

### Always use strict equal

Always use `===` explicit comparison operators and avoid the hassle you can go through by debugging issues resulted
from the very much overcomplicated javascript type coercion.

If you're using `===` operators both operands need to be from the same type in order to be valid and there will no
type coercion be performed.

If you'd like to get more information on type coercion you should read
[this article by Dmitry Soshnikov](http://dmitrysoshnikov.com/notes/note-2-ecmascript-equality-operators/).

By using only `==` you're telling javascript to use type coercion where needed which can be very complicated to trace
down. A few examples can be seen below that should give you a indication how strange type coercion can feel:

```
(function(log){
  'use strict';

  log('0' == 0); // true
  log('' == false); // true
  log('1' == true); // true
  log(null == undefined); // true

  var x = {
    valueOf: function() {
      return 'X';
    }
  };

  log(x == 'X');

}(window.console.log));
```

***

### Use truthy / falsy checks wisely

By only putting one variable or expression into a if statement you're creating a truthy / falsy check. The expression
`if(a == true)` is not the same as `if(a)`. The later expression is creating a special check which is called truthy /
falsy check. This check performs some special operations in order to evaluate to true or false. The following
expressions are falsy in javascript `false`, `0`, `undefined`, `null`, `NaN`, `''` (empty string).

Truthy / falsy checks are very helpful as they allow you to quickly react on a group of conditions that you'd like to
take care of but you need to be sure about what you actually want to do.

The following example shows how truthy / falsy checks work:

```
(function(log){
  'use strict';

  function logTruthyFalsy(expr) {
    if(expr) {
      log('truthy');
    } else {
      log('falsy');
    }
  }

  logTruthyFalsy(true); // truthy
  logTruthyFalsy(1); // truthy
  logTruthyFalsy({}); // truthy
  logTruthyFalsy([]); // truthy
  logTruthyFalsy('0'); // truthy

  logTruthyFalsy(false); // falsy
  logTruthyFalsy(0); // falsy
  logTruthyFalsy(undefined); // falsy
  logTruthyFalsy(null); // falsy
  logTruthyFalsy(NaN); // falsy
  logTruthyFalsy(''); // falsy

}(window.console.log));
```

***

### Logical operators for variable assignments

The logical operators `||` and `&&` can also be used to return non-boolean values. If used with non booleans the
operands will evaluate each expression from left to right and performs a falsy check. Depending on the operation, one
of the expressions will be returned. This can be very helpful for variable assignments and should be considered in
order to simplify your code.

**Not recommended**
```
if(!x) {
  if(!y) {
    x = 1;
  } else {
    x = y;
  }
}
```

**Recommended**
```
x = x || y || 1;
```

This shorthand is often used to validated function parameters. The following example illustrates one usage example:

```
(function(log){
  'use strict';

  function multiply(a, b) {
    a = a || 1;
    b = b || 1;

    log('Result ' + a * b);
  }

  multiply(); // Result 1
  multiply(10); // Result 10
  multiply(3, NaN); // Result 3
  multiply(9, 5); // Result 45

}(window.console.log));
```

***

### Semicolons

Always use semicolons. Relying on implicit insertion can cause subtle, hard to debug problems. Don't do it.
You're better than that. There are a couple places where missing semicolons are particularly dangerous:

```
// 1.
MyClass.prototype.myMethod = function() {
  return 42;
}  // No semicolon here.

(function() {
  // Some initialization code wrapped in a function to create a scope for locals.
})();


var x = {
  'i': 1,
  'j': 2
}  // No semicolon here.

// 2.  Trying to do one thing on Internet Explorer and another on Firefox.
// I know you'd never write code like this, but throw me a bone.
[ffVersion, ieVersion][isIE]();


var THINGS_TO_EAT = [apples, oysters, sprayOnCheese]  // No semicolon here.

// 3. conditional execution a la bash
-1 == resultOfOperation() || die();
```

**So what happens?**

1.  JavaScript error - first the function returning 42 is called with the second function as a parameter, then
the number 42 is "called" resulting in an error.
1.  You will most likely get a 'no such property in undefined' error at runtime as it tries to
call `x[ffVersion, ieVersion][isIE]()`.
1.  `die` is always called since the array minus 1 is `NaN` which is never equal to anything (not even if
`resultOfOperation()` returns `NaN`) and `THINGS_TO_EAT` gets assigned the result of `die()`.

**Why?**

JavaScript requires statements to end with a semicolon, except when it thinks it can safely infer their existence.
In each of these examples, a function declaration or object or array literal is used inside a statement. The closing
brackets are not enough to signal the end of the statement. Javascript never ends a statement if the next token is an
infix or bracket operator.

This has really surprised people, so make sure your assignments end with semicolons.

**Clarification: Semicolons and functions**

Semicolons should be included at the end of function expressions, but not at the end of function declarations.
The distinction is best illustrated with an example:

```
var foo = function() {
  return true;
};  // semicolon here.

function foo() {
  return true;
}  // no semicolon here.
```

***

### Nested functions

Nested functions can be very useful, for example in the creation of continuations and for the task of hiding helper
functions. Feel free to use them.

***

### Function declaration within blocks

Do not declare functions in blocks. This is not valid in ECMAScript 5 strict mode. Functions should be declared on
top level. Don't hesitate to use variables initialized with function expressions inside of blocks though:

**Not recommended**
```
if (x) {
  function foo() {}
}
```

**Recommended**
```
if (x) {
  var foo = function() {};
}
```

***

### Exceptions

You basically can't avoid exceptions if you're doing something non-trivial (using an application development framework,
etc.).

Without custom exceptions, returning error information from a function that also returns a value can be tricky, not to
mention inelegant. Bad solutions include passing in a reference type to hold error information or always returning
Objects with a potential error member. These basically amount to a primitive exception handling hack.
Feel free to use custom exceptions when appropriate.

In complex environments you should consider throwing objects rather than just strings (default throws).

```
if(name === undefined) {
  throw {
    name: 'System Error',
    message: 'A name should always be specified!'
  }
}
```

***

### Standard features

Always preferred over non-standards features. For maximum portability and compatibility, always prefer standards
features over non-standards features (e.g., `string.charAt(3)` over `string[3]` and element access with DOM functions
instead of using an application-specific shorthand).

***

### Simple prototypical inheritance

If you need inheritance of your objects in Javascript follow a simple pattern to create inheritance. If you know that
you'll end up with complex object inheritance consider a inheritance library like
[Proto.js by Axel Rauschmayer](https://github.com/rauschma/proto-js).

For simple cases use  like the bellow.

```
(function(log){
  'use strict';

  // Constructor function
  function Apple(name) {
    this.name = name;
  }
  // Defining a method of apple
  Apple.prototype.eat = function() {
    log('Eating ' + this.name);
  };

  // Constructor function
  function GrannySmithApple() {
    // Invoking parent constructor
    Apple.prototype.constructor.call(this, 'Granny Smith');
  }
  // Set parent prototype while creating a copy with Object.create
  GrannySmithApple.prototype = Object.create(Apple.prototype);
  // Set constructor to the sub type, otherwise points to Apple
  GrannySmithApple.prototype.constructor = GrannySmithApple;

  // Calling a super method
  GrannySmithApple.prototype.eat = function() {
    // Be sure to apply it onto our current object with call(this)
    Apple.prototype.eat.call(this);

    log('Poor Grany Smith');
  };

  // Instantiation
  var apple = new Apple('Test Apple');
  var grannyApple = new GrannySmithApple();

  log(apple.name); // Test Apple
  log(grannyApple.name); // Granny Smith

  // Instance checks
  log(apple instanceof Apple); // true
  log(apple instanceof GrannySmithApple); // false

  log(grannyApple instanceof Apple); // true
  log(grannyApple instanceof GrannySmithApple); // true

  // Calling method that calls super method
  grannyApple.eat(); // Eating Granny Smith\nPoor Grany Smith

}(window.console.log));
```

***

### Use Closures

The ability to create closures is perhaps the most useful and often overlooked feature of JS.
Here is [a good description of how closures work](http://jibbering.com/faq/faq_notes/closures.html).

***

### Don't create functions in loops

It's generally a potential source for bugs if you write functions that create a closure inside of simple loops. The
following example illustrates a common pitfall.

**Not recommended**
```
(function(log, w){
  'use strict';

  // numbers and i is defined in the current function closure
  var numbers = [1, 2, 3],
      i;

  for(i = 0; i < numbers.length; i++) {
    w.setTimeout(function() {
      // At the moment when this gets executed the i variable, coming from the outer function scope
      // is set to 3 and the current program is alerting the message 3 times
      // 'Index 3 with number undefined
      // If you understand closures in javascript you know how to deal with those cases
      // It's best to just avoid functions / new closures in loops as this prevents those issues

      w.alert('Index ' + i + ' with number ' + numbers[i]);
    }, 0);
  }

}(window.console.log, window));
```

The following variation of the above example solves our problem / bug but still violates our policy to not create
functions / closures inside of loops.

**Not recommended**
```
(function(log, w){
  'use strict';

  // numbers and i is defined in the current function closure
  var numbers = [1, 2, 3],
      i;

  for(i = 0; i < numbers.length; i++) {
    // Creating a new closure scope with an IIFE solves the problem
    // The delayed function will use index and number which are
    // in their own closure scope (one closure per loop iteration).
    // ---
    // Still this is not recommended as we violate our rule to not
    // create functions within loops and we are creating two!

    (function(index, number){
      w.setTimeout(function() {
        // Will output as expected 0 > 1, 1 > 2, 2 > 3
        w.alert('Index ' + index + ' with number ' + number);
      }, 0);
    }(i, numbers[i]));
  }

}(window.console.log, window));
```

The following variation solves our problem / bug and we also comply with our style guide. However, this seems to be
heavily overcomplicated and we should look for a better / easier way.

**Partially recommended**
```
(function(log, w){
  'use strict';

  // numbers and i is defined in the current function closure
  var numbers = [1, 2, 3],
      i;

  // Create a function outside of the loop that will accept arguments to create a
  // function closure scope. This function will return a function that executes in this
  // closure parent scope.
  function alertIndexWithNumber(index, number) {
    return function() {
      w.alert('Index ' + index + ' with number ' + number);
    };
  }

  // First parameter is a function call that returns a function.
  // ---
  // This solves our problem and we don't create a function inside our loop
  for(i = 0; i < numbers.length; i++) {
    w.setTimeout(alertIndexWithNumber(i, numbers[i]), 0);
  }

}(window.console.log, window));
```

By using a functional approach for our loop we solve the problem immediately as we create a new closure with every loop.
Functional style is recommended and will also lead to more natural and expected results.

**Recommended**
```
(function(log, w){
  'use strict';

  // numbers and i is defined in the current function closure
  var numbers = [1, 2, 3],
      i;

  numbers.forEach(function(number, index) {
    w.setTimeout(function() {
      w.alert('Index ' + index + ' with number ' + number);
    }, 0);
  });

}(window.console.log, window));
```

***

### The (evil) eval function

`eval()` makes for confusing semantics and is dangerous to use if the string being eval()'d contains user input.
There's usually a better, clearer, and safer way to write your code, so its use is generally not permitted.

***

### The this keyword

Use the `this` keyword only in object constructors, methods, and in setting up closures. The semantics of this can be
tricky. At times it refers to the global object (in most places), the scope of the caller (in eval), a node in the DOM
tree (when attached using an event handler HTML attribute), a newly created object (in a constructor), or some other
object (if function was call()ed or apply()ed).

Because this is so easy to get wrong, limit its use to those places where it is required:

- in constructors
- in methods of objects (including in the creation of closures)

***

### Functional is preferred

Using functional style programming you can simplify your code and reduce maintenance cost by gaining easy re-usability,
proper isolation and less dependencies.

The following example compares two solutions for the same problem of summing up all number elements in an array. The
first example is a classical procedural approach while the second one makes use of functional style programming and the
ECMA Script 5.1 array functions.

Exception: In situations where performance is considered to be more important than maintainability then you might
consider the most performant solution over the most maintainable (i.e. using simple for loop over forEach)

**Not recommended**
```
(function(log){
  'use strict';

  var arr = [10, 3, 7, 9, 100, 20],
      sum = 0,
      i;


  for(i = 0; i < arr.length; i++) {
    sum += arr[i];
  }

  log('The sum of array ' + arr + ' is: ' + sum)

}(window.console.log));
```

**Recommended**
```
(function(log){
  'use strict';

  var arr = [10, 3, 7, 9, 100, 20];

  var sum = arr.reduce(function(prevValue, currentValue) {
    return prevValue + currentValue;
  }, 0);

  log('The sum of array ' + arr + ' is: ' + sum);

}(window.console.log));
```

An other example would be to filter an array for certain criteria so that we can create a new array that only contains
those elements that match the criteria.

**Not recommended**
```
(function(log){
  'use strict';

  var numbers = [11, 3, 7, 9, 100, 20, 14, 10],
      numbersGreaterTen = [],
      i;


  for(i = 0; i < numbers.length; i++) {
    if(numbers[i] > 10) {
      numbersGreaterTen.push(numbers[i]);
    }
  }

  log('From the list of numbers ' + numbers + ' only ' + numbersGreaterTen + ' are greater than ten');

}(window.console.log));
```

**Recommended**
```
(function(log){
  'use strict';

  var numbers = [11, 3, 7, 9, 100, 20, 14, 10];

  var numbersGreaterTen = numbers.filter(function(element) {
    return element > 10;
  });

  log('From the list of numbers ' + numbers + ' only ' + numbersGreaterTen + ' are greater than ten');

}(window.console.log));
```

***

### Use ECMA Script 5

Use the syntactical sugar and functional style that was added with ECMA Script 5. It's simplifying your programming
style and makes your code more flexible and re-usable.

***

### Array and object property iteration

The ECMA5 way to iterate over an array is preferred. Use Array.forEach or Array.every if you would like to cancel the
iteration at a certain condition.

```
(function(log){
  'use strict';

  // Iterate over an array and break at a certain condition
  [1, 2, 3, 4, 5].every(function(element, index, arr) {
    log(element + ' at index ' + index + ' in array ' + arr);

    if(index !== 5) {
      return true;
    }
  });

  // Defining a simple javascript object
  var obj = {
    a: 'A',
    b: 'B',
    'c-d-e': 'CDE'
  };

  // Iterating over the object keys
  Object.keys(obj).forEach(function(element, index, arr) {
    log('Key ' + element + ' has value ' + obj[element]);
  });

}(window.console.log));
```

***

### Don't use switch

switch is a very error prone control statement in every programming language. Use if else if instead.

***

### Array and Object literals

Use Array and Object literals instead of Array and Object constructors. Array constructors are error-prone due to their
arguments.

**Not recommended**
```
// Length is 3.
var a1 = new Array(x1, x2, x3);

// Length is 2.
var a2 = new Array(x1, x2);

// If x1 is a number and it is a natural number the length will be x1.
// If x1 is a number but not a natural number this will throw an exception.
// Otherwise the array will have one element with x1 as its value.
var a3 = new Array(x1);

// Length is 0.
var a4 = new Array();
```

Because of this, if someone changes the code to pass 1 argument instead of 2 arguments, the array might not have the
expected length. To avoid these kinds of weird cases, always use the more readable array literal.

**Recommended**
```
var a = [x1, x2, x3];
var a2 = [x1, x2];
var a3 = [x1];
var a4 = [];
```

Object constructors don't have the same problems, but for readability and consistency object literals should be used.

**Not recommended**
```
var o = new Object();

var o2 = new Object();
o2.a = 0;
o2.b = 1;
o2.c = 2;
o2['strange key'] = 3;
```

Should be written as:

**Recommended**
```
var o = {};

var o2 = {
  a: 0,
  b: 1,
  c: 2,
  'strange key': 3
};
```

***

### Modifying prototypes of builtin objects

Modifying builtins like `Object.prototype` and `Array.prototype` are strictly forbidden. Modifying other builtins like
`Function.prototype` is less dangerous but still leads to hard to debug issues in production and should be avoided.

***

### Custom toString() methods

You can control how your objects string-ify themselves by defining a custom `toString()` method. This is fine, but you
need to ensure that your method (1) always succeeds and (2) does not have side-effects. If your method doesn't meet
these criteria, it's very easy to run into serious problems. For example, if `toString()` calls a method that does an
assert, assert might try to output the name of the object in which it failed, which of course requires
calling `toString()`.

***

### Parentheses

Use sparingly and in general only where required by the syntax and semantics. Never use parentheses for unary
operators such as `delete`, `typeof` and `void` or after keywords such as `return`, `throw` as well
as others (`case`, in or `new`).

***

### Strings

For consistency single-quotes (') are preferred to double-quotes ("). This is helpful when creating
strings that include HTML:

```
var msg = 'This is some HTML <div class="makes-sense"></div>';
```

***

### Conditional Ternary Operator (shorthand if)

Use the ternary operator for assignments or return statements. Use it only in simple conditions and avoid it in complex
ones. No body likes to wrap his brain around 10 lines of nested ternary operators.

**Not recommended**
```
if(x === 10) {
  return 'valid';
} else {
  return 'invalid';
}
```

**Recommended**
```
return x === 10 ? 'valid' : 'invalid';
```

***

## CSS and Sass (SCSS) style rules

***

### ID and class naming

Instead of presentational or cryptic names, always use ID and class names that reflect the purpose of the element in
question, or that are otherwise generic.

Names that are specific and reflect the purpose of the element should be preferred as these are most understandable
and the least likely to change.

Generic names are simply a fallback for elements that have no particular or no meaning different from their siblings.
They are typically needed as “helpers.”

Even though class names and ID's have no semantic meaning to computer interpreters, semantic names are often the right
choice as they represent the information meaning and don't introduce presentational constraints.

**Not recommended**
```
.fw-800 {
  font-weight: 800;
}

.red {
  color: red;
}
```

**Recommended**
```
.heavy {
  font-weight: 800;
}

.important {
  color: red;
}
```

***

### Avoid ID's where possible

In general ID's should not be used to apply style. Styles on ID's can't be re-used and you can only use them once per
page. The only valid location for using an ID would be to identify a page or a whole site. Still you should always
consider using a class that you use once instead of an id.

**Not recommended**
```
#content .title {
  font-size: 2em;
}
```

**Recommended**
```
.content .title {
  font-size: 2em;
}
```

One other argument against using ID's would be that selector chains containing ID's are over-prioritized. A selector
containing just one ID is weighted higher than a selector containing 1000 class names only which makes it very odd.

```
// This selecor is considered with higher priority
#content .title {
  color: red;
}

// than this selector!
html body div.content.news-content .title.content-title.important {
  color: blue;
}
```

***

### Avoid elements in CSS selectors

When building your selectors use clear, precise and sensible class names. Don't use element selectors. If you're only
concerned about your class names and not about your elements your code gets a lot more maintainable.

From a separation of concerns perspective you don't want to dictate the markup / semantics from the presentation layer.
It might be that a ordered list needs to be changed to an unordered list or that a div will be converted to an article.
If you only care about sensible class names and don't use element selectors you'd only need to change your markup and
not your css.

**Not recommended**
```
div.content > header.content-header > h2.title {
  font-size: 2em;
}
```

**Recommended**
```
.content > .content-header > .title {
  font-size: 2em;
}
```

***

### Be as precise as possible

A lot of front-end developers don't use direct child selectors when they write their selector chains. Sometimes this
can cause painful design issues and other times it's just a performance eater. However, in any case, it's a very bad
practice. If you don't write very generic selectors that need to match down to the bottom of the DOM you should always
consider direct child selectors.

Consider the following DOM:

```
<article class="content news-content">
  <span class="title">News event</span>
  <div class="content-body">
    <div class="title content-title">
      Check this out
    </div>

    <p>This is a news article content</p>

    <div class="teaser">
      <div class="title">Buy this</div>
      <div class="teaser-content">Yey!</div>
    </div>
  </div>
</article>
```

The following CSS would apply to all three elements that have a title class. This then would need to be overridden again
with more granular selectors in order to fix the content title and the teaser title.

**Not recommended**
```
.content .title {
  font-size: 2rem;
}
```

**Recommended**
```
.content > .title {
  font-size: 2rem;
}

.content > .content-body > .title {
  font-size: 1.5rem;
}

.content > .content-body > .teaser > .title {
  font-size: 1.2rem;
}
```

***

### Shorthand Properties

CSS offers a variety of shorthand properties (like font) that should be used whenever possible, even in cases where
only one value is explicitly set.

Using shorthand properties is useful for code efficiency and understandability.

**Not recommended**
```
border-top-style: none;
font-family: palatino, georgia, serif;
font-size: 100%;
line-height: 1.6;
padding-bottom: 2em;
padding-left: 1em;
padding-right: 1em;
padding-top: 0;
```

**Recommended**
```
border-top: 0;
font: 100%/1.6 palatino, georgia, serif;
padding: 0 1em 2em;
```

***

### 0 and units

Omit unit specification after “0” values. Do not use units after 0 values unless they are required.

**Not recommended**
```
padding-bottom: 0px;
margin: 0em;
```

**Recommended**
```
padding-bottom: 0;
margin: 0;
```

***

### Hexadecimal Notation

Use 3 character hexadecimal notation where possible. For color values that permit it, 3 character hexadecimal notation
is shorter and more succinct.

Always use lower case hex digits.

**Not recommended**
```
color: #FF33AA;
```

**Recommended**
```
color: #f3a;
```

***

### ID and Class Name Delimiters

Separate words in ID and class names by a hyphen. Do not concatenate words and abbreviations in selectors by any
characters (including none at all) other than hyphens, in order to improve understanding and scannability.

Also as the standard foresees attribute selectors that recognise hyphens as separator of words `[attribute|=value]`
it's best to stick to the hyphen as separator.

**Not recommended**
```
.demoimage {}
.error_status {}
```

**Recommended**
```
#video-id {}
.ads-sample {}
```

***

### Hacks

Avoid user agent detection as well as CSS “hacks”—try a different approach first. It’s tempting to address styling
differences over user agent detection or special CSS filters, workarounds, and hacks. Both approaches should be
considered last resort in order to achieve and maintain an efficient and manageable code base. Put another way, giving
detection and hacks a free pass will hurt projects in the long run as projects tend to take the way of least
resistance. That is, allowing and making it easy to use detection and hacks means using detection and hacks more
frequently—and more frequently is too frequently.

***

### Declaration Order

This example should give a rough outline of how to order CSS properties within a selector. This is important in order
to guarantee better readability and better scannability.

As a best practice we should follow the following ordering (in the same order as the listing):

1.  structural
  1.  display
  1.  position, left, top, right etc.
  1.  overflow, float, clear etc.
  1.  margin, padding
1.  skin
  1.  background, border etc.
  1.  font, text

**Not recommended**
```
.box {
  font-family: 'Arial', sans-serif;
  border: 3px solid #ddd;
  left: 30%;
  position: absolute;
  text-transform: uppercase;
  background-color: #eee;
  right: 30%;
  isplay: block;
  font-size: 1.5rem;
  overflow: hidden;
  padding: 1em;
  margin: 1em;
}
```

**Recommended**
```
.box {
  display: block;
  position: absolute;
  left: 30%;
  right: 30%;
  overflow: hidden;
  margin: 1em;
  padding: 1em;
  background-color: #eee;
  border: 3px solid #ddd;
  font-family: 'Arial', sans-serif;
  font-size: 1.5rem;
  text-transform: uppercase;
}
```

***

### Declaration Stops

End every declaration with a semicolon for consistency and extensibility reasons and put each declaration on a new line.

**Not recommended**
```
.test {
  display: block; height: 100px
}
```

**Recommended**
```
.test {
  display: block;
  height: 100px;
}
```

***

### Property Name Stops

Use a space after a property name’s colon. Always use a single space between property and value (but no space between
property and colon) for consistency reasons.

**Not recommended**
```
h3 {
  font-weight:bold;
}
```

**Recommended**
```
h3 {
  font-weight: bold;
}
```

***

### Selector and Declaration Separation

Always start a new line for each selector and declaration.

**Not recommended**
```
a:focus, a:active {
  position: relative; top: 1px;
}
```

**Recommended**
```
h1,
h2,
h3 {
  font-weight: normal;
  line-height: 1.2;
}
```

***

### Rule Separation

Always put a blank line (two line breaks) between rules.

**Recommended**
```
html {
  background: #fff;
}

body {
  margin: auto;
  width: 50%;
}
```

***

### CSS Quotation Marks

Use double ("") rather than single ('') quotation marks for attribute selectors or property values.
Do not use quotation marks in URI values (url()).

**Not recommended**
```
@import url('//cdn.com/foundation.css');

html {
  font-family: 'open sans', arial, sans-serif;
}

body:after {
  content: 'pause';
}
```

**Recommended**
```
@import url(//cdn.com/foundation.css);

html {
  font-family: "open sans", arial, sans-serif;
}

body:after {
  content: "pause";
}
```

***

### Nested selectors (SCSS)

In Sass you can nest selectors which is much cleaner and the code becomes much more readable. Nest all selectors but
try to avoid nesting without any content. If you need to specify some style attributes for a child element where the
parent element will not receive any styling use a regular CSS selector chain. This will prevent your script to look
overcomplicated.

**Not recommended**
```scss
// Not a good example by not making use of nesting at all
.content {
  display: block;
}

.content > .news-article > .title {
  font-size: 1.2em;
}
```

**Not recommended**
```scss
// Using nesting is better but not in all cases
// Avoid nesting when there is no attributes and use selector chains instead
.content {
  display: block;

  > .news-article {
    > .title {
      font-size: 1.2em;
    }
  }
}
```

**Recommended**
```scss
// This example takes the best approach while nesting but use selector chains where possible
.content {
  display: block;

  > .news-article > .title {
    font-size: 1.2em;
  }
}
```

***

### Introducing space while nesting (SCSS)

If you nest your selectors introduce blank line between your nested selectors and the css attributes.

**Not recommended**
```scss
.content {
  display: block;
  > .news-article {
    background-color: #eee;
    > .title {
      font-size: 1.2em;
    }
    > .article-footnote {
      font-size: 0.8em;
    }
  }
}
```

**Recommended**
```scss
.content {
  display: block;

  > .news-article {
    background-color: #eee;

    > .title {
      font-size: 1.2em;
    }

    > .article-footnote {
      font-size: 0.8em;
    }
  }
}
```

***

### Contextual media queries (SCSS)

While nesting your selectors you can also make use of contextual media queries within Sass. With Sass you can use media
queries at any given nesting level. The resulting CSS will be converted so that the media query gets rendered around the
selector.

This technique is very handy and helps to keep media queries in the context where they belong to. With a mobile first
approach this allows you to write your mobile styles first and then use contextual media queries where ever you need
them in order to provide the desktop styles.

**Not recommended**
```scss
// This mobile first example looks like plain CSS where the whole structure of SCSS is repeated
// on the bottom in a media query. This is error prone and makes maintenance harder as it's not so easy to relate
// the content in the media query to the content in the upper part (mobile style)

.content-page {
  font-size: 1.2rem;

  > .main {
    background-color: whitesmoke;

    > .latest-news {
      padding: 1rem;

      > .news-article {
        padding: 1rem;

        > .title {
          font-size: 2rem;
        }
      }
    }

    > .content {
      margin-top: 2rem;
      padding: 1rem;
    }
  }

  > .page-footer {
    margin-top: 2rem;
    font-size: 1rem;
  }
}

@media screen and (min-width: 641px) {
  .content-page {
    font-size: 1rem;

    > .main > .latest-news > .news-article > .title {
      font-size: 3rem;
    }

    > .page-footer {
      font-size: 0.8rem;
    }
  }
}
```

**Recommended**
```scss
// This is the same example as above but here we use contextual media queries in order to put the different styles
// for different media into the right context.

.content-page {
  font-size: 1.2rem;

  @media screen and (min-width: 641px) {
    font-size: 1rem;
  }

  > .main {
    background-color: whitesmoke;

    > .latest-news {
      padding: 1rem;

      > .news-article {
        padding: 1rem;

        > .title {
          font-size: 2rem;

          @media screen and (min-width: 641px) {
            font-size: 3rem;
          }
        }
      }
    }

    > .content {
      margin-top: 2rem;
      padding: 1rem;
    }
  }

  > .page-footer {
    margin-top: 2rem;
    font-size: 1rem;

    @media screen and (min-width: 641px) {
      font-size: 0.8rem;
    }
  }
}
```

***

### Nesting order and the parent selector (SCSS)

While using the nesting features of Sass it's important to have a clear order to put your nesting in. A SCSS block
should have the following content order.

1.  Current selector's style attributes
1.  Pseudo selectors with parent selector (:first-letter, :hover, :active etc)
1.  Pseudo elements (:before and :after)
1.  State classe with parent selector (.selected, .active, .enlarged etc.)
1.  Contextual media queries with Sass
1.  Sub selectors as the last part

The following example should illustrate how this ordering will achieve a clear structure while making use of the Sass
parent selector.

**Recommended**
```scss
.product-teaser {
  // 1. Style attributes
  display: inline-block;
  padding: 1rem;
  background-color: whitesmoke;
  color: grey;

  // 2. Pseudo selectors with parent selector
  &:hover {
    color: black;
  }

  // 3. Pseudo elements with parent selector
  &:before {
    content: "";
    display: block;
    border-top: 1px solid grey;
  }

  &:after {
    content: "";
    display: block;
    border-top: 1px solid grey;
  }

  // 4. State classes with parent selector
  &.active {
    background-color: pink;
    color: red;

    // 4.2. Pseuso selector in state class selector
    &:hover {
      color: darkred;
    }
  }

  // 5. Contextual media queries
  @media screen and (max-width: 640px) {
    display: block;
    font-size: 2em;
  }

  // 6. Sub selectors
  > .content > .title {
    font-size: 1.2em;

    // 6.5. Contextual media queries in sub selector
    @media screen and (max-width: 640px) {
      letter-spacing: 0.2em;
      text-transform: uppercase;
    }
  }
}
```

