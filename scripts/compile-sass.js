function compileSass(inFilePath, outDirectoryPath) {
  const sass = require('node-sass');
  const postcss = require('postcss');
  const fsp = require('fs-promise');
  const path = require('path');
  const baseFileName = path.basename(inFilePath, '.scss');
  const cssBaseName = `${baseFileName}.css`;
  const cssMapBaseName = `${baseFileName}.css.map`;
  const cssMinBaseName = `${baseFileName}.min.css`;
  const cssMinMapBaseName = `${baseFileName}.min.css.map`;

  sass.render({
    file: inFilePath,
    sourceMap: true,
    outFile: cssBaseName
  }, (err, result) => {
    postcss([require('autoprefixer')])
      .process(result.css.toString(), {
        from: cssBaseName,
        to: cssBaseName,
        map: {
          prev: result.map.toString()
        }
      })
      .then((postCssResult) => {
        return Promise.all([
          fsp.writeFile(path.join(outDirectoryPath, cssBaseName), postCssResult.css),
          fsp.writeFile(path.join(outDirectoryPath, cssMapBaseName), JSON.stringify(postCssResult.map))
        ]).then(() => postCssResult)
      })
      .then((postCssResult) => {
        return postcss([require('cssnano')])
          .process(postCssResult.css, {
            from: cssBaseName,
            to: cssMinBaseName,
            map: {
              prev: JSON.stringify(postCssResult.map)
            }
          });
      })
      .then((postCssResult) => {
        return Promise.all([
          fsp.writeFile(path.join(outDirectoryPath, cssMinBaseName), postCssResult.css),
          fsp.writeFile(path.join(outDirectoryPath, cssMinMapBaseName), JSON.stringify(postCssResult.map))
        ]).then(() => postCssResult)
      });
  });
}

module.exports = compileSass;
