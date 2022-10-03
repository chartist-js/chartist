#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');

const { plugins } = require('../postcss.config.cjs');
const pkg = require('../package.json');

const cwd = process.cwd();
const input = process.argv[2];
const output = pkg.style;
const sourceMapOutput = output.replace('.css', '.css.map');

async function compile() {
  let styles;

  styles = sass.compile(input, {
    sourceMap: true
  });

  styles.sourceMap.sources = styles.sourceMap.sources.map(_ =>
    _.replace(cwd, '')
  );

  styles = await postcss(plugins).process(styles.css, {
    from: input,
    to: output,
    map: {
      prev: styles.sourceMap
    }
  });

  const map = styles.map.toString();
  const css =
    styles.css + `\n/*# sourceMappingURL=${path.basename(sourceMapOutput)} */`;

  await fs.mkdir(path.dirname(output), {
    recursive: true
  });
  await Promise.all([
    fs.writeFile(output, css),
    fs.writeFile(sourceMapOutput, map)
  ]);
}

async function copySrc() {
  const srcDir = path.dirname(input);
  const distDir = path.dirname(output);
  const srcFiles = await fs.readdir(srcDir);

  await Promise.all(
    srcFiles.map(file =>
      fs.copyFile(path.join(srcDir, file), path.join(distDir, file))
    )
  );
}

Promise.all([compile(), copySrc()]);
