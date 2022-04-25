#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

const { plugins } = require('../postcss.config');
const pkg = require('../package.json');

const cwd = process.cwd();
const input = pkg.style;
const output = pkg.publishConfig.style;
const sourceMapOutput = pkg.publishConfig.style.replace('.css', '.css.map');

(async () => {
  let styles

  styles = sass.compile(pkg.style, {
    sourceMap: true
  })

  styles.sourceMap.sources = styles.sourceMap.sources.map(_ => _.replace(cwd, ''))

  styles = await postcss(plugins).process(styles.css, {
    from: input,
    to: output,
    map: {
      prev: styles.sourceMap
    }
  })

  const map = styles.map.toString()
  const css = styles.css + `\n/*# sourceMappingURL=${path.basename(sourceMapOutput)} */`

  await fs.mkdir(path.dirname(output), {
    recursive: true
  })
  await Promise.all([
    fs.writeFile(output, css),
    fs.writeFile(sourceMapOutput, map)
  ])
})()
