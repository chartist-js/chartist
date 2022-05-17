const isProd = process.env.NODE_ENV !== 'development';

module.exports = {
  plugins: [
    require('postcss-preset-env'),
    isProd &&
      require('cssnano')({
        preset: 'default'
      })
  ].filter(Boolean)
};
