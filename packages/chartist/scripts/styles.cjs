#!/usr/bin/env node

/**
 * Builds the published styles into dist/:
 *
 * - index.css (+ map)       readable CSS (postcss-preset-env)
 * - index.min.css (+ map)   minified CSS (cssnano)
 * - chartist.min.css        copy of index.min.css under the 0.x file name
 * - themes/<name>.css, themes/<name>.min.css
 *                           opt-in themes (src/styles/themes/*.scss)
 * - scss/                   the Sass sources (index.scss, _settings.scss,
 *                           themes/)
 * - index.scss, _settings.scss
 *                           1.x entry points, forwarding to scss/
 *
 * Source maps embed their sources and point to the published scss/ copies,
 * so no map references a file that is not in the package (#1409).
 */

const fs = require('fs').promises;
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');
const presetEnv = require('postcss-preset-env');
const cssnano = require('cssnano');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src/styles');
const distDir = path.join(root, 'dist');
const scssDir = path.join(distDir, 'scss');
const input = path.join(srcDir, 'index.scss');

/** Points Sass sources (file: URLs) to their published copies in dist/scss/. */
function publishedSources(map) {
  const json = map.toJSON ? map.toJSON() : map;
  json.sources = json.sources.map(source =>
    source.startsWith('file:') ? `scss/${path.basename(source)}` : source
  );
  return json;
}

async function write(file, css, map) {
  const mapFile = `${file}.map`;
  await Promise.all([
    fs.writeFile(
      path.join(distDir, file),
      `${css}\n/*# sourceMappingURL=${mapFile} */\n`
    ),
    fs.writeFile(
      path.join(distDir, mapFile),
      JSON.stringify(publishedSources(map))
    )
  ]);
}

async function compile() {
  const compiled = sass.compile(input, {
    style: 'expanded',
    sourceMap: true,
    sourceMapIncludeSources: true,
    // The 1.x sources still use @import and global functions. Migrating
    // them to the module system is part of the styling work, not this build.
    silenceDeprecations: ['import', 'global-builtin']
  });

  const map = {
    inline: false,
    annotation: false,
    sourcesContent: true
  };

  // `from` is the output file itself: anything PostCSS cannot map back to
  // Sass is attributed to index.css, which is published.
  const readable = await postcss([env()]).process(compiled.css, {
    from: path.join(distDir, 'index.css'),
    to: path.join(distDir, 'index.css'),
    map: { ...map, prev: publishedSources(compiled.sourceMap) }
  });

  const minified = await postcss([cssnano({ preset: 'default' })]).process(
    readable.css,
    {
      from: path.join(distDir, 'index.css'),
      to: path.join(distDir, 'index.min.css'),
      map: { ...map, prev: readable.map.toJSON() }
    }
  );

  await write('index.css', readable.css, readable.map);
  await write('index.min.css', minified.css, minified.map);
  await fs.copyFile(
    path.join(distDir, 'index.min.css'),
    path.join(distDir, 'chartist.min.css')
  );
}

/**
 * postcss-preset-env without its custom-properties transform: the styles
 * read --ct-* properties at runtime, with their fallbacks inside var().
 */
function env() {
  return presetEnv({ features: { 'custom-properties': false } });
}

/** Compiles each theme to dist/themes/<name>.css and .min.css. */
async function compileThemes() {
  const themesDir = path.join(srcDir, 'themes');
  const outDir = path.join(distDir, 'themes');
  await fs.mkdir(outDir, { recursive: true });
  const themes = (await fs.readdir(themesDir)).filter(file =>
    file.endsWith('.scss')
  );
  await Promise.all(
    themes.map(async file => {
      const name = path.basename(file, '.scss');
      const { css } = sass.compile(path.join(themesDir, file), {
        style: 'expanded'
      });
      const readable = await postcss([env()]).process(css, { from: undefined });
      const minified = await postcss([cssnano({ preset: 'default' })]).process(
        readable.css,
        { from: undefined }
      );
      await Promise.all([
        fs.writeFile(path.join(outDir, `${name}.css`), readable.css),
        fs.writeFile(path.join(outDir, `${name}.min.css`), minified.css)
      ]);
    })
  );
}

async function copySass() {
  await fs.mkdir(path.join(scssDir, 'themes'), { recursive: true });
  const themeFiles = (await fs.readdir(path.join(srcDir, 'themes'))).filter(
    file => file.endsWith('.scss')
  );

  const files = (await fs.readdir(srcDir)).filter(file =>
    file.endsWith('.scss')
  );

  await Promise.all([
    ...files.map(file =>
      fs.copyFile(path.join(srcDir, file), path.join(scssDir, file))
    ),
    ...themeFiles.map(file =>
      fs.copyFile(
        path.join(srcDir, 'themes', file),
        path.join(scssDir, 'themes', file)
      )
    ),
    // 1.x published the Sass files flat in dist/. Keep those paths working
    // without duplicating the sources. @import keeps the 1.x semantics:
    // variables set before the import override the !default settings.
    fs.writeFile(path.join(distDir, 'index.scss'), '@import "scss/index";\n'),
    fs.writeFile(
      path.join(distDir, '_settings.scss'),
      '@import "scss/settings";\n'
    )
  ]);
}

async function main() {
  await fs.mkdir(distDir, { recursive: true });
  await Promise.all([compile(), compileThemes(), copySass()]);
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
