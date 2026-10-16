# The 0.x docs

These files are the Chartist 0.11 documentation, formerly at
`https://gionkunz.github.io/chartist-js/`. Astro copies them to `/v0/` of the
site as they are. The old URLs redirect to chartist.dev: pages without a
`#hash` to their v2 counterpart, sections without one to the same place
here.

They are not edited by hand beyond the changes listed below. The 0.x
toolchain (Grunt, Assemble, Bower) isn't kept.

## Where they come from

The `gh-pages` branch of `gionkunz/chartist-js` at `c1e49e1` (August 2022),
the last build of the 0.x site. Copied: the six pages (`index.html`,
`getting-started.html`, `examples.html`, `api-documentation.html`,
`plugins.html`, `apidoc/index.html`) and the files they load
(`scripts/all.js`, `styles/`, `images/`, `favicon.ico`, `apidoc/scripts/`,
`apidoc/styles/`).

Not copied, because no page loads them: `bower_components/` (most of the
build's 19 MB), `test-chart.html`, `doc-clean-pull.sh`, `404.html` and
`robots.txt`.

## What changed

- **Removed** the "Get awesome Dashboard Templates by Creative Tim" section
  of the home page, its `.affiliate-project*` CSS and its three images on
  S3; the Google Analytics snippet on every page; the version notice pop-up
  added in 2022 (its markup, CSS and script); and the html5shiv script for
  IE 8 in `apidoc/index.html`, whose host is gone.
- **Fonts are served from `fonts/`** instead of Google Fonts and cdnjs: the
  WebFont loader snippet on each page is replaced by a link to
  `fonts/fonts.css`, which loads Oxygen 300/400/700 and Source Code Pro
  400/700 (SIL OFL 1.1, latin subset from fontsource) and Font Awesome
  4.1.0. Their licenses are next to them. With this, no page makes a request
  to another host.
- **Added** a note at the top of each page: "This is the archived
  documentation of Chartist 0.11. The current docs are at chartist.dev." Its
  `<style>` sits next to it.
- **`apidoc/index.html`** shows `images/chartist-icon.svg` instead of a
  Chartist Guy GIF on `raw.github.com` that no longer exists.
