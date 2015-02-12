# Big welcome by the Chartist Guy
[![npm version](http://img.shields.io/npm/v/chartist.svg)](https://npmjs.org/package/chartist) [![build status](http://img.shields.io/travis/gionkunz/chartist-js.svg)](https://travis-ci.org/gionkunz/chartist-js) [![Inline docs](http://inch-ci.org/github/gionkunz/chartist-js.svg?branch=develop)](http://inch-ci.org/github/gionkunz/chartist-js)

![The Chartist Guy](https://raw.github.com/gionkunz/chartist-js/develop/site/images/chartist-guy.gif "The Chartist Guy")

*Checkout the documentation site at http://gionkunz.github.io/chartist-js/*

*Checkout this lightning talk that gives you an overview of Chartist in 5 minutes https://www.youtube.com/watch?v=WdYzPhOB_c8*

*Guest talk of the Chartist.js Guy at the Treehouse Show https://www.youtube.com/watch?v=h9oH0iDaZDQ&t=2m40s*

Chartist.js is a simple responsive charting library built with SVG. There are hundreds of nice charting libraries already
out there, but they are either:

* not responsive
* use the wrong technologies for illustration (canvas)
* are not flexible enough while keeping the configuration simple
* are not friendly to your own code
* are not friendly to designers
* have unnecessary dependencies to monolithic libraries 
* more annoying things

That's why we started Chartist.js and our goal is to solve all of the above issues.

## What is it made for?

Chartist's goal is to provide a simple, lightweight and unintrusive library to responsively craft charts on your website. 
It's important to understand that one of the main intentions of Chartist.js is to rely on standards rather than providing 
it's own solution to a problem which is already solved by those standards. We need to leverage the power of browsers 
today and say good bye to the idea of solving all problems ourselves.

Chartist works with inline-SVG and therefore leverages the power of the DOM to provide parts of its functionality. This 
also means that Chartist does not provide it's own event handling, labels, behaviors or anything else that can just be 
done with plain HTML, JavaScript and CSS. The single and only responsibility of Chartist is to help you drawing "Simple 
responsive Charts" using inline-SVG in the DOM, CSS to style and JavaScript to provide an API for configuring your charts.

## Example site

You can visit this Site http://gionkunz.github.io/chartist-js/ which is in fact a build of the current project.
We are still developing and constantly add features but you can already use Chartist.js in your projects as we have 
reached a stable and reliable state already.

## Version notes

We are currently still heavily developing in order to make Chartist.js better. Your help is needed! Please contribute
to the project if you like the idea and the concept and help us to bring nice looking responsive open-source charts
to the masses.

### Important missing stuff

1. Jasmine Tests!
2. Documentation: JSDoc, Getting started documentation and landing page
3. Better accessibility using ARIA and other optimizations
4. Better interfaces to the library (i.e. jQuery with data-* attributes for configuration), Angular.js directive etc.
5. Richer Sass / CSS framework
6. Other charts types (spider etc.)

## Contribution

We are looking for people who share the idea of having a simple, flexible charting library that is responsive and uses
modern and future-proof technologies. The goal of this project is to create a responsive charting library where developers
have their joy in using it and designers love it because of the designing flexibility they have.

Contribute if you like the Chartist Guy!
